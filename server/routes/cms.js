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

router.put("/scores/:eventKey", requireRole("superadmin", "organiser"), async (req, res, next) => {
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

    if (!name || !username || !password) {
      throw makeError("Name, username, and password are required", 400);
    }

    if (password.length < 6) {
      throw makeError("Password must be at least 6 characters", 400);
    }

    if (await User.exists({ username })) {
      throw makeError("Username already exists", 409);
    }

    const user = new User({
      name,
      username,
      role,
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

module.exports = router;
