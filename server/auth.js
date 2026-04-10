const jwt = require("jsonwebtoken");

const User = require("./models/User");
const { makeError, serializeUser } = require("./utils");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return next(makeError("Authentication required", 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return next(makeError("Session is no longer valid", 401));
    }

    req.user = user;
    req.userView = serializeUser(user);
    return next();
  } catch (error) {
    return next(makeError("Invalid or expired session", 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(makeError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(makeError("You do not have access to this action", 403));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
