const AuditLog = require("./models/AuditLog");
const { clientIp } = require("./utils");

async function writeAuditLog({ action, req, user, ip }) {
  if (!action) {
    return;
  }

  await AuditLog.create({
    action,
    user: user ? user.name : "System",
    userId: user ? user._id : null,
    ip: ip || (req ? clientIp(req) : "-")
  });
}

module.exports = { writeAuditLog };
