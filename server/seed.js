const User = require("./models/User");
const Settings = require("./models/Settings");
const Timeline = require("./models/Timeline");
const ScoreSheet = require("./models/ScoreSheet");
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

    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (typeof settings.values?.[key] === "undefined") {
        changed = true;
      }
    });

    if (changed) {
      settings.values = mergedValues;
      await settings.save();
    }

    // One-time migration: clear old hardcoded teamMembers seeded from previous defaults
    const savedTeam = settings.values && Array.isArray(settings.values.teamMembers) ? settings.values.teamMembers : null;
    if (savedTeam && savedTeam.some((m) => m.id === "team-1")) {
      settings.values = { ...settings.values, teamMembers: [] };
      settings.markModified("values");
      await settings.save();
      console.log("[Seed] Cleared old hardcoded teamMembers from database");
    }
  }

  const activeEventKeys = Array.isArray(settings?.values?.events)
    ? settings.values.events
        .map((event) => String(event && event.id ? event.id : "").trim())
        .filter(Boolean)
    : null;

  if (activeEventKeys && activeEventKeys.length > 0) {
    const activeSet = new Set(activeEventKeys);
    const scoreSheets = await ScoreSheet.find({}, { _id: 1, eventKey: 1 }).lean();

    const staleSheetIds = scoreSheets
      .filter((sheet) => {
        const key = String(sheet.eventKey || "").trim();
        if (!key) return true;
        if (activeSet.has(key)) return false;

        // Keep round-based score keys like EVENT_ID_R1 when EVENT_ID is active.
        const match = key.match(/^(.*)_R\d+$/);
        return !(match && activeSet.has(match[1]));
      })
      .map((sheet) => sheet._id);

    if (staleSheetIds.length > 0) {
      await ScoreSheet.deleteMany({ _id: { $in: staleSheetIds } });
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
