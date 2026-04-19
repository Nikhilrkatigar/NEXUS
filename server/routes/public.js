const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomInt } = require("crypto");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const Registration = require("../models/Registration");
const Settings = require("../models/Settings");
const Timeline = require("../models/Timeline");
const { writeAuditLog } = require("../audit");
const { clientIp, makeError, serializeRegistration } = require("../utils");
const {
  validateTeamComposition,
  getAllEventRequirements,
  formatValidationErrors,
  normalizeDepartment
} = require("../registrationValidator");

const router = express.Router();
const IS_PROD = process.env.NODE_ENV === "production";

// ── Magic byte validation ────────────────────────────────────
const IMAGE_SIGNATURES = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }
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

// ── Email validation ─────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Multer configuration for payment screenshot uploads
const uploadsDir = path.join(__dirname, "../../uploads/payment-screenshots");

// Ensure uploads directory exists and is writable
function ensureUploadDir() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Test if directory is writable
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    return true;
  } catch (err) {
    console.error(`[Screenshot Upload] Directory not writable: ${uploadsDir}`, err.message);
    return false;
  }
}

// Check on startup
if (!ensureUploadDir()) {
  console.warn(`[Screenshot Upload] WARNING: Upload directory may not be accessible: ${uploadsDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before each upload
    if (!ensureUploadDir()) {
      return cb(makeError("Upload directory not accessible", 500));
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${req.registrationCode}-${timestamp}${ext}`;
    cb(null, filename);
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

// ── Rate Limiters ────────────────────────────────────────────
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 registrations per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registrations from this IP. Please try again later." }
});

const screenshotUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload attempts. Please try again later." }
});

// Use crypto.randomInt - cryptographically secure, prevents code enumeration attacks
async function generateRegistrationCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = String(randomInt(10000, 100000));
    const existing = await Registration.exists({ code });
    if (!existing) {
      return code;
    }
  }

  // Fallback: timestamp slice + secure random suffix (6 chars total)
  return String(Date.now()).slice(-4) + String(randomInt(10, 100));
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

router.post("/registrations", registrationLimiter, async (req, res, next) => {
  try {
    const college = String(req.body.college || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const teamName = String(req.body.teamName || college || "").trim();
    const requestedLeader = String(req.body.leader || "").trim();
    const event = String(req.body.event || "NEXUS_TEAM").trim();
    const category = String(req.body.category || "").trim();

    if (!college || !email) {
      throw makeError("College and email are required", 400);
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      throw makeError("Invalid email address", 400);
    }

    if (!teamName) {
      throw makeError("College name is required to generate team name", 400);
    }

    // Parse participants with department information
    const participants = Array.isArray(req.body.participants)
      ? req.body.participants.map((participant) => {
          const normalized = normalizeDepartment(participant.department);
          if (!IS_PROD) {
            console.log(
              `[Registration] Normalizing department: "${participant.department}" → "${normalized}"`
            );
          }
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

    if (!IS_PROD) {
      console.log("[Registration] Final participants:", JSON.stringify(participants, null, 2));
    }

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

    // Duplicate check: block the same contact email from registering twice for the
    // SAME event. Multiple different teams from the same college are allowed.
    // Faculty email is NOT part of this check — only the team contact email.
    const resolvedEventName = registrationData.event;
    const emailConflict = await Registration.findOne({
      email,
      event: resolvedEventName
    }).lean();

    if (emailConflict) {
      throw makeError(
        `A registration with contact email "${email}" already exists for this event. ` +
        `If you are registering a different team, please use a different contact email.`,
        409
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

// Get payment status for a registration — requires email to prevent IDOR
router.get("/registrations/:code/payment-status", async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ code: req.params.code }).lean();

    if (!registration) {
      throw makeError("Registration not found", 404);
    }

    // Require email query param to match — prevents enumeration/IDOR
    const emailParam = String(req.query.email || "").trim().toLowerCase();
    if (!emailParam || emailParam !== registration.email) {
      throw makeError("Registration not found", 404);
    }

    res.json({
      code: registration.code,
      paymentStatus: registration.paymentStatus,
      hasScreenshot: !!registration.paymentScreenshot,
      paymentVerifiedAt: registration.paymentVerifiedAt
    });
  } catch (error) {
    next(error);
  }
});

// Upload payment screenshot
router.post(
  "/registrations/:code/payment-screenshot",
  screenshotUploadLimiter,
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

      // Log upload attempt
      const uploadedFilePath = req.file.path;
      if (!IS_PROD) {
        console.log(`[Screenshot Upload] File uploaded to: ${uploadedFilePath}`);
        console.log(`[Screenshot Upload] Expected directory: ${uploadsDir}`);
        console.log(`[Screenshot Upload] Filename: ${req.file.filename}`);
      }

      // Validate magic bytes
      if (!validateImageMagicBytes(uploadedFilePath)) {
        try { fs.unlinkSync(uploadedFilePath); } catch (_) {}
        throw makeError("Invalid image file — content does not match an image format", 400);
      }

      const registration = await Registration.findOne({ code: req.params.code });

      if (!registration) {
        // Clean up uploaded file if registration not found
        try { fs.unlinkSync(uploadedFilePath); } catch (_) {}
        throw makeError("Registration not found", 404);
      }

      // Delete old screenshot by filename (not stored absolute path — env-independent)
      if (registration.paymentScreenshot) {
        const oldPath = path.join(uploadsDir, registration.paymentScreenshot);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) {}
        }
      }

      // Store only the filename — never an absolute path — so it works across environments
      registration.paymentScreenshot = req.file.filename;
      registration.paymentStatus = "pending"; // Awaiting admin verification
      await registration.save();

      // Verify file actually exists on disk
      const verifyPath = path.join(uploadsDir, req.file.filename);
      if (!fs.existsSync(verifyPath)) {
        console.error(`[Screenshot Upload] ERROR: File not found after save: ${verifyPath}`);
        console.error(`[Screenshot Upload] File was saved to: ${uploadedFilePath}`);
        console.error(`[Screenshot Upload] Check if paths match and directory is correct`);
        throw makeError("File upload verification failed — file not found after save", 500);
      }

      if (!IS_PROD) {
        console.log(`[Screenshot] Saved for code: ${req.params.code} → ${req.file.filename}`);
        console.log(`[Screenshot] File verified at: ${verifyPath}`);
      }

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
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      if (!IS_PROD) {
        console.error("Upload error:", error);
      }
      next(error);
    }
  }
);

module.exports = router;
