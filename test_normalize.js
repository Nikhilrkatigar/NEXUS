#!/usr/bin/env node
/**
 * Direct normalization test
 */

const { normalizeDepartment } = require("./server/registrationValidator");

console.log("\n=== NORMALIZATION TEST ===\n");

const testCases = [
  "PEOPLE PULSE",
  "BRAND BLITZ",
  "FINANCE FRONTIER",
  "HR",
  "Marketing",
  "Finance",
  ""
];

testCases.forEach((dept) => {
  const normalized = normalizeDepartment(dept);
  console.log(`"${dept}" → "${normalized}"`);
});

console.log("\n=== EXPECTED RESULTS ===");
console.log("PEOPLE PULSE → HR");
console.log("BRAND BLITZ → Marketing");
console.log("FINANCE FRONTIER → Finance");

const actual = {
  "PEOPLE PULSE": normalizeDepartment("PEOPLE PULSE"),
  "BRAND BLITZ": normalizeDepartment("BRAND BLITZ"),
  "FINANCE FRONTIER": normalizeDepartment("FINANCE FRONTIER")
};

console.log("\n=== ACTUAL RESULTS ===");
console.log(JSON.stringify(actual, null, 2));

const allCorrect = 
  actual["PEOPLE PULSE"] === "HR" &&
  actual["BRAND BLITZ"] === "Marketing" &&
  actual["FINANCE FRONTIER"] === "Finance";

console.log(`\nAll correct: ${allCorrect ? "✓ YES" : "✗ NO"}`);

if (!allCorrect) {
  process.exit(1);
}
