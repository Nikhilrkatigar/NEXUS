const express = require("express");

const Registration = require("../models/Registration");
const Settings = require("../models/Settings");
const Timeline = require("../models/Timeline");
const { writeAuditLog } = require("../audit");
const { clientIp, makeError, serializeRegistration } = require("../utils");
const {
  validateTeamComposition,
  getEventRequirements,
  getAllEventRequirements,
  formatValidationErrors
} = require("../registrationValidator");

const router = express.Router();

async function generateRegistrationCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    const existing = await Registration.exists({ code });
    if (!existing) {
      return code;
    }
  }

  return String(Date.now()).slice(-5);
}

router.get("/site", async (req, res, next) => {
  try {
    const [settings, timeline] = await Promise.all([
      Settings.findOne({ key: "default" }).lean(),
      Timeline.findOne({ key: "default" }).lean()
    ]);

    res.json({
      settings: settings ? settings.values : {},
      timeline: timeline ? timeline.items : []
    });
  } catch (error) {
    next(error);
  }
});

router.get("/events", async (req, res) => {
  try {
    const requirements = getAllEventRequirements();
    res.json({
      events: Object.entries(requirements).map(([key, req]) => ({
        key,
        name: req.name,
        type: req.type,
        category: req.category,
        totalMembers: req.totalMembers,
        maxCapacity: req.maxCapacity,
        description: req.description,
        departmentRequirements: req.departmentRequirements
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

router.post("/registrations", async (req, res, next) => {
  try {
    const college = String(req.body.college || "").trim();
    const email = String(req.body.email || "").trim();
    const leader = String(req.body.leader || "").trim();
    const event = String(req.body.event || "").trim();
    const category = String(req.body.category || "").trim();

    if (!college || !email || !leader || !event) {
      throw makeError("College, email, leader, and event are required", 400);
    }

    // Parse participants with department information
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants.map((participant) => ({
          name: String(participant.name || "").trim(),
          phone: String(participant.phone || "").trim(),
          department: String(participant.department || "").trim()
        }))
      : [];

    // Create registration object for validation
    const registrationData = {
      code: "temp",
      college,
      address: String(req.body.address || "").trim(),
      email,
      event,
      faculty: String(req.body.faculty || "").trim(),
      facultyPhone: String(req.body.facultyPhone || "").trim(),
      leader,
      participants,
      category,
      sourceIp: clientIp(req)
    };

    // Validate team composition against event requirements
    const validation = validateTeamComposition(registrationData, event);
    
    if (!validation.valid) {
      throw makeError(
        `Invalid team composition: ${formatValidationErrors(validation)}`,
        400
      );
    }

    // Save registration with validated data
    registrationData.code = await generateRegistrationCode();
    const registration = await Registration.create(registrationData);

    await writeAuditLog({
      action: `New registration submitted: ${registration.college} - ${registration.event}`,
      req
    });

    res.status(201).json({
      registration: serializeRegistration(registration)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
