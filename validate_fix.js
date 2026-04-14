#!/usr/bin/env node
/**
 * Direct validation test for registration fix
 */

const { validateTeamComposition } = require("./server/registrationValidator");

console.log("\n=== REGISTRATION FIX VALIDATION ===\n");

// Test 1: Valid team with PEOPLE PULSE / BRAND BLITZ / FINANCE FRONTIER
const testCase1 = {
  participants: [
    { name: "P1", department: "PEOPLE PULSE" },
    { name: "P2", department: "PEOPLE PULSE" },
    { name: "P3", department: "BRAND BLITZ" },
    { name: "P4", department: "BRAND BLITZ" },
    { name: "P5", department: "FINANCE FRONTIER" }
  ]
};

const result1 = validateTeamComposition(testCase1, "NEXUS_TEAM");
console.log("Test 1 - Valid team composition (PEOPLE PULSE/BRAND BLITZ/FINANCE FRONTIER):");
console.log("  Valid:", result1.valid);
console.log("  Breakdown:", result1.breakdown);
console.log("  Errors:", result1.errors.length > 0 ? result1.errors : "None");
console.log("");

// Test 2: Invalid - only 1 PEOPLE PULSE
const testCase2 = {
  participants: [
    { name: "P1", department: "PEOPLE PULSE" },
    { name: "P2", department: "BRAND BLITZ" },
    { name: "P3", department: "BRAND BLITZ" },
    { name: "P4", department: "FINANCE FRONTIER" },
    { name: "P5", department: "FINANCE FRONTIER" }
  ]
};

const result2 = validateTeamComposition(testCase2, "NEXUS_TEAM");
console.log("Test 2 - Invalid (1 PEOPLE PULSE, should be 2):");
console.log("  Valid:", result2.valid);
console.log("  Breakdown:", result2.breakdown);
console.log("  Errors:", result2.errors);
console.log("");

// Test 3: Valid with old HR/Marketing/Finance format
const testCase3 = {
  participants: [
    { name: "P1", department: "HR" },
    { name: "P2", department: "HR" },
    { name: "P3", department: "Marketing" },
    { name: "P4", department: "Marketing" },
    { name: "P5", department: "Finance" }
  ]
};

const result3 = validateTeamComposition(testCase3, "NEXUS_TEAM");
console.log("Test 3 - Valid team with old format (HR/Marketing/Finance):");
console.log("  Valid:", result3.valid);
console.log("  Breakdown:", result3.breakdown);
console.log("  Errors:", result3.errors.length > 0 ? result3.errors : "None");
console.log("");

// Test 4: Cultural requirements (dance/rampwalk)
const testCase4 = {
  participants: [
    { name: "P1", department: "PEOPLE PULSE", danceParticipant: true },
    { name: "P2", department: "PEOPLE PULSE", danceParticipant: true },
    { name: "P3", department: "BRAND BLITZ", rampWalkParticipant: true },
    { name: "P4", department: "BRAND BLITZ" },
    { name: "P5", department: "FINANCE FRONTIER" }
  ]
};

const result4 = validateTeamComposition(testCase4, "NEXUS_TEAM");
console.log("Test 4 - Cultural participation (2 dance, 1 rampwalk):");
console.log("  Valid:", result4.valid);
console.log("  Breakdown:", result4.breakdown);
console.log("  Errors:", result4.errors.length > 0 ? result4.errors : "None");
console.log("");

// Summary
const allPass = result1.valid && !result2.valid && result3.valid && result4.valid;
console.log("=== SUMMARY ===");
console.log("All tests passed:", allPass ? "✓ YES" : "✗ NO");

if (!allPass) {
  console.log("\nFailed tests:");
  if (!result1.valid) console.log("  ✗ Test 1 should pass");
  if (result2.valid) console.log("  ✗ Test 2 should fail");
  if (!result3.valid) console.log("  ✗ Test 3 should pass");
  if (!result4.valid) console.log("  ✗ Test 4 should pass");
  process.exit(1);
}

console.log("\n✓ All validation tests passed!\n");
