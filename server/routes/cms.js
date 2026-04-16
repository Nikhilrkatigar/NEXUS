const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { requireAuth, requireRole } = require("../auth");
const { writeAuditLog } = require("../audit");
const AuditLog = require("../models/AuditLog");
const Registration = require("../models/Registration");
const ScoreSheet = require("../models/ScoreSheet");
const Settings = require("../models/Settings");
const Timeline = require("../models/Timeline");
const User = require("../models/User");
const {
  makeError,
  serializeAuditLog,
  serializeRegistration,
  serializeUser
} = require("../utils");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "..", "uploads", "team-members");
const siteAssetDir = path.join(__dirname, "..", "..", "uploads", "site-assets");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(siteAssetDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safeBase = path
        .basename(file.originalname || "team-member", ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "team-member";
      cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(makeError("Only image uploads are allowed", 400));
  }
});

const siteAssetUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, siteAssetDir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safeBase = path
        .basename(file.originalname || "site-asset", ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "site-asset";
      cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(makeError("Only image uploads are allowed", 400));
  }
});

router.use(requireAuth);

router.get("/bootstrap", async (req, res) => {
  res.json({ user: req.userView });
});

router.post("/uploads/team-image", requireRole("superadmin"), upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw makeError("Image file is required", 400);
    }

    const relativePath = `/uploads/team-members/${req.file.filename}`;

    await writeAuditLog({
      action: `Uploaded team member image: ${req.file.filename}`,
      req,
      user: req.user
    });

    res.status(201).json({ imageUrl: relativePath });
  } catch (error) {
    next(error);
  }
});

router.post("/uploads/site-image", requireRole("superadmin"), siteAssetUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw makeError("Image file is required", 400);
    }

    const relativePath = `/uploads/site-assets/${req.file.filename}`;

    await writeAuditLog({
      action: `Uploaded site image: ${req.file.filename}`,
      req,
      user: req.user
    });

    res.status(201).json({ imageUrl: relativePath });
  } catch (error) {
    next(error);
  }
});

router.post("/audit", async (req, res, next) => {
  try {
    const action = String(req.body.action || "").trim();
    if (!action) {
      throw makeError("Action is required", 400);
    }

    await writeAuditLog({
      action,
      req,
      user: req.user
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(500);
    res.json({ logs: logs.map(serializeAuditLog) });
  } catch (error) {
    next(error);
  }
});

router.delete("/audit", requireRole("superadmin"), async (req, res, next) => {
  try {
    await AuditLog.deleteMany({});
    await writeAuditLog({
      action: "Cleared audit log",
      req,
      user: req.user
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/registrations", async (req, res, next) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: 1 });
    res.json({
      registrations: registrations.map(serializeRegistration)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/scores", async (req, res, next) => {
  try {
    const scoreSheets = await ScoreSheet.find().lean();
    const scores = {};
    scoreSheets.forEach((sheet) => {
      scores[sheet.eventKey] = sheet.data || {};
    });
    res.json({ scores });
  } catch (error) {
    next(error);
  }
});

router.put("/scores/:eventKey", requireRole("superadmin", "organiser", "judge"), async (req, res, next) => {
  try {
    const eventKey = String(req.params.eventKey || "").trim();
    if (!eventKey) {
      throw makeError("Event key is required", 400);
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};

    await ScoreSheet.findOneAndUpdate(
      { eventKey },
      { eventKey, data: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog({
      action: `Saved scores: ${eventKey}`,
      req,
      user: req.user
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/settings", async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "default" }).lean();
    res.json({ settings: settings ? settings.values : {} });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", requireRole("superadmin"), async (req, res, next) => {
  try {
    const values = req.body && typeof req.body === "object" ? req.body : {};

    if (Array.isArray(values.events)) {
      const activeEventKeys = values.events
        .map((event) => String(event && event.id ? event.id : "").trim())
        .filter(Boolean);

      if (activeEventKeys.length > 0) {
        const activeSet = new Set(activeEventKeys);
        const scoreSheets = await ScoreSheet.find({}, { _id: 1, eventKey: 1 }).lean();

        const staleSheetIds = scoreSheets
          .filter((sheet) => {
            const key = String(sheet.eventKey || "").trim();
            if (!key) return true;
            if (activeSet.has(key)) return false;

            // Keep round-based score keys like EVENT_ID_R1 when EVENT_ID is active.
            const match = key.match(/^(.*)_R\d+$/);
            return !(match && activeSet.has(match[1]));
          })
          .map((sheet) => sheet._id);

        if (staleSheetIds.length > 0) {
          await ScoreSheet.deleteMany({ _id: { $in: staleSheetIds } });
        }
      }
    }

    await Settings.findOneAndUpdate(
      { key: "default" },
      { key: "default", values },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog({
      action: "Updated page settings",
      req,
      user: req.user
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/timeline", async (req, res, next) => {
  try {
    const timeline = await Timeline.findOne({ key: "default" }).lean();
    res.json({ timeline: timeline ? timeline.items : [] });
  } catch (error) {
    next(error);
  }
});

router.put("/timeline", requireRole("superadmin"), async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.timeline)
      ? req.body.timeline.map((item, index) => ({
          id: String(item.id || Date.now() + index),
          time: String(item.time || ""),
          title: String(item.title || ""),
          desc: String(item.desc || ""),
          color: String(item.color || "#f5a623")
        }))
      : [];

    await Timeline.findOneAndUpdate(
      { key: "default" },
      { key: "default", items },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog({
      action: "Updated timeline",
      req,
      user: req.user
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/users", requireRole("superadmin"), async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
});

router.post("/users", requireRole("superadmin"), async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "organiser").trim();
    let assignedEvent = String(req.body.assignedEvent || "").trim();
    assignedEvent = assignedEvent ? assignedEvent : null;

    if (!name || !username || !password) {
      throw makeError("Name, username, and password are required", 400);
    }

    if (password.length < 6) {
      throw makeError("Password must be at least 6 characters", 400);
    }

    if (role === "judge" && !assignedEvent) {
      throw makeError("Judges must have an assigned event", 400);
    }

    if (await User.exists({ username })) {
      throw makeError("Username already exists", 409);
    }

    const user = new User({
      name,
      username,
      role,
      assignedEvent,
      passwordHash: "pending"
    });
    await user.setPassword(password);
    await user.save();

    await writeAuditLog({
      action: `Created user: ${username}`,
      req,
      user: req.user
    });

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id", requireRole("superadmin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw makeError("User not found", 404);
    }

    user.name = String(req.body.name || user.name).trim();
    user.username = String(req.body.username || user.username).trim().toLowerCase();
    user.role = String(req.body.role || user.role).trim();
    let assignedEvent = String(req.body.assignedEvent || "").trim();
    assignedEvent = assignedEvent ? assignedEvent : null;
    user.assignedEvent = assignedEvent;

    if (user.role === "judge" && !user.assignedEvent) {
      throw makeError("Judges must have an assigned event", 400);
    }

    const password = String(req.body.password || "");
    if (password) {
      if (password.length < 6) {
        throw makeError("Password must be at least 6 characters", 400);
      }
      await user.setPassword(password);
    }

    const existing = await User.findOne({
      username: user.username,
      _id: { $ne: user._id }
    });
    if (existing) {
      throw makeError("Username already exists", 409);
    }

    await user.save();

    await writeAuditLog({
      action: `Updated user: ${user.username}`,
      req,
      user: req.user
    });

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", requireRole("superadmin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw makeError("User not found", 404);
    }

    if (user.username === "admin") {
      throw makeError("Cannot delete the default admin user", 400);
    }

    await user.deleteOne();

    await writeAuditLog({
      action: `Deleted user: ${user.username}`,
      req,
      user: req.user
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Debug endpoint - list all uploaded screenshots
router.get("/debug/screenshots", requireRole("superadmin"), async (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, "../../uploads/payment-screenshots");
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    
    const registrations = await Registration.find({}, { code: 1, paymentScreenshot: 1, paymentScreenshotPath: 1 }).lean();
    
    res.json({
      uploadsDir,
      dirExists: fs.existsSync(uploadsDir),
      filesInDir: files,
      registrationsWithScreenshots: registrations.filter(r => r.paymentScreenshot)
    });
  } catch (error) {
    next(error);
  }
});

// Get payment screenshot - NO AUTH required (registration code is identifier, not secret)
router.get("/payment-screenshot/:code", async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code }).lean();

    if (!registration) {
      console.log("Screenshot request: Registration not found for code:", req.params.code);
      throw makeError("Registration not found", 404);
    }

    if (!registration.paymentScreenshot) {
      console.log("Screenshot request: No screenshot for code:", req.params.code);
      throw makeError("No payment screenshot uploaded", 404);
    }

    // Always construct path from filename - avoid stored absolute path issues
    const screenshotPath = path.join(__dirname, "../../uploads/payment-screenshots", registration.paymentScreenshot);

    console.log("Serving screenshot:", {
      code: req.params.code,
      filename: registration.paymentScreenshot,
      resolvedPath: screenshotPath,
      fileExists: fs.existsSync(screenshotPath)
    });

    if (!fs.existsSync(screenshotPath)) {
      console.error("Screenshot file not found at:", screenshotPath);
      throw makeError("Screenshot file not found", 404);
    }

    res.sendFile(screenshotPath);
  } catch (error) {
    console.error("Error serving screenshot:", error.message);
    next(error);
  }
});

// Verify payment
router.post("/registrations/:code/verify-payment", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code });

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    if (!registration.paymentScreenshot) {
      throw makeError("No payment screenshot to verify", 400);
    }

    registration.paymentStatus = "verified";
    registration.paymentVerifiedAt = new Date();
    await registration.save();

    await writeAuditLog({
      action: `Verified payment for registration: ${registration.code} (${registration.college})`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      message: "Payment verified successfully",
      registration: serializeRegistration(registration)
    });
  } catch (error) {
    next(error);
  }
});

// Reject payment
router.post("/registrations/:code/reject-payment", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code });

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    // Delete screenshot file
    if (registration.paymentScreenshotPath && fs.existsSync(registration.paymentScreenshotPath)) {
      fs.unlinkSync(registration.paymentScreenshotPath);
    }

    registration.paymentStatus = "pending";
    registration.paymentScreenshot = "";
    registration.paymentScreenshotPath = "";
    registration.paymentVerifiedAt = null;
    await registration.save();

    await writeAuditLog({
      action: `Rejected payment for registration: ${registration.code} (${registration.college})`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      message: "Payment rejected - user can resubmit",
      registration: serializeRegistration(registration)
    });
  } catch (error) {
    next(error);
  }
});

// Update registration
router.put("/registrations/:code", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code });

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    // Update allowed fields
    if (req.body.college) registration.college = String(req.body.college).trim();
    if (req.body.email) registration.email = String(req.body.email).trim();
    if (req.body.leader) registration.leader = String(req.body.leader).trim();
    if (req.body.address) registration.address = String(req.body.address).trim();
    if (req.body.faculty) registration.faculty = String(req.body.faculty).trim();
    if (req.body.facultyPhone) registration.facultyPhone = String(req.body.facultyPhone).trim();

    await registration.save();

    await writeAuditLog({
      action: `Updated registration: ${registration.code} (${registration.college})`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      message: "Registration updated successfully",
      registration: serializeRegistration(registration)
    });
  } catch (error) {
    next(error);
  }
});

// Delete registration
router.delete("/registrations/:code", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code });

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    // Delete screenshot file if exists
    if (registration.paymentScreenshotPath && fs.existsSync(registration.paymentScreenshotPath)) {
      fs.unlinkSync(registration.paymentScreenshotPath);
    }

    await registration.deleteOne();

    await writeAuditLog({
      action: `Deleted registration: ${registration.code} (${registration.college})`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      message: "Registration deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// ========== Team Randomizer Routes ==========

// GET team randomizer status and data
router.get("/team-randomizer", async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "team-randomizer" }).lean();
    const registrations = await Registration.find().lean();
    
    const data = settings ? settings.values : {};
    const teamNames = data.teamNames || [];
    const assignments = data.assignments || [];
    
    const appliedCount = data.applied
      ? registrations.filter((registration) =>
          assignments.some(
            (assignment) => assignment.registrationId === String(registration._id)
          )
        ).length
      : 0;

    res.json({
      teamNames,
      assignments,
      registrationCount: registrations.length,
      appliedCount,
      applied: data.applied || false
    });
  } catch (error) {
    next(error);
  }
});

// POST setup team names
router.post("/team-randomizer/setup", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const teamNames = Array.isArray(req.body.teamNames) 
      ? req.body.teamNames.map(n => String(n).trim()).filter(n => n.length > 0)
      : [];

    if (teamNames.length === 0) {
      throw makeError("At least one team name is required", 400);
    }

    if (teamNames.length > 20) {
      throw makeError("Maximum 20 team names allowed", 400);
    }

    await Settings.findOneAndUpdate(
      { key: "team-randomizer" },
      { 
        key: "team-randomizer", 
        values: {
          teamNames,
          assignments: [],
          applied: false
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog({
      action: `Set up ${teamNames.length} team names for randomizer`,
      req,
      user: req.user
    });

    res.json({ ok: true, count: teamNames.length });
  } catch (error) {
    next(error);
  }
});

// POST generate random assignments
router.post("/team-randomizer/randomize", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "team-randomizer" });
    if (!settings || !settings.values.teamNames || settings.values.teamNames.length === 0) {
      throw makeError("Please set up team names first", 400);
    }

    const teamNames = [...settings.values.teamNames];
    const registrations = await Registration.find().sort({ createdAt: 1 }).lean();

    if (registrations.length === 0) {
      throw makeError("No registrations found", 400);
    }

    if (teamNames.length < registrations.length) {
      throw makeError(`Need at least ${registrations.length} team names for ${registrations.length} registrations`, 400);
    }

    // Shuffle team names using Fisher-Yates algorithm
    const shuffled = [...teamNames];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Create assignments
    const assignments = registrations.map((reg, idx) => ({
      registrationId: String(reg._id),
      originalName: reg.teamName || reg.college || `Team ${idx + 1}`,
      randomName: shuffled[idx],
      code: reg.code
    }));

    // Store assignments (not yet applied)
    settings.values.assignments = assignments;
    settings.values.applied = false;
    settings.values.appliedAt = null;
    settings.markModified("values");
    await settings.save();

    await writeAuditLog({
      action: `Generated random team name assignments for ${assignments.length} registrations`,
      req,
      user: req.user
    });

    res.json({ 
      ok: true,
      assignments,
      count: assignments.length
    });
  } catch (error) {
    next(error);
  }
});

// POST apply assignments to registrations
router.post("/team-randomizer/apply", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const assignments = Array.isArray(req.body.assignments) ? req.body.assignments : [];

    if (assignments.length === 0) {
      throw makeError("No assignments to apply", 400);
    }

    let appliedCount = 0;
    for (const assignment of assignments) {
      const registration = await Registration.findById(assignment.registrationId);
      if (registration) {
        registration.teamName = assignment.randomName;
        await registration.save();
        appliedCount++;
      }
    }

    // Mark as applied in settings
    const settings = await Settings.findOne({ key: "team-randomizer" });
    if (settings) {
      settings.values.applied = true;
      settings.values.appliedAt = new Date();
      settings.values.assignments = assignments;
      settings.markModified("values");
      await settings.save();
    }

    await writeAuditLog({
      action: `Applied random team names to ${appliedCount} registrations`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      appliedCount,
      message: `Successfully applied random names to ${appliedCount} registrations`
    });
  } catch (error) {
    next(error);
  }
});

// ──── Check-In Management ────────────────────────────────────
router.get("/checkins", requireRole("checkin"), async (req, res, next) => {
  try {
    const registrations = await Registration.find({}, { id: 1, checkedIn: 1, checkedInAt: 1 }).lean();
    const checkins = {};
    registrations.forEach(reg => {
      checkins[String(reg._id)] = reg.checkedIn || false;
    });
    res.json(checkins);
  } catch (error) {
    next(error);
  }
});

router.post("/checkin/:id", requireRole("checkin"), async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    const checkedIn = req.body.checkedIn === true;
    registration.checkedIn = checkedIn;
    registration.checkedInAt = checkedIn ? new Date() : null;
    await registration.save();

    await writeAuditLog({
      action: `Check-in updated: ${registration.code} - ${checkedIn ? 'Checked In' : 'Unmarked'}`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      checkedIn,
      checkedInAt: registration.checkedInAt
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
