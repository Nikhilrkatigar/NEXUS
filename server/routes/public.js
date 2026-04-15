const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Registration = require("../models/Registration");
const Settings = require("../models/Settings");
const Timeline = require("../models/Timeline");
const { writeAuditLog } = require("../audit");
const { clientIp, makeError, serializeRegistration } = require("../utils");
const {
  validateTeamComposition,
  getEventRequirements,
  getAllEventRequirements,
  formatValidationErrors,
  normalizeDepartment
} = require("../registrationValidator");

const router = express.Router();

// Multer configuration for payment screenshot uploads
const uploadsDir = path.join(__dirname, "../../uploads/payment-screenshots");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${req.registrationCode}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(makeError("Only JPEG, PNG, and WebP images are allowed", 400));
    }
  }
});

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
    const teamName = String(req.body.teamName || college || "").trim(); // Use college name as default
    const requestedLeader = String(req.body.leader || "").trim();
    const event = String(req.body.event || "NEXUS_TEAM").trim();
    const category = String(req.body.category || "").trim();

    if (!college || !email) {
      throw makeError("College and email are required", 400);
    }

    // Ensure teamName has a value
    if (!teamName) {
      throw makeError("College name is required to generate team name", 400);
    }

    // Parse participants with department information
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants.map((participant) => {
          const normalized = normalizeDepartment(participant.department);
          console.log(
            `[Registration] Normalizing department: "${participant.department}" → "${normalized}"`
          );
          return {
            name: String(participant.name || "").trim(),
            phone: String(participant.phone || "").trim(),
            department: normalized,
            isTeamLeader: Boolean(participant.isTeamLeader),
            danceParticipant: Boolean(
              participant.danceParticipant ?? participant.rhythmRumbleParticipant
            ),
            rampWalkParticipant: Boolean(
              participant.rampWalkParticipant ?? participant.styleSagaParticipant
            )
          };
        })
      : [];

    console.log("[Registration] Final participants:", JSON.stringify(participants, null, 2));

    const derivedLeader =
      requestedLeader ||
      participants.find((participant) => participant.isTeamLeader && participant.name)?.name ||
      participants.find((participant) => participant.name)?.name ||
      teamName;

    // Create registration object for validation
    const registrationData = {
      code: "temp",
      college,
      address: String(req.body.address || "").trim(),
      email,
      event,
      teamName,
      faculty: String(req.body.faculty || "").trim(),
      facultyPhone: String(req.body.facultyPhone || "").trim(),
      leader: derivedLeader,
      participants,
      registeredEvents: [],
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

    registrationData.event = validation.requirements?.name || event;
    registrationData.registeredEvents = Array.isArray(validation.requirements?.registeredEvents)
      ? validation.requirements.registeredEvents
      : [];

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

// Get payment status for a registration
router.get("/registrations/:code/payment-status", async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code }).lean();
    
    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    res.json({
      code: registration.code,
      paymentStatus: registration.paymentStatus,
      paymentScreenshot: registration.paymentScreenshot,
      paymentVerifiedAt: registration.paymentVerifiedAt
    });
  } catch (error) {
    next(error);
  }
});

// Upload payment screenshot
router.post(
  "/registrations/:code/payment-screenshot",
  (req, res, next) => {
    req.registrationCode = req.params.code;
    next();
  },
  upload.single("screenshot"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw makeError("No image file provided", 400);
      }

      console.log("Screenshot upload request for code:", req.params.code);
      console.log("File info:", {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const registration = await Registration.findOne({ code: req.params.code });
      
      if (!registration) {
        // Clean up uploaded file if registration not found
        fs.unlinkSync(req.file.path);
        throw makeError("Registration not found", 404);
      }

      // Delete old screenshot if exists
      if (registration.paymentScreenshotPath && fs.existsSync(registration.paymentScreenshotPath)) {
        fs.unlinkSync(registration.paymentScreenshotPath);
      }

      // Update registration with screenshot info
      registration.paymentScreenshot = req.file.filename;
      registration.paymentScreenshotPath = req.file.path;
      registration.paymentStatus = "pending"; // Awaiting admin verification
      await registration.save();

      console.log("Screenshot saved successfully for code:", req.params.code);
      console.log("Saved to database:", {
        paymentScreenshot: registration.paymentScreenshot,
        paymentScreenshotPath: registration.paymentScreenshotPath
      });

      await writeAuditLog({
        action: `Payment screenshot uploaded for registration: ${registration.code}`,
        req
      });

      res.json({
        success: true,
        message: "Payment screenshot uploaded successfully. Awaiting admin verification.",
        registration: serializeRegistration(registration)
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Upload error:", error);
      next(error);
    }
  }
);

module.exports = router;
