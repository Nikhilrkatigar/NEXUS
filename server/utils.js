const jwt = require("jsonwebtoken");

function createToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      name: user.name,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt
  };
}

function serializeRegistration(doc) {
  return {
    id: String(doc._id),
    code: doc.code,
    college: doc.college,
    address: doc.address,
    email: doc.email,
    event: doc.event,
    teamName: doc.teamName || "",
    faculty: doc.faculty,
    facultyPhone: doc.facultyPhone,
    leader: doc.leader,
    participants: doc.participants || [],
    registeredEvents: doc.registeredEvents || [],
    ip: normalizeIp(doc.sourceIp) || "-",
    timestamp: doc.createdAt,
    paymentStatus: doc.paymentStatus || "pending",
    paymentScreenshot: doc.paymentScreenshot || "",
    paymentScreenshotPath: doc.paymentScreenshotPath || "",
    paymentVerifiedAt: doc.paymentVerifiedAt
  };
}

function serializeAuditLog(doc) {
  return {
    id: String(doc._id),
    action: doc.action,
    user: doc.user || "System",
    ip: normalizeIp(doc.ip) || "-",
    timestamp: doc.createdAt
  };
}

function normalizeIp(value) {
  const ip = String(value || "").trim();
  if (!ip) {
    return "-";
  }

  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1 (localhost)";
  }

  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }

  return ip;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return normalizeIp(forwarded.split(",")[0].trim());
  }

  return normalizeIp(req.ip || req.socket.remoteAddress || "-");
}

function makeError(message, status) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}

module.exports = {
  clientIp,
  createToken,
  makeError,
  normalizeIp,
  serializeAuditLog,
  serializeRegistration,
  serializeUser
};
