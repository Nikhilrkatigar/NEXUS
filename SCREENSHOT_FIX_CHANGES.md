# Payment Screenshot Upload Fix - Summary of Changes

## Issue
Screenshots were being stored in the database with filenames (e.g., `"80595-1776582748697.jpg"`) but the actual files were not being saved to disk, resulting in "Screenshot file not found" errors when viewing registration details in the CMS.

## Changes Made

### 1. **server/routes/public.js** - Enhanced Upload Directory Handling
**Location:** Lines 48-77

**Changes:**
- Added `ensureUploadDir()` function to verify directory exists AND is writable
- Function runs on module load and before each upload
- Improved error handling to catch directory access issues
- Added detailed console logging for debugging
- Multer destination callback now checks directory accessibility

**Key Addition:**
```javascript
function ensureUploadDir() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.accessSync(uploadsDir, fs.constants.W_OK); // Check writable
    return true;
  } catch (err) {
    console.error(`[Screenshot Upload] Directory not writable...`, err.message);
    return false;
  }
}
```

---

### 2. **server/routes/public.js** - Enhanced Upload Handler
**Location:** Lines 295-355 (Upload POST endpoint)

**Changes:**
- Added logging of file path and upload directory
- Added file verification after upload to ensure file exists on disk
- Better error messages if file verification fails
- Logs file size and path for debugging

**Key Addition:**
```javascript
// Verify file actually exists on disk
const verifyPath = path.join(uploadsDir, req.file.filename);
if (!fs.existsSync(verifyPath)) {
  console.error(`[Screenshot Upload] ERROR: File not found after save: ${verifyPath}`);
  throw makeError("File upload verification failed — file not found after save", 500);
}
```

---

### 3. **server/routes/cms.js** - Enhanced Retrieval Endpoint
**Location:** Lines 495-532 (GET /api/cms/payment-screenshot/:code)

**Changes:**
- Added detailed logging when screenshot is requested
- Better error messages showing directory status
- Lists sample files in directory if not found
- Helps identify path mismatches

**Key Addition:**
```javascript
if (!fs.existsSync(screenshotPath)) {
  const dirContents = fs.existsSync(screenshotDir) ? fs.readdirSync(screenshotDir) : [];
  console.error(`[Payment Screenshot] File not found: ${screenshotPath}`);
  console.error(`[Payment Screenshot] Directory contains: ${dirContents.length} files`);
  throw makeError("Screenshot file not found", 404);
}
```

---

### 4. **server/routes/cms.js** - New Diagnostic Endpoint
**Location:** Lines 988-1044 (GET /api/cms/diagnostics/payment-screenshots)

**Endpoint:** `GET /api/cms/diagnostics/payment-screenshots` (superadmin only)

**Returns:**
- Upload directory path
- Directory existence and writeability status
- Count of registrations with screenshots in DB
- List of valid files on disk with sizes
- List of missing files with expected paths
- Any access errors encountered

**Usage:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/cms/diagnostics/payment-screenshots
```

---

### 5. **recover-screenshots.js** - New Recovery Utility Script
**New File**

**Usage:** `node recover-screenshots.js`

**Does:**
- Connects to database
- Scans for all registrations with screenshot records
- Checks which files exist on disk
- Shows detailed missing file list
- Provides recovery recommendations

**Output Example:**
```
📊 Summary:
   Total in DB: 5
   Found: 3 ✅
   Missing: 2 ❌

❌ Missing Screenshots:
   1. Code: 80595
      College: KLE cbalc
      Expected: 80595-1776582748697.jpg
```

---

### 6. **test-screenshot-system.js** - New System Test Script
**New File**

**Usage:** `node test-screenshot-system.js`

**Tests:**
- Upload directory existence and permissions
- Dependency installation (multer, express)
- Database configuration
- Disk write permissions
- Image validation logic

---

### 7. **SCREENSHOT_FIX_GUIDE.md** - Comprehensive Documentation
**New File**

**Includes:**
- Problem diagnosis
- Root cause analysis
- Testing procedures
- Troubleshooting guide
- Recovery procedures
- Prevention recommendations

---

## How to Apply These Changes

### Step 1: Verify Changes
The following files have been modified:
- ✅ `server/routes/public.js` - Enhanced upload handling
- ✅ `server/routes/cms.js` - Enhanced retrieval + diagnostic endpoint

### Step 2: Test the System
```bash
# Run system test
node test-screenshot-system.js

# Then start the server
npm start
```

### Step 3: Check Current Status
```bash
# Diagnose existing screenshots
node recover-screenshots.js

# Or via API (requires admin token)
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:4000/api/cms/diagnostics/payment-screenshots
```

### Step 4: Test Upload
1. Go to `/register.html`
2. Complete registration with payment screenshot
3. Check server logs for upload messages
4. View in CMS - screenshot should appear

### Step 5: Handle Missing Files (if needed)
```bash
# Clear database records for missing files (optional)
# This forces users to re-upload screenshots

# Or manually move files if they exist elsewhere
mv <source>/screenshots/* uploads/payment-screenshots/
```

---

## Verification Checklist

After applying the changes:

- [ ] Server starts without errors
- [ ] `node test-screenshot-system.js` shows all ✅
- [ ] `node recover-screenshots.js` shows file status
- [ ] New screenshot upload works
- [ ] Screenshot appears in CMS `/cms/registrations.html`
- [ ] Diagnostic endpoint returns valid data
- [ ] Server logs show `[Screenshot]` messages

---

## Troubleshooting

### If "Screenshot file not found" still appears:
1. Run: `node recover-screenshots.js`
2. Check which files are missing
3. Run: `node test-screenshot-system.js`
4. Review server logs during upload

### If diagnostic endpoint returns errors:
- Check directory permissions: `ls -la uploads/`
- Ensure Node.js has write access
- Verify disk space available

### If new uploads fail:
- Check server logs for `[Screenshot Upload]` messages
- Review error: "Directory not accessible" vs "File verification failed"
- Check disk space and permissions

---

## Key Improvements

1. ✅ **Proactive Directory Checking** - Ensures directory is writable before each upload
2. ✅ **File Verification** - Confirms file was actually written to disk
3. ✅ **Better Logging** - Detailed console output for debugging
4. ✅ **Diagnostic Tools** - Easy way to check system status
5. ✅ **Recovery Scripts** - Identify and fix orphaned files
6. ✅ **Documentation** - Comprehensive troubleshooting guide

---

## What Was NOT Changed

The following remain unchanged (working correctly):
- Database schema
- Frontend upload form
- CMS display logic
- Authentication/authorization
- Rate limiting
- Image validation (magic bytes check)

---

## Testing Priority

1. **High:** Test new screenshot uploads
2. **High:** Verify screenshots appear in CMS
3. **Medium:** Run diagnostic endpoint
4. **Medium:** Run recovery script for existing data
5. **Low:** Check console logs for new messages
