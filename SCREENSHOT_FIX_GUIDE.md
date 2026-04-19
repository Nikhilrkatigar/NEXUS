# Screenshot Upload Issue - DIAGNOSIS & FIX

## Problem
Users are uploading payment screenshots successfully, but the screenshots are **not visible in the CMS**. Database shows the filename is stored (e.g., `paymentScreenshot: "80595-1776582748697.jpg"`), but the file doesn't exist on disk.

## Root Cause
The issue occurs when:
1. Multer configuration or permissions prevent files from being written to disk
2. The upload directory path is incorrectly configured
3. File permissions or filesystem issues prevent disk writes
4. Path separators or working directory issues on different environments

## Applied Fixes

### 1. Enhanced Directory Handling (public.js)
- Added `ensureUploadDir()` function that verifies directory exists and is writable **before each upload**
- Improved error messages to indicate if directory is inaccessible
- Checks both existence and write permissions

### 2. Better File Verification (public.js upload handler)
- Added verification that file actually exists on disk after multer saves it
- Returns error if file verification fails: "File upload verification failed — file not found after save"
- Enhanced logging shows:
  - Where multer tried to save the file
  - Where the file was supposed to be
  - Whether directories exist

### 3. Improved Retrieval Logging (cms.js)
- Enhanced `/api/cms/payment-screenshot/:code` endpoint with detailed logging
- When file is missing, console shows:
  - Expected screenshot path
  - Whether directory exists
  - List of files actually in the directory
  - Helps identify path mismatches

### 4. Diagnostic Endpoint (cms.js)
- New endpoint: `GET /api/cms/diagnostics/payment-screenshots` (superadmin only)
- Returns:
  - Upload directory path and accessibility status
  - Count of registrations with screenshots in database
  - List of valid files on disk
  - List of missing files with paths
  - Any access errors

### 5. Recovery Script (recover-screenshots.js)
- Run: `node recover-screenshots.js`
- Scans database for screenshots with records in MongoDB
- Checks if files exist on disk
- Shows summary of missing/found files
- Helps identify orphaned records or filesystem issues

## Testing the Fix

### Step 1: Check Current Status
```bash
# Check diagnostic endpoint (requires admin login)
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:4000/api/cms/diagnostics/payment-screenshots
```

Expected output:
```json
{
  "uploadDir": ".../uploads/payment-screenshots",
  "dirExists": true,
  "dirWritable": true,
  "registrationsWithScreenshots": 5,
  "missingFiles": [...],
  "validFiles": [...],
  "errors": []
}
```

### Step 2: Run Recovery Script
```bash
node recover-screenshots.js
```

This will show:
- How many screenshots are in the database
- How many files actually exist on disk
- Which files are missing and their expected paths

### Step 3: Restart Server and Test Upload
1. Restart the application: `npm start`
2. Upload a new screenshot through the registration form
3. Check server logs for upload messages:
   ```
   [Screenshot Upload] File uploaded to: ...
   [Screenshot Upload] Filename: ...
   [Screenshot] Saved for code: ...
   [Screenshot] File verified at: ...
   ```

### Step 4: Verify in CMS
- Log in to CMS at `/cms/registrations.html`
- Click on a registration that just uploaded a screenshot
- Screenshot should load (no "Screenshot file not found" message)
- If still failing, check diagnostic endpoint output

## Common Issues & Solutions

### Issue: "Upload directory not accessible" Error
**Solution:**
- Check file permissions on `uploads/` directory
- On Windows: Ensure user running Node has write permissions
- On Linux/Mac: Run `chmod 755 uploads/payment-screenshots`

### Issue: Files in DB but Not on Disk
**Diagnosis:**
```bash
node recover-screenshots.js
```

**Solutions:**
- Check server logs for upload errors
- Verify disk space is available: `df -h`
- Restart server to reset multer state
- Have users re-upload screenshots

### Issue: Still Getting "Screenshot file not found" After Restart
1. Run diagnostic endpoint to see actual files:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:4000/api/cms/diagnostics/payment-screenshots
   ```
2. Check `missingFiles` array — shows which files don't exist
3. If all files are missing, there's a directory path issue
4. Check that `uploads/payment-screenshots/` directory is accessible from Node process

## Environment Variables (if needed)
The upload directory is determined by:
```javascript
const uploadsDir = path.join(__dirname, "../../uploads/payment-screenshots");
```

This should work automatically, but ensure:
- Node process has write permissions to parent `uploads/` directory
- `uploads/` directory exists (will be auto-created)
- Disk has sufficient space

## Logs to Check

Enable verbose logging (already in code for non-production):
```bash
NODE_ENV=development npm start
```

Look for messages like:
```
[Screenshot Upload] File uploaded to: ...
[Screenshot Upload] Expected directory: ...
[Screenshot] Saved for code: ...
```

If these don't appear, multer is not receiving files properly.

## Next Steps if Issue Persists

1. **Check multer installation:**
   ```bash
   npm ls multer
   ```

2. **Verify Node can write files:**
   ```bash
   node -e "require('fs').writeFileSync('test.txt', 'test'); console.log('OK')"
   ```

3. **Check file system permissions:**
   ```bash
   ls -la uploads/  # On Unix/Linux/Mac
   ```

4. **Monitor file system during upload:**
   - Watch the `uploads/payment-screenshots/` directory while uploading
   - Use `lsof` (Unix) or Process Monitor (Windows) to see what Node is doing

5. **Check application logs for multer errors:**
   - Look for errors from the `upload.single("screenshot")` middleware
   - Check if `req.file` is undefined in the handler

## Recovery Commands

### Clear DB Records for Missing Files
```bash
# Use MongoDB directly (be careful!)
# Find registrations with missing files and decide what to do
# Options: 
# 1. Clear paymentScreenshot field (user re-uploads)
# 2. Delete entire registration record (if incomplete)
```

### Clean Directory and Re-upload
```bash
# Remove old screenshots
rm -rf uploads/payment-screenshots/*

# Then have users re-upload through the form
```

## Prevention
- Monitor `/api/cms/diagnostics/payment-screenshots` regularly
- Check server logs after each update
- Test screenshot upload after any deployment changes
- Ensure `uploads/` directory is in backup/version control (.gitignore)
