#!/usr/bin/env node
/**
 * Screenshot Recovery Utility
 * =============================
 * This script diagnoses and recovers screenshot files that may be orphaned
 * or stored in incorrect locations.
 * 
 * Usage: node recover-screenshots.js
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Registration = require("./server/models/Registration");
const { connectDatabase } = require("./server/db");

const screenshotDir = path.join(__dirname, "uploads", "payment-screenshots");
const nodeModulesDir = path.join(__dirname, "node_modules");

async function main() {
  try {
    console.log("🔍 Screenshot Recovery Utility");
    console.log("================================\n");

    // Connect to database
    console.log("📦 Connecting to database...");
    await connectDatabase();
    console.log("✅ Connected\n");

    // Check screenshot directory
    console.log("📂 Checking screenshot directory...");
    const dirExists = fs.existsSync(screenshotDir);
    console.log(`   Directory: ${screenshotDir}`);
    console.log(`   Exists: ${dirExists ? "✅ Yes" : "❌ No"}\n`);

    if (!dirExists) {
      console.log("⚠️  Creating screenshots directory...");
      fs.mkdirSync(screenshotDir, { recursive: true });
      console.log("✅ Created\n");
    }

    // Get all registrations with payment screenshots
    console.log("🔎 Scanning database for registrations with screenshots...");
    const registrations = await Registration.find(
      { paymentScreenshot: { $exists: true, $ne: "" } },
      "code college paymentScreenshot paymentStatus"
    ).lean();

    console.log(`   Found: ${registrations.length} registrations\n`);

    if (registrations.length === 0) {
      console.log("ℹ️  No screenshots found in database\n");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check each screenshot
    console.log("📋 Checking screenshot files:\n");
    let missing = 0;
    let found = 0;
    const missingDetails = [];

    for (const reg of registrations) {
      const screenshotPath = path.join(screenshotDir, reg.paymentScreenshot);
      const exists = fs.existsSync(screenshotPath);

      if (exists) {
        const stat = fs.statSync(screenshotPath);
        console.log(`✅ ${reg.code}: ${reg.paymentScreenshot} (${(stat.size / 1024).toFixed(2)} KB)`);
        found++;
      } else {
        console.log(`❌ ${reg.code}: ${reg.paymentScreenshot} — NOT FOUND`);
        missing++;
        missingDetails.push({
          code: reg.code,
          college: reg.college,
          filename: reg.paymentScreenshot,
          expectedPath: screenshotPath
        });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total in DB: ${registrations.length}`);
    console.log(`   Found: ${found} ✅`);
    console.log(`   Missing: ${missing} ❌`);

    if (missing > 0) {
      console.log(`\n⚠️  Missing screenshots:\n`);
      missingDetails.forEach((item, idx) => {
        console.log(`   ${idx + 1}. Code: ${item.code}`);
        console.log(`      College: ${item.college}`);
        console.log(`      Expected: ${item.filename}`);
        console.log(`      Path: ${item.expectedPath}\n`);
      });

      // Offer recovery options
      console.log("💡 Recovery Options:");
      console.log("   1. Check if multer temp directory has the files");
      console.log("   2. Clear database records for missing files (optional)");
      console.log("   3. Ask users to re-upload screenshots\n");

      // Check system temp directory for multer uploads
      const tmpDir = process.env.TEMP || process.env.TMP || "/tmp";
      const possibleFiles = [];
      
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir).filter(f => 
          missingDetails.some(m => f.includes(m.code))
        );
        if (files.length > 0) {
          console.log("📂 Found potential files in temp directory:");
          files.forEach(f => console.log(`   - ${f}`));
          possibleFiles.push(...files);
        }
      }
    }

    console.log("\n✅ Recovery scan complete!");
    console.log("\nNext steps:");
    console.log("1. Check server logs for upload errors");
    console.log("2. Run: node recover-screenshots.js --check-temp");
    console.log("3. Restart the server and have users re-upload if needed\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
