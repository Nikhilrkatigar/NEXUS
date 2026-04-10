const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

const { connectDatabase } = require("./db");
const { seedDefaults } = require("./seed");
const authRoutes = require("./routes/auth");
const cmsRoutes = require("./routes/cms");
const publicRoutes = require("./routes/public");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.set("trust proxy", true);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "NEXUS");
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

app.use(express.static(path.join(__dirname, "..")));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
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

  app.listen(port, () => {
    console.log(`NEXUS backend running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
