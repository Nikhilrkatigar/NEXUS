const express = require("express");

const User = require("../models/User");
const { requireAuth } = require("../auth");
const { createToken, makeError, serializeUser } = require("../utils");

const router = express.Router();

router.post("/login", async (req, res, next) => {
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
