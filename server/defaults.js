const DEFAULT_USERS = [
  {
    name: "Admin",
    username: "admin",
    password: "nexus2026",
    role: "superadmin"
  },
  {
    name: "Event Organiser",
    username: "organiser",
    password: "nexus123",
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
    desc: "FINVERSE: Link & Think | Asventiq: IdeaNest | Mind War: Round 1",
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
    desc: "FINVERSE: Cash Clash | Asventiq: BrandShift",
    color: "#e63c5c"
  },
  {
    id: "6",
    time: "3:30 PM",
    title: "Round 3 - Finals",
    desc: "FINVERSE: Bid to Win | AdvWar | Mind War: Stress Round",
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
const EVENT_REQUIREMENTS = {
  // Team-based events (5 members total with department breakdown)
  FINVERSE: {
    name: "FINVERSE",
    type: "team",
    totalMembers: 5,
    category: null,
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "5-member team: 2 HR, 2 Marketing, 1 Finance"
  },
  ASVENTIQ: {
    name: "ASVENTIQ",
    type: "team",
    totalMembers: 5,
    category: null,
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "5-member team: 2 HR, 2 Marketing, 1 Finance"
  },
  "MIND WAR": {
    name: "MIND WAR",
    type: "team",
    totalMembers: 5,
    category: null,
    departmentRequirements: {
      HR: { min: 2, max: 2 },
      Marketing: { min: 2, max: 2 },
      Finance: { min: 1, max: 1 }
    },
    description: "5-member team: 2 HR, 2 Marketing, 1 Finance"
  },
  // Cultural events with category-specific limits
  CULTURAL_DANCE: {
    name: "Dance",
    type: "cultural",
    category: "Dance",
    totalMembers: 4,
    maxCapacity: 4,
    departmentRequirements: null,
    description: "Cultural event - Dance: Maximum 4 members"
  },
  CULTURAL_RAMP_WALK: {
    name: "Ramp Walk",
    type: "cultural",
    category: "Ramp Walk",
    totalMembers: 1,
    maxCapacity: 1,
    departmentRequirements: null,
    description: "Cultural event - Ramp Walk: 1 member"
  }
};

module.exports = {
  DEFAULT_SETTINGS,
  DEFAULT_TIMELINE,
  DEFAULT_USERS,
  EVENT_REQUIREMENTS
};
