#!/usr/bin/env node
/**
 * Screenshot Upload System Test
 * ============================
 * Quick test to verify the screenshot upload system is working correctly
 * 
 * Usage: node test-screenshot-system.js
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Screenshot Upload System Test\n");

// Test 1: Check uploads directory
console.log("Test 1: Uploads Directory");
const uploadsDir = path.join(__dirname, "uploads", "payment-screenshots");
console.log(`  Path: ${uploadsDir}`);
const dirExists = fs.existsSync(uploadsDir);
console.log(`  Exists: ${dirExists ? "✅" : "❌"}`);

if (dirExists) {
  try {
    fs.accessSync(uploadsDir, fs.constants.R_OK);
    console.log(`  Readable: ✅`);
  } catch {
    console.log(`  Readable: ❌`);
  }
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log(`  Writable: ✅`);
  } catch {
    console.log(`  Writable: ❌`);
  }
  
  // Count files
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`  Files: ${files.length}`);
  } catch (e) {
    console.log(`  Files: ❌ (${e.message})`);
  }
} else {
  console.log("  ⚠️  Directory doesn't exist - will be created on first upload\n");
  console.log("  Attempting to create...");
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("  ✅ Directory created successfully");
  } catch (e) {
    console.log(`  ❌ Failed to create: ${e.message}`);
  }
}

// Test 2: Check multer is installed
console.log("\nTest 2: Dependencies");
try {
  require("multer");
  console.log("  multer: ✅");
} catch {
  console.log("  multer: ❌ Not installed");
}

try {
  require("express");
  console.log("  express: ✅");
} catch {
  console.log("  express: ❌ Not installed");
}

// Test 3: Check database connection configuration
console.log("\nTest 3: Database Configuration");
try {
  require("dotenv").config();
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/nexus";
  console.log(`  URL: ${mongoUrl.includes("localhost") ? "localhost" : "remote"}`);
  console.log("  ✅ Configuration found");
} catch (e) {
  console.log(`  ❌ ${e.message}`);
}

// Test 4: File write test
console.log("\nTest 4: Disk Write Test");
const testFile = path.join(uploadsDir, "test-write-permission.txt");
try {
  fs.writeFileSync(testFile, "test", "utf8");
  const exists = fs.existsSync(testFile);
  if (exists) {
    console.log("  Write test: ✅");
    fs.unlinkSync(testFile);
  } else {
    console.log("  Write test: ❌ File not created");
  }
} catch (e) {
  console.log(`  Write test: ❌ ${e.message}`);
}

// Test 5: Image validation
console.log("\nTest 5: Image Validation");
try {
  // Create a test JPEG (minimal valid JPEG)
  const testJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
  const testPath = path.join(uploadsDir, "test-image.jpg");
  fs.writeFileSync(testPath, testJpeg);
  
  // Try to validate
  const fd = fs.openSync(testPath, "r");
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  
  const isValidJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  console.log(`  JPEG validation: ${isValidJpeg ? "✅" : "❌"}`);
  
  fs.unlinkSync(testPath);
} catch (e) {
  console.log(`  Image validation: ❌ ${e.message}`);
}

console.log("\n" + "=".repeat(50));
console.log("Next Steps:");
console.log("1. Run: npm start");
console.log("2. Visit: http://localhost:4000/register.html");
console.log("3. Complete registration and upload a screenshot");
console.log("4. Check server console for [Screenshot] messages");
console.log("5. Run: node recover-screenshots.js");
console.log("6. Visit CMS and verify screenshot appears\n");
