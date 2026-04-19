const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

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
const { normalizeDepartment } = require("../registrationValidator");

// ── Magic byte validation for image uploads ──────────────────
const IMAGE_SIGNATURES = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46] }
];

function validateImageMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    return IMAGE_SIGNATURES.some((sig) =>
      sig.bytes.every((b, i) => buf[i] === b)
    );
  } catch {
    return false;
  }
}

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
});  // <-- Intentionally close here to add magic-byte post-processing middleware

// Post-upload magic byte validation middleware
function validateUploadedImage(req, res, next) {
  if (!req.file) return next();
  if (!validateImageMagicBytes(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return next(makeError("Invalid image file — content does not match an image format", 400));
  }
  next();
}

const teamImageUpload = upload.single("image");
// Wrapper: multer upload + magic byte check
function secureTeamUpload(req, res, next) {
  teamImageUpload(req, res, (err) => {
    if (err) return next(err);
    validateUploadedImage(req, res, next);
  });
}

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

router.post("/uploads/team-image", requireRole("superadmin"), secureTeamUpload, async (req, res, next) => {
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

router.post("/audit", requireRole("superadmin", "organiser"), async (req, res, next) => {
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

// Debug endpoint removed for security — it exposed absolute server paths

// Get payment screenshot — auth required to prevent IDOR enumeration
router.get("/payment-screenshot/:code", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code }).lean();

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    if (!registration.paymentScreenshot) {
      throw makeError("No payment screenshot uploaded", 404);
    }

    // Always construct path from filename - avoid stored absolute path issues
    const screenshotDir = path.join(__dirname, "../../uploads/payment-screenshots");
    const screenshotPath = path.join(screenshotDir, registration.paymentScreenshot);

    // Log the lookup for debugging
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Payment Screenshot] Retrieving: ${registration.paymentScreenshot}`);
      console.log(`[Payment Screenshot] Expected path: ${screenshotPath}`);
      console.log(`[Payment Screenshot] Directory exists: ${fs.existsSync(screenshotDir)}`);
    }

    if (!fs.existsSync(screenshotPath)) {
      const dirContents = fs.existsSync(screenshotDir) ? fs.readdirSync(screenshotDir) : [];
      console.error(`[Payment Screenshot] File not found: ${screenshotPath}`);
      console.error(`[Payment Screenshot] Directory ${screenshotDir} contains: ${dirContents.length} files`);
      if (dirContents.length > 0 && process.env.NODE_ENV !== "production") {
        console.error(`[Payment Screenshot] Sample files: ${dirContents.slice(0, 5).join(", ")}`);
      }
      throw makeError("Screenshot file not found", 404);
    }

    res.sendFile(screenshotPath);
  } catch (error) {
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

    // Delete screenshot file by filename — avoids absolute path issues across environments
    if (registration.paymentScreenshot) {
      const screenshotDir = path.join(__dirname, "../../uploads/payment-screenshots");
      const filePath = path.join(screenshotDir, registration.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
    }

    registration.paymentStatus = "pending";
    registration.paymentScreenshot = "";
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

    // Update allowed scalar fields
    if (req.body.college !== undefined) registration.college = String(req.body.college).trim();
    if (req.body.email !== undefined) registration.email = String(req.body.email).trim().toLowerCase();
    if (req.body.leader !== undefined) registration.leader = String(req.body.leader).trim();
    if (req.body.address !== undefined) registration.address = String(req.body.address).trim();
    if (req.body.faculty !== undefined) registration.faculty = String(req.body.faculty).trim();
    if (req.body.facultyPhone !== undefined) registration.facultyPhone = String(req.body.facultyPhone).trim();
    if (req.body.teamName !== undefined) registration.teamName = String(req.body.teamName).trim();

    // Allow organisers to update the participants roster directly
    if (Array.isArray(req.body.participants)) {
      registration.participants = req.body.participants.map((p) => ({
        name: String(p.name || "").trim(),
        phone: String(p.phone || "").trim(),
        department: normalizeDepartment(p.department),
        isTeamLeader: Boolean(p.isTeamLeader),
        danceParticipant: Boolean(p.danceParticipant),
        rampWalkParticipant: Boolean(p.rampWalkParticipant)
      }));
    }

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

    // Delete screenshot file by filename — avoids absolute path issues across environments
    if (registration.paymentScreenshot) {
      const screenshotDir = path.join(__dirname, "../../uploads/payment-screenshots");
      const filePath = path.join(screenshotDir, registration.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
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
    const existingSettings = await Settings.findOne({ key: "team-randomizer" }).lean();
    const existingValues = existingSettings?.values || {};
    const preserveAppliedAssignments = Boolean(
      existingValues.applied &&
      Array.isArray(existingValues.assignments) &&
      existingValues.assignments.length
    );

    if (teamNames.length === 0) {
      throw makeError("At least one team name is required", 400);
    }

    await Settings.findOneAndUpdate(
      { key: "team-randomizer" },
      { 
        key: "team-randomizer", 
        values: {
          teamNames,
          assignments: preserveAppliedAssignments ? existingValues.assignments : [],
          applied: preserveAppliedAssignments,
          appliedAt: preserveAppliedAssignments ? existingValues.appliedAt || null : null
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
    const assignments = registrations.map((reg, idx) => {
      const previousTeamName = reg.teamNameRandomized
        ? reg.teamNameBackup || ""
        : reg.teamName || "";

      return {
        registrationId: String(reg._id),
        originalName: previousTeamName || reg.college || `Team ${idx + 1}`,
        previousTeamName,
        randomName: shuffled[idx],
        code: reg.code
      };
    });

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

    // Bulk update — much faster than N individual finds + saves
    const bulkOps = assignments.map((a) => ({
      updateOne: {
        filter: { _id: a.registrationId },
        update: {
          $set: {
            teamName: String(a.randomName || "").trim(),
            teamNameBackup: String(a.previousTeamName || "").trim(),
            teamNameRandomized: true
          }
        }
      }
    }));
    const bulkResult = await Registration.bulkWrite(bulkOps);
    const appliedCount = bulkResult.modifiedCount || 0;

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

router.post("/team-randomizer/remove", requireRole("superadmin", "organiser"), async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "team-randomizer" });
    const savedAssignments = Array.isArray(settings?.values?.assignments)
      ? settings.values.assignments
      : [];

    const randomizedRegistrations = await Registration.find({ teamNameRandomized: true })
      .select("_id teamNameBackup")
      .lean();

    const restoreMap = new Map();

    randomizedRegistrations.forEach((registration) => {
      restoreMap.set(String(registration._id), registration.teamNameBackup || "");
    });

    savedAssignments.forEach((assignment) => {
      const registrationId = String(assignment.registrationId || "").trim();
      if (!registrationId || restoreMap.has(registrationId)) {
        return;
      }

      const restoredName = assignment.previousTeamName !== undefined
        ? assignment.previousTeamName
        : assignment.originalName || "";

      restoreMap.set(registrationId, String(restoredName).trim());
    });

    if (!restoreMap.size) {
      throw makeError("No assigned random team names found to remove", 400);
    }

    const bulkOps = Array.from(restoreMap.entries()).map(([registrationId, teamName]) => ({
      updateOne: {
        filter: { _id: registrationId },
        update: {
          $set: {
            teamName,
            teamNameBackup: "",
            teamNameRandomized: false
          }
        }
      }
    }));

    const bulkResult = await Registration.bulkWrite(bulkOps);
    const restoredCount = bulkResult.modifiedCount || 0;

    if (settings) {
      settings.values.applied = false;
      settings.values.appliedAt = null;
      settings.values.assignments = [];
      settings.markModified("values");
      await settings.save();
    }

    await writeAuditLog({
      action: `Removed random team names from ${restoredCount} registrations`,
      req,
      user: req.user
    });

    res.json({
      ok: true,
      restoredCount,
      message: `Successfully restored ${restoredCount} registrations`
    });
  } catch (error) {
    next(error);
  }
});

// ──── Check-In Management ────────────────────────────────────
router.get("/checkins", requireRole("checkin", "superadmin", "organiser"), async (req, res, next) => {
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

router.post("/checkin/:id", requireRole("checkin", "superadmin", "organiser"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw makeError("Invalid registration ID", 400);
    }

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

// Diagnostic endpoint: Check screenshot integrity
router.get("/diagnostics/payment-screenshots", requireRole("superadmin"), async (req, res, next) => {
  try {
    const screenshotDir = path.join(__dirname, "../../uploads/payment-screenshots");
    const results = {
      uploadDir: screenshotDir,
      dirExists: fs.existsSync(screenshotDir),
      dirWritable: false,
      registrationsWithScreenshots: 0,
      missingFiles: [],
      validFiles: [],
      errors: []
    };

    // Check if directory is writable
    if (results.dirExists) {
      try {
        fs.accessSync(screenshotDir, fs.constants.W_OK);
        results.dirWritable = true;
      } catch {
        results.errors.push("Directory exists but is not writable");
      }
    } else {
      results.errors.push("Screenshots directory does not exist");
    }

    // Find all registrations with payment screenshots
    const registrations = await Registration.find(
      { paymentScreenshot: { $exists: true, $ne: "" } },
      "code paymentScreenshot"
    ).lean();

    results.registrationsWithScreenshots = registrations.length;

    // Check each file
    for (const reg of registrations) {
      const filePath = path.join(screenshotDir, reg.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        results.validFiles.push({
          code: reg.code,
          filename: reg.paymentScreenshot,
          size: stat.size,
          modifiedAt: stat.mtime
        });
      } else {
        results.missingFiles.push({
          code: reg.code,
          filename: reg.paymentScreenshot,
          expectedPath: filePath
        });
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
