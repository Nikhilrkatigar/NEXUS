#!/usr/bin/env node
/**
 * Complete registration flow test
 */

const { validateTeamComposition, normalizeDepartment } = require("./server/registrationValidator");

console.log("\n=== COMPLETE REGISTRATION FLOW TEST ===\n");

// Simulate what happens in collectParticipants()
const formData = [
  { name: "P1", phone: "+91...", department: "PEOPLE PULSE" },
  { name: "P2", phone: "+91...", department: "PEOPLE PULSE" },
  { name: "P3", phone: "+91...", department: "BRAND BLITZ" },
  { name: "P4", phone: "+91...", department: "BRAND BLITZ" },
  { name: "P5", phone: "+91...", department: "FINANCE FRONTIER" }
];

console.log("Step 1: Form data collected from UI:");
console.log(JSON.stringify(formData, null, 2));

// Simulate what happens in the POST handler (normalization)
console.log("\nStep 2: Normalize departments in POST handler:");
const normalizedParticipants = formData.map((p) => {
  const normalized = normalizeDepartment(p.department);
  console.log(`  "${p.department}" → "${normalized}"`);
  return {
    ...p,
    department: normalized
  };
});

// Simulate validation
console.log("\nStep 3: Create registration object and validate:");
const registrationData = {
  participants: normalizedParticipants
};

const validation = validateTeamComposition(registrationData, "NEXUS_TEAM");

console.log("\nStep 4: Validation result:");
console.log("  Valid:", validation.valid);
console.log("  Breakdown:", validation.breakdown);
console.log("  Errors:", validation.errors);

if (validation.valid) {
  console.log("\n✓ SUCCESS: Registration would be accepted!");
} else {
  console.log("\n✗ FAILED: Registration would be rejected!");
  console.log("\nDebug Info:");
  console.log("Expected breakdown: { HR: 2, Marketing: 2, Finance: 1 }");
  console.log("Actual breakdown:  ", validation.breakdown);
}

process.exit(validation.valid ? 0 : 1);
