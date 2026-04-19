const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { connectDatabase } = require("./db");
const { seedDefaults } = require("./seed");
const authRoutes = require("./routes/auth");
const cmsRoutes = require("./routes/cms");
const publicRoutes = require("./routes/public");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const IS_PROD = process.env.NODE_ENV === "production";

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, "..", "uploads");
const paymentScreenshotsDir = path.join(uploadsDir, "payment-screenshots");
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(paymentScreenshotsDir, { recursive: true });

app.set("trust proxy", 1);

// ── Security Headers (helmet) ────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // let inline scripts in CMS
    crossOriginEmbedderPolicy: false
  })
);

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

// ── Global Rate Limit (300 req / 15 min per IP) ──────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "NEXUS");
  next();
});

// ── Block access to test scripts, log files, and sensitive root files ──
app.use((req, res, next) => {
  if (
    /\.(log|err)$/i.test(req.path) ||
    /^\/(test_|fix-|verify_|validate_)/i.test(req.path) ||
    req.path === "/.env" ||
    req.path === "/.env.example"
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "nexus-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/public", publicRoutes);

// Serve manifest.json with correct content-type
app.get("/manifest.json", (req, res) => {
  res.contentType("application/manifest+json");
  res.sendFile(path.join(__dirname, "..", "manifest.json"));
});

// Block direct access to sensitive payment screenshots - must go through authenticated API
app.use("/uploads/payment-screenshots", (req, res) => {
  res.status(403).json({ message: "Access denied" });
});

// Serve other uploads (site assets, team member images)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(express.static(path.join(__dirname, "..")));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Avoid noisy stack traces for expected client/auth errors (e.g., 401, 403, 404).
  if (status >= 500) {
    console.error(err);
  } else if (!err.expose && !IS_PROD) {
    console.warn(err);
  }

  res.status(status).json({
    message: err.expose ? err.message : "Internal server error"
  });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment");
  }

  await connectDatabase();
  await seedDefaults();

  app.listen(port, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let ipAddress = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipAddress = iface.address;
          break;
        }
      }
    }
    
    console.log(`NEXUS backend running on http://localhost:${port}`);
    console.log(`Access from other devices: http://${ipAddress}:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
