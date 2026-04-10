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
  teamMembers: [
    { id: "team-1", name: "Prof. Mahesh Hiremath", role: "Faculty Head - Finance", dept: "FINVERSE", deptColor: "#00d4ff", initial: "MH", bg: "linear-gradient(135deg,#00d4ff,#0099bb)", imageUrl: "" },
    { id: "team-2", name: "Prof. P. Monica", role: "Faculty Head - Marketing", dept: "ASVENTIQ", deptColor: "#f5a623", initial: "PM", bg: "linear-gradient(135deg,#f5a623,#d4890f)", imageUrl: "" },
    { id: "team-3", name: "Prof. Mary Anthony", role: "Faculty Head - HR", dept: "MIND WAR", deptColor: "#e63c5c", initial: "MA", bg: "linear-gradient(135deg,#e63c5c,#c43050)", imageUrl: "" },
    { id: "team-4", name: "Vaishnavi", role: "Organiser - Round 1", dept: "HR", deptColor: "#e63c5c", initial: "V", bg: "linear-gradient(135deg,#e63c5c,#ff6b6b)", imageUrl: "" },
    { id: "team-5", name: "Manali", role: "Organiser - Round 1", dept: "HR", deptColor: "#e63c5c", initial: "M", bg: "linear-gradient(135deg,#e63c5c,#ff6b6b)", imageUrl: "" },
    { id: "team-6", name: "Maltesh", role: "Organiser - Round 1", dept: "HR", deptColor: "#e63c5c", initial: "M", bg: "linear-gradient(135deg,#e63c5c,#ff6b6b)", imageUrl: "" },
    { id: "team-7", name: "Sayeda", role: "Organiser - Round 2", dept: "HR", deptColor: "#e63c5c", initial: "S", bg: "linear-gradient(135deg,#ff6b6b,#e63c5c)", imageUrl: "" },
    { id: "team-8", name: "Ajay", role: "Organiser - Round 2", dept: "HR", deptColor: "#e63c5c", initial: "A", bg: "linear-gradient(135deg,#ff6b6b,#e63c5c)", imageUrl: "" },
    { id: "team-9", name: "Sumaya", role: "Organiser - IdeaNest & AdvWar", dept: "Marketing", deptColor: "#f5a623", initial: "S", bg: "linear-gradient(135deg,#f5a623,#d4890f)", imageUrl: "" },
    { id: "team-10", name: "Madhu", role: "Organiser - IdeaNest", dept: "Marketing", deptColor: "#f5a623", initial: "M", bg: "linear-gradient(135deg,#f5a623,#ffc107)", imageUrl: "" },
    { id: "team-11", name: "Vishal", role: "Organiser - BrandShift", dept: "Marketing", deptColor: "#f5a623", initial: "V", bg: "linear-gradient(135deg,#ffc107,#f5a623)", imageUrl: "" },
    { id: "team-12", name: "Madhura", role: "Organiser - BrandShift", dept: "Marketing", deptColor: "#f5a623", initial: "M", bg: "linear-gradient(135deg,#d4890f,#f5a623)", imageUrl: "" },
    { id: "team-13", name: "Likith", role: "Organiser - AdvWar", dept: "Marketing", deptColor: "#f5a623", initial: "L", bg: "linear-gradient(135deg,#f5a623,#d4890f)", imageUrl: "" },
    { id: "team-14", name: "Veerbhadra", role: "Organiser - Link & Think", dept: "Finance", deptColor: "#00d4ff", initial: "V", bg: "linear-gradient(135deg,#00d4ff,#0099bb)", imageUrl: "" },
    { id: "team-15", name: "Samruddhi", role: "Organiser - Link & Think", dept: "Finance", deptColor: "#00d4ff", initial: "S", bg: "linear-gradient(135deg,#00d4ff,#00b3d9)", imageUrl: "" },
    { id: "team-16", name: "Khushi", role: "Organiser - Cash Clash", dept: "Finance", deptColor: "#00d4ff", initial: "K", bg: "linear-gradient(135deg,#0099bb,#00d4ff)", imageUrl: "" },
    { id: "team-17", name: "Prajwal", role: "Organiser - Cash Clash", dept: "Finance", deptColor: "#00d4ff", initial: "P", bg: "linear-gradient(135deg,#00b3d9,#00d4ff)", imageUrl: "" },
    { id: "team-18", name: "Ritu", role: "Organiser - Bid to Win", dept: "Finance", deptColor: "#00d4ff", initial: "R", bg: "linear-gradient(135deg,#00d4ff,#0080aa)", imageUrl: "" },
    { id: "team-19", name: "Abhishek", role: "Organiser - Bid to Win", dept: "Finance", deptColor: "#00d4ff", initial: "A", bg: "linear-gradient(135deg,#0099bb,#007799)", imageUrl: "" }
  ]
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
