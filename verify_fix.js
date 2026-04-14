#!/usr/bin/env node
/**
 * Standalone validation test - no server needed
 * Proves the normalization logic works with exact department names
 */

const { validateTeamComposition, normalizeDepartment } = require("./server/registrationValidator");

console.log("\n" + "=".repeat(70));
console.log("NEXUS REGISTRATION FIX VERIFICATION TEST");
console.log("=".repeat(70));

// Test 1: Direct normalization with exact UI names
console.log("\n[TEST 1] Department Name Mapping");
console.log("-".repeat(70));
console.log("UI Department       →   Backend Department");
console.log("-".repeat(70));

const deptTests = [
  { ui: "PEOPLE PULSE", backend: "HR" },
  { ui: "BRAND BLITZ", backend: "Marketing" },
  { ui: "FINANCE FRONTIER", backend: "Finance" }
];

let deptTestPass = true;
deptTests.forEach((test) => {
  const result = normalizeDepartment(test.ui);
  const pass = result === test.backend;
  deptTestPass = deptTestPass && pass;
  const status = pass ? "✓" : "✗";
  console.log(`${test.ui.padEnd(20)} → ${result.padEnd(20)} ${status}`);
});

// Test 2: Full validation with exact form data
console.log("\n[TEST 2] Registration with Exact Form Data");
console.log("-".repeat(70));

const registration = {
  participants: [
    { name: "vajreswari", department: "PEOPLE PULSE", phone: "+918197773999" },
    { name: "vajreswari", department: "PEOPLE PULSE", phone: "+918197773999" },
    { name: "vajreswari", department: "BRAND BLITZ", phone: "+918197773999" },
    { name: "vajreswari", department: "BRAND BLITZ", phone: "+918197773999" },
    { name: "vajreswari", department: "FINANCE FRONTIER", phone: "+918197773999" }
  ]
};

console.log("Form Data (as submitted):");
registration.participants.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name.padEnd(15)} - ${p.department}`);
});

const validation = validateTeamComposition(registration, "NEXUS_TEAM");

console.log("\nAfter Normalization:");
console.log(`  HR (PEOPLE PULSE):           ${validation.breakdown.HR} / 2`);
console.log(`  Marketing (BRAND BLITZ):     ${validation.breakdown.Marketing} / 2`);
console.log(`  Finance (FINANCE FRONTIER):  ${validation.breakdown.Finance} / 1`);

console.log("\nValidation Status:");
console.log(`  Valid: ${validation.valid ? "✓ YES" : "✗ NO"}`);
console.log(`  Errors: ${validation.errors.length === 0 ? "None" : validation.errors.join("; ")}`);

const validTest = validation.valid && 
  validation.breakdown.HR === 2 && 
  validation.breakdown.Marketing === 2 && 
  validation.breakdown.Finance === 1;

console.log(`  Test: ${validTest ? "✓ PASS" : "✗ FAIL"}`);

// Test 3: Invalid case (should fail)
console.log("\n[TEST 3] Invalid Composition (Should Fail)");
console.log("-".repeat(70));

const invalidRegistration = {
  participants: [
    { name: "P1", department: "PEOPLE PULSE" },
    { name: "P2", department: "BRAND BLITZ" },
    { name: "P3", department: "BRAND BLITZ" },
    { name: "P4", department: "FINANCE FRONTIER" },
    { name: "P5", department: "FINANCE FRONTIER" }
  ]
};

const invalidValidation = validateTeamComposition(invalidRegistration, "NEXUS_TEAM");
console.log("Form: 1 PEOPLE PULSE, 2 BRAND BLITZ, 2 FINANCE FRONTIER");
console.log(`  Breakdown: HR=${invalidValidation.breakdown.HR}, Marketing=${invalidValidation.breakdown.Marketing}, Finance=${invalidValidation.breakdown.Finance}`);
console.log(`  Valid: ${invalidValidation.valid ? "✓ YES" : "✗ NO (Expected)"}`);
console.log(`  Error: ${invalidValidation.errors[0] || "None"}`);

const invalidTest = !invalidValidation.valid && invalidValidation.errors.length > 0;
console.log(`  Test: ${invalidTest ? "✓ PASS (Correctly rejected)" : "✗ FAIL"}`);

// Summary
console.log("\n" + "=".repeat(70));
console.log("SUMMARY");
console.log("=".repeat(70));

const allPass = deptTestPass && validTest && invalidTest;
console.log(`Test 1 - Department Mapping:      ${deptTestPass ? "✓ PASS" : "✗ FAIL"}`);
console.log(`Test 2 - Valid Registration:      ${validTest ? "✓ PASS" : "✗ FAIL"}`);
console.log(`Test 3 - Invalid Registration:    ${invalidTest ? "✓ PASS" : "✗ FAIL"}`);
console.log("\n" + (allPass ? 
  "✓✓✓ ALL TESTS PASS - FIX IS WORKING! ✓✓✓\n" +
  "    The server just needs to be restarted.\n" +
  "    Once restarted, registrations will succeed."
  : 
  "✗ TESTS FAILED - FIX NEEDS ADJUSTMENT")
);
console.log("=".repeat(70) + "\n");

process.exit(allPass ? 0 : 1);

