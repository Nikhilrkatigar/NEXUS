const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const AssessmentResult = require("../models/AssessmentResult");
const AssessmentStudent = require("../models/AssessmentStudent");
const Registration = require("../models/Registration");
const Settings = require("../models/Settings");
const { requireAuth, requireRole } = require("../auth");
const { writeAuditLog } = require("../audit");
const { clientIp, makeError } = require("../utils");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Try again later." }
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many submissions. Try again later." }
});

const DEFAULT_DURATION_SECONDS = 20 * 60;

function createAttemptToken(registerNumber) {
  if (!process.env.JWT_SECRET) {
    throw makeError("Assessment security is not configured. Contact admin.", 500);
  }

  return jwt.sign(
    {
      sub: String(registerNumber || "").trim().toUpperCase(),
      purpose: "assessment-submit"
    },
    process.env.JWT_SECRET,
    { expiresIn: "3h" }
  );
}

function verifyAttemptToken(token, registerNumber) {
  if (!process.env.JWT_SECRET) return false;
  if (!token) return false;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const sub = String(payload && payload.sub ? payload.sub : "").trim().toUpperCase();
    const purpose = String(payload && payload.purpose ? payload.purpose : "").trim();
    const expected = String(registerNumber || "").trim().toUpperCase();
    return purpose === "assessment-submit" && sub === expected;
  } catch (_error) {
    return false;
  }
}

const PEOPLE_PULSE_REGISTRATION_FILTER = {
  $or: [
    { registeredEvents: { $in: ["people-pulse", "PEOPLE PULSE", "People Pulse"] } },
    { event: { $regex: /people.pulse/i } },
    { "participants.department": "HR" }
  ]
};

function normalizeRegisterNumber(value) {
  return String(value || "").trim().toUpperCase().slice(0, 30);
}

function getStudentNameFromRegistration(registration) {
  return String(
    registration.teamName ||
    registration.leader ||
    registration.college ||
    `Team ${registration.code || ""}`
  ).trim().slice(0, 100);
}

async function compareStudentPassword(student, password) {
  const rawPassword = String(password == null ? "" : password);
  if (await student.comparePassword(rawPassword)) return true;

  const trimmedPassword = rawPassword.trim();
  if (trimmedPassword && trimmedPassword !== rawPassword) {
    return student.comparePassword(trimmedPassword);
  }

  return false;
}

function findAssessmentRegistration(registerNumber) {
  if (!registerNumber) return null;

  return Registration.findOne({
    code: registerNumber,
    ...PEOPLE_PULSE_REGISTRATION_FILTER
  }).lean();
}

async function getAssessmentControl() {
  const settings = await Settings.findOne({ key: "default" }, { values: 1 }).lean();
  const saved = settings?.values?.assessmentControl || {};

  return {
    phase: ["waiting", "live", "stopped"].includes(saved.phase) ? saved.phase : "waiting",
    startedAt: saved.startedAt || null,
    stoppedAt: saved.stoppedAt || null,
    durationSeconds: Number(saved.durationSeconds) > 0 ? Number(saved.durationSeconds) : DEFAULT_DURATION_SECONDS,
    sessionId: saved.sessionId || null
  };
}

async function saveAssessmentControl(controlPatch) {
  const settings = await Settings.findOne({ key: "default" });
  if (!settings) {
    throw makeError("Assessment settings are unavailable.", 500);
  }

  const current = settings.values?.assessmentControl || {};
  settings.values = {
    ...(settings.values || {}),
    assessmentControl: {
      phase: ["waiting", "live", "stopped"].includes(current.phase) ? current.phase : "waiting",
      startedAt: current.startedAt || null,
      stoppedAt: current.stoppedAt || null,
      durationSeconds: Number(current.durationSeconds) > 0 ? Number(current.durationSeconds) : DEFAULT_DURATION_SECONDS,
      sessionId: current.sessionId || null,
      ...controlPatch
    }
  };
  settings.markModified("values");
  await settings.save();

  return settings.values.assessmentControl;
}

async function syncStudentFromRegistration(registration, existingStudent = null) {
  const registerNumber = normalizeRegisterNumber(registration.code);
  if (!registerNumber) {
    throw makeError("Registration is missing a valid team code.", 400);
  }

  const password = String(registration.code || "").trim();
  const name = getStudentNameFromRegistration(registration);

  let student = existingStudent;
  if (!student) {
    student = await AssessmentStudent.findOne({ registerNumber });
  }

  if (!student) {
    student = new AssessmentStudent({ registerNumber, name });
    await student.setPassword(password);
    await student.save();
    return { student, action: "created" };
  }

  student.registerNumber = registerNumber;
  student.name = name;
  await student.setPassword(password);
  await student.save();

  return { student, action: "refreshed" };
}

// ── Questions ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    text: "An employee's performance has dropped suddenly. What should HR do first?",
    options: ["Terminate", "Ignore", "Conduct performance discussion", "Reduce salary"],
    correct: 2
  },
  {
    text: "Two employees are arguing daily. What is the best HR action?",
    options: ["Ignore", "Fire both", "Mediate discussion", "Transfer immediately"],
    correct: 2
  },
  {
    text: "Many employees are leaving the organisation. What is the best solution?",
    options: ["Increase workload", "Improve work culture", "Ignore", "Reduce salary"],
    correct: 1
  },
  {
    text: "The company cannot find good candidates. What is the best hiring strategy?",
    options: ["No hiring", "Employer branding + job portals", "Random selection", "Delay process"],
    correct: 1
  },
  {
    text: "An employee reports harassment. What is the first HR step?",
    options: ["Ignore", "Immediate investigation", "Blame employee", "Delay action"],
    correct: 1
  },
  {
    text: "Employees are stressed and burning out. What is the best HR action?",
    options: ["Increase work", "Provide support + flexible work", "Ignore", "Cut salary"],
    correct: 1
  },
  {
    text: "Employees are frequently absent. What is the best approach?",
    options: ["Ignore", "Punish", "Identify cause + counsel", "Salary cut"],
    correct: 2
  },
  {
    text: "Employees lack motivation. What is the best solution?",
    options: ["Pressure", "Recognition & rewards", "Ignore", "Reduce benefits"],
    correct: 1
  },
  {
    text: "Employees feel promotions are unfair. What is the best solution?",
    options: ["Favoritism", "Performance-based system", "Ignore", "Random selection"],
    correct: 1
  },
  {
    text: "Training is ineffective. What is the best improvement?",
    options: ["Stop training", "Practical & interactive training", "Ignore", "Only theory"],
    correct: 1
  },
  {
    text: "A manager's behaviour is causing issues in the team. What should HR do?",
    options: ["Ignore", "Counsel + training the manager", "Support manager unconditionally", "Transfer the team"],
    correct: 1
  },
  {
    text: "Employees are stressed due to poor work-life balance. What is the best solution?",
    options: ["More work", "Flexible timing", "No leave", "Salary cut"],
    correct: 1
  },
  {
    text: "An employee leaks company data. What is the immediate action?",
    options: ["Ignore", "Investigate + disciplinary action", "Delay", "Transfer"],
    correct: 1
  },
  {
    text: "The company lacks diversity. What is the best approach?",
    options: ["Same hiring", "Inclusive hiring policy", "Ignore", "Restrict hiring"],
    correct: 1
  },
  {
    text: "A team is not meeting its targets. What is the best HR action?",
    options: ["Blame", "Training + support", "Ignore", "Pressure"],
    correct: 1
  },
  {
    text: "Employees feel their complaints are unheard. What is the best solution?",
    options: ["Ignore", "Grievance system", "Delay", "Reject complaints"],
    correct: 1
  },
  {
    text: "A new employee is struggling to settle in. What is the best HR step?",
    options: ["Ignore", "Proper onboarding support", "Remove employee", "Delay"],
    correct: 1
  },
  {
    text: "The company needs to downsize. What is the best approach?",
    options: ["Sudden layoffs", "Ethical communication + support", "No notice", "Ignore"],
    correct: 1
  },
  {
    text: "Employees feel underpaid. What is the best HR response?",
    options: ["Ignore", "Review compensation + benefits", "Reduce salary", "Delay"],
    correct: 1
  },
  {
    text: "Employees resist organisational change. What is the best HR action?",
    options: ["Force change", "Train + communicate benefits", "Ignore", "Cancel change"],
    correct: 1
  }
];

// ── POST /api/assessment/student-login ───────────────────────────────────────
router.get("/session", async (req, res, next) => {
  try {
    const control = await getAssessmentControl();
    res.json({
      control,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

router.post("/student-login", loginLimiter, async (req, res, next) => {
  try {
    const { registerNumber, password } = req.body;
    const safeRegisterNumber = normalizeRegisterNumber(registerNumber);
    const passwordText = String(password == null ? "" : password);

    if (!safeRegisterNumber || !passwordText.trim()) {
      return next(makeError("Register number and password are required.", 400));
    }

    let student = await AssessmentStudent.findOne({ registerNumber: safeRegisterNumber });
    let passwordMatches = student ? await compareStudentPassword(student, passwordText) : false;

    if (!student || !passwordMatches) {
      const registration = await findAssessmentRegistration(safeRegisterNumber);
      if (registration) {
        const synced = await syncStudentFromRegistration(registration, student);
        student = synced.student;
        passwordMatches = await compareStudentPassword(student, passwordText);
      }
    }

    if (!student || !passwordMatches) {
      return next(makeError("Invalid register number or password.", 401));
    }

    if (student.hasAttempted) {
      return next(makeError("You have already attempted this exam. Each register number can only take the exam once.", 403));
    }

    res.json({
      registerNumber: student.registerNumber,
      name: student.name,
      attemptToken: createAttemptToken(student.registerNumber)
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/assessment/questions ────────────────────────────────────────────
router.get("/questions", (req, res) => {
  const sanitized = QUESTIONS.map((q, i) => ({
    index: i,
    text: q.text,
    options: q.options
  }));
  res.json({ questions: sanitized, durationSeconds: 20 * 60 });
});

// ── POST /api/assessment/submit ──────────────────────────────────────────────
router.post("/submit", submitLimiter, async (req, res, next) => {
  try {
    const { registerNumber, name, submitToken, answers, timeTaken, violations, autoSubmit } = req.body;

    if (!registerNumber || typeof registerNumber !== "string") {
      return next(makeError("Register number is required.", 400));
    }
    if (!submitToken || typeof submitToken !== "string") {
      return next(makeError("Secure session token is required.", 401));
    }
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      return next(makeError("Invalid answers payload.", 400));
    }

    const safeRegNum = registerNumber.trim().toUpperCase().slice(0, 30);
    const safeViolations = Math.max(0, Math.min(100, Number(violations) || 0));
    const safeTimeTaken = Math.max(0, Math.min(1200, Number(timeTaken) || 0));

    // Verify student exists and hasn't already submitted
    const student = await AssessmentStudent.findOne({ registerNumber: safeRegNum });
    if (!student) {
      return next(makeError("Register number not found.", 400));
    }

    if (!verifyAttemptToken(submitToken, safeRegNum)) {
      return next(makeError("Invalid or expired exam session token.", 401));
    }

    if (student.hasAttempted) {
      return next(makeError("This exam has already been submitted for this register number.", 403));
    }

    const control = await getAssessmentControl();
    if (!['live', 'stopped'].includes(control.phase)) {
      return next(makeError("The assessment is not active right now.", 403));
    }

    const fallbackName = typeof name === "string" ? name.trim() : "";
    const canonicalName = String(student.name || fallbackName || "").trim().slice(0, 100);
    if (canonicalName.length < 2) {
      return next(makeError("Valid student identity was not found.", 400));
    }

    let score = 0;
    const gradedAnswers = answers.map((ans, i) => {
      const q = QUESTIONS[i];
      const selected = ans.selected !== null && ans.selected !== undefined
        ? Math.max(0, Math.min(3, Number(ans.selected)))
        : null;
      const correct = selected !== null && selected === q.correct;
      if (correct) score++;
      return {
        questionIndex: i,
        selected,
        reason: typeof ans.reason === "string" ? ans.reason.trim().slice(0, 500) : "",
        correct
      };
    });

    const isDisqualified = safeViolations >= 3 || autoSubmit === "disqualified";
    const status = isDisqualified ? "disqualified"
      : (autoSubmit === "timeout" || autoSubmit === "stopped") ? "auto-submitted"
      : "completed";

    const result = await AssessmentResult.create({
      registerNumber: safeRegNum,
      name: canonicalName,
      score,
      totalQuestions: QUESTIONS.length,
      timeTaken: safeTimeTaken,
      violations: safeViolations,
      status,
      answers: gradedAnswers,
      ip: clientIp(req)
    });

    // Mark student as attempted so they can't retake
    await AssessmentStudent.updateOne({ registerNumber: safeRegNum }, { hasAttempted: true });

    res.status(201).json({
      id: String(result._id),
      score,
      total: QUESTIONS.length,
      status,
      violations: safeViolations
    });
  } catch (err) {
    next(err);
  }
});

// ── All admin routes below require auth ──────────────────────────────────────

// GET /api/assessment/results
router.post(
  "/control/start",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const control = await saveAssessmentControl({
        phase: "live",
        startedAt: new Date(),
        stoppedAt: null,
        sessionId: String(Date.now())
      });

      await writeAuditLog({
        action: "Started assessment exam session",
        req,
        user: req.user
      });

      res.json({ control });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/control/stop",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const current = await getAssessmentControl();
      const control = await saveAssessmentControl({
        phase: "stopped",
        startedAt: current.startedAt || null,
        stoppedAt: new Date()
      });

      await writeAuditLog({
        action: "Stopped assessment exam session",
        req,
        user: req.user
      });

      res.json({ control });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/results",
  requireAuth,
  requireRole("superadmin", "organiser", "viewer"),
  async (req, res, next) => {
    try {
      const { status, limit = 500 } = req.query;
      const filter = {};
      if (status && ["completed", "disqualified", "auto-submitted"].includes(status)) {
        filter.status = status;
      }

      const [results, total] = await Promise.all([
        AssessmentResult.find(filter)
          .select("-answers")
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .lean(),
        AssessmentResult.countDocuments(filter)
      ]);

      res.json({ results, total });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/assessment/results/:id — full detail with answers
router.get(
  "/results/:id",
  requireAuth,
  requireRole("superadmin", "organiser", "viewer"),
  async (req, res, next) => {
    try {
      const result = await AssessmentResult.findById(req.params.id).lean();
      if (!result) return next(makeError("Result not found.", 404));

      const enriched = result.answers.map((a) => ({
        ...a,
        questionText: QUESTIONS[a.questionIndex]?.text || "",
        options: QUESTIONS[a.questionIndex]?.options || [],
        correctOption: QUESTIONS[a.questionIndex]?.correct
      }));

      res.json({ result: { ...result, answers: enriched } });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/assessment/results/:id
router.delete(
  "/results/:id",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const result = await AssessmentResult.findByIdAndDelete(req.params.id);
      if (!result) return next(makeError("Result not found.", 404));
      res.json({ message: "Deleted." });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/assessment/export — CSV
router.get(
  "/export",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const results = await AssessmentResult.find().sort({ createdAt: -1 }).lean();
      const PASS_MARK = 14;
      const rows = [
        ["Register Number", "Name", "Score", "Total", "Percentage", "Result", "Violations", "Status", "Time Taken (s)", "Submitted At"].join(",")
      ];

      for (const r of results) {
        const pct = ((r.score / r.totalQuestions) * 100).toFixed(1);
        const passed = r.status !== "disqualified" && r.score >= PASS_MARK ? "Pass" : "Fail";
        rows.push([
          `"${(r.registerNumber || "").replace(/"/g, '""')}"`,
          `"${(r.name || "").replace(/"/g, '""')}"`,
          r.score,
          r.totalQuestions,
          pct + "%",
          passed,
          r.violations,
          r.status,
          r.timeTaken,
          new Date(r.createdAt).toISOString()
        ].join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="assessment-results-${Date.now()}.csv"`);
      res.send(rows.join("\r\n"));
    } catch (err) {
      next(err);
    }
  }
);

// ── Student management (admin only) ──────────────────────────────────────────
// IMPORTANT: all fixed-path routes (/students, /students/bulk,
// /students/sync-from-registrations) MUST come before param routes
// (/students/:id, /students/:id/reset) so Express doesn't swallow them.

// GET /api/assessment/students
router.get(
  "/students",
  requireAuth,
  requireRole("superadmin", "organiser", "viewer"),
  async (req, res, next) => {
    try {
      const students = await AssessmentStudent.find()
        .select("-passwordHash")
        .sort({ registerNumber: 1 })
        .lean();
      res.json({ students });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/assessment/students — create one student
router.post(
  "/students",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const { registerNumber, name, password } = req.body;
      if (!registerNumber || !name || !password) {
        return next(makeError("Register number, name and password are required.", 400));
      }
      if (password.length < 4) {
        return next(makeError("Password must be at least 4 characters.", 400));
      }

      const existing = await AssessmentStudent.findOne({
        registerNumber: registerNumber.trim().toUpperCase()
      });
      if (existing) {
        return next(makeError("Register number already exists.", 409));
      }

      const student = new AssessmentStudent({
        registerNumber: registerNumber.trim().toUpperCase(),
        name: name.trim()
      });
      await student.setPassword(password);
      await student.save();

      res.status(201).json({
        student: {
          _id: student._id,
          registerNumber: student.registerNumber,
          name: student.name,
          hasAttempted: student.hasAttempted
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/assessment/students/bulk
router.post(
  "/students/bulk",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const { students } = req.body;
      if (!Array.isArray(students) || students.length === 0) {
        return next(makeError("Provide an array of students.", 400));
      }
      if (students.length > 200) {
        return next(makeError("Max 200 students per bulk import.", 400));
      }

      const created = [];
      const failed = [];

      for (const s of students) {
        if (!s.registerNumber || !s.name || !s.password) {
          failed.push({ registerNumber: s.registerNumber || "?", reason: "Missing fields" });
          continue;
        }
        const regNum = s.registerNumber.trim().toUpperCase();
        const existing = await AssessmentStudent.findOne({ registerNumber: regNum });
        if (existing) {
          failed.push({ registerNumber: regNum, reason: "Already exists" });
          continue;
        }
        try {
          const doc = new AssessmentStudent({ registerNumber: regNum, name: s.name.trim() });
          await doc.setPassword(s.password);
          await doc.save();
          created.push(regNum);
        } catch (e) {
          failed.push({ registerNumber: regNum, reason: e.message });
        }
      }

      res.json({ created: created.length, failed });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/assessment/students/sync-from-registrations
// Scans all PEOPLE PULSE registrations and auto-creates student accounts.
// Register number = TEAMCODE
// Password       = TEAMCODE     (e.g. 12345)
// Safe to run multiple times - existing accounts are refreshed.
router.post(
  "/students/sync-from-registrations",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      const regs = await Registration.find(PEOPLE_PULSE_REGISTRATION_FILTER).lean();

      const created = [];
      const refreshed = [];
      const skipped = [];

      for (const reg of regs) {
        const regNum = normalizeRegisterNumber(reg.code);
        if (!regNum) {
          skipped.push({ registrationId: String(reg._id), reason: "Missing team code" });
          continue;
        }

        const existing = await AssessmentStudent.findOne({ registerNumber: regNum });
        const synced = await syncStudentFromRegistration(reg, existing);
        const payload = {
          registerNumber: synced.student.registerNumber,
          name: synced.student.name
        };

        if (synced.action === "created") {
          created.push(payload);
        } else {
          refreshed.push(payload);
        }
      }

      res.json({
        message: `Sync complete. ${created.length} students created, ${refreshed.length} refreshed, ${skipped.length} skipped.`,
        created,
        refreshed,
        skipped,
        teamsScanned: regs.length
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/assessment/students/:id  — param routes AFTER all fixed paths
router.delete(
  "/students/:id",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      await AssessmentStudent.findByIdAndDelete(req.params.id);
      res.json({ message: "Deleted." });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/assessment/students/:id/reset
router.patch(
  "/students/:id/reset",
  requireAuth,
  requireRole("superadmin", "organiser"),
  async (req, res, next) => {
    try {
      await AssessmentStudent.findByIdAndUpdate(req.params.id, { hasAttempted: false });
      res.json({ message: "Attempt reset. Student can now retake the exam." });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
