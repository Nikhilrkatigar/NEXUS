const express = require("express");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const { requireAuth } = require("../auth");
const { createToken, makeError, serializeUser } = require("../utils");

const router = express.Router();

// Strict rate limit on login — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !password) {
      throw makeError("Username and password are required", 400);
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      throw makeError("Invalid username or password", 401);
    }

    res.json({
      token: createToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.userView });
});

module.exports = router;
