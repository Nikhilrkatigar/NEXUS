const User = require("./models/User");
const Settings = require("./models/Settings");
const Timeline = require("./models/Timeline");
const { DEFAULT_SETTINGS, DEFAULT_TIMELINE, DEFAULT_USERS } = require("./defaults");

async function seedDefaults() {
  const existingUsers = await User.countDocuments();
  if (existingUsers === 0) {
    for (const entry of DEFAULT_USERS) {
      const user = new User({
        name: entry.name,
        username: entry.username,
        role: entry.role,
        passwordHash: "pending"
      });
      await user.setPassword(entry.password);
      await user.save();
    }
  }

  const settings = await Settings.findOne({ key: "default" });
  if (!settings) {
    await Settings.create({
      key: "default",
      values: DEFAULT_SETTINGS
    });
  } else {
    let changed = false;
    const mergedValues = { ...DEFAULT_SETTINGS, ...(settings.values || {}) };

    if (!Array.isArray(settings.values?.teamMembers) || settings.values.teamMembers.length === 0) {
      mergedValues.teamMembers = DEFAULT_SETTINGS.teamMembers;
      changed = true;
    }

    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (typeof settings.values?.[key] === "undefined") {
        changed = true;
      }
    });

    if (changed) {
      settings.values = mergedValues;
      await settings.save();
    }
  }

  const timeline = await Timeline.findOne({ key: "default" });
  if (!timeline) {
    await Timeline.create({
      key: "default",
      items: DEFAULT_TIMELINE
    });
  }
}

module.exports = { seedDefaults };
