const DEFAULT_USERS = [
  {
    name: "Admin",
    username: "admin",
    get password() {
      const pw = process.env.SEED_ADMIN_PASSWORD;
      if (!pw) console.warn("[SECURITY] SEED_ADMIN_PASSWORD not set — using fallback. Set it in .env!");
      return pw || "changeme_admin_" + Date.now();
    },
    role: "superadmin"
  },
  {
    name: "Event Organiser",
    username: "organiser",
    get password() {
      const pw = process.env.SEED_ORGANISER_PASSWORD;
      if (!pw) console.warn("[SECURITY] SEED_ORGANISER_PASSWORD not set — using fallback. Set it in .env!");
      return pw || "changeme_org_" + Date.now();
    },
    role: "organiser"
  }
];

const DEFAULT_SETTINGS = {
  eventName: "NEXUS",
  eventSubtitle: "The Leadership Shift",
  collegeName: "Your College Name",
  department: "BBA Department",
  heroDesc: "A multi-domain fest where future leaders compete, collaborate, and conquer.",
  aboutTitle: "Where Leaders Are Born",
  aboutDesc: "NEXUS - The Leadership Shift is the flagship fest of the BBA Department.",
  eventsSectionTag: "Compete",
  eventsSectionTitle: "All Events",
  eventsSectionDesc: "Choose your battleground. Every event is a chance to prove your edge.",
  prize1: "Rs 30,000",
  prize2: "Rs 15,000",
  prize3: "Rs 5,000",
  prizesTitle: "Prize Pool",
  statTeams: "50+",
  statEvents: "10+",
  statColleges: "20+",
  statPrize: "Rs 50K+",
  festDate: "2026-04-20",
  principalName: "",
  chairmanName: "",
  hodName: "",
  footerDesc: "The Leadership Shift - BBA Department's flagship inter-college fest. A platform for future leaders to rise.",
  footerCollege: "BBA Department",
  registrationOpen: true,
  teamMembers: []
};

const DEFAULT_TIMELINE = [
  {
    id: "1",
    time: "9:00 AM",
    title: "Registration & Check-in",
    desc: "Teams arrive, collect entry passes and registration confirmation",
    color: "#f5a623"
  },
  {
    id: "2",
    time: "10:00 AM",
    title: "Curtain Raiser",
    desc: "Opening ceremony - all 5 participants attend",
    color: "#e63c5c"
  },
  {
    id: "3",
    time: "11:00 AM",
    title: "Round 1 - All Tracks",
    desc: "Finance Frontier: Round 1 | Brand Blitz: Round 1 | People Pulse: Round 1",
    color: "#00d4ff"
  },
  {
    id: "4",
    time: "1:00 PM",
    title: "Lunch Break",
    desc: "Rest, network, and prep for the afternoon",
    color: "#f5a623"
  },
  {
    id: "5",
    time: "2:00 PM",
    title: "Round 2 - All Tracks",
    desc: "Finance Frontier: Round 2 | Brand Blitz: Round 2",
    color: "#e63c5c"
  },
  {
    id: "6",
    time: "3:30 PM",
    title: "Round 3 - Finals",
    desc: "Finance Frontier: Finals | People Pulse: Stress Round",
    color: "#00d4ff"
  },
  {
    id: "7",
    time: "5:30 PM",
    title: "Valedictory & Awards",
    desc: "Results, prize distribution, certificates, closing ceremony",
    color: "#f5a623"
  }
];

// Event Registration Requirements Configuration
// HR = PEOPLE PULSE, Marketing = BRAND BLITZ, Finance = FINANCE FRONTIER
// Dance (max 4) = RHYTHM RUMBLE, Ramp Walk (max 1) = STYLE SAGA
const EVENT_REQUIREMENTS = {
  NEXUS_TEAM: {
    name: "NEXUS Team Registration",
    type: "team",
    totalMembers: 5,
    category: null,
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    cultureRequirements: {
      danceMax: 4,
      rampWalkMax: 1
    },
    registeredEvents: ["finance-frontier", "brand-blitz", "people-pulse", "rhythm-rumble", "style-saga",
      "finverse", "asventiq", "mindwar", "dance", "rampwalk"],
    description:
      "5-member team: 2 HR (People Pulse), 2 Marketing (Brand Blitz), 1 Finance (Finance Frontier). Dance (max 4) = Rhythm Rumble, Ramp Walk (1) = Style Saga."
  },
  // Department-based events
  "PEOPLE PULSE": {
    name: "PEOPLE PULSE",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "HR",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "HR Event - People Pulse: 5-member team"
  },
  "BRAND BLITZ": {
    name: "BRAND BLITZ",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "Marketing",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "Marketing Event - Brand Blitz: 5-member team"
  },
  "FINANCE FRONTIER": {
    name: "FINANCE FRONTIER",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "Finance",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "Finance Event - Finance Frontier: 5-member team"
  },
  // Keep backward compatibility with old event names
  FINVERSE: {
    name: "FINANCE FRONTIER",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "Finance",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "Finance Event (legacy alias)"
  },
  ASVENTIQ: {
    name: "BRAND BLITZ",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "Marketing",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "Marketing Event (legacy alias)"
  },
  "MIND WAR": {
    name: "PEOPLE PULSE",
    type: "team",
    totalMembers: 5,
    category: null,
    department: "HR",
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "HR Event (legacy alias)"
  },
  // Cultural events
  CULTURAL_DANCE: {
    name: "RHYTHM RUMBLE",
    type: "cultural",
    category: "Dance",
    totalMembers: 4,
    maxCapacity: 4,
    departmentRequirements: null,
    description: "Cultural event - Rhythm Rumble (Dance): Maximum 4 members"
  },
  CULTURAL_RAMP_WALK: {
    name: "STYLE SAGA",
    type: "cultural",
    category: "Ramp Walk",
    totalMembers: 1,
    maxCapacity: 1,
    departmentRequirements: null,
    description: "Cultural event - Style Saga (Ramp Walk): 1 member"
  }
};

module.exports = {
  DEFAULT_SETTINGS,
  DEFAULT_TIMELINE,
  DEFAULT_USERS,
  EVENT_REQUIREMENTS
};
