# 🚀 QUICK START - Screenshot Fix

## The Problem
✗ Screenshots in database but **not showing in CMS**
✗ Upload says success but files don't exist on disk

## What Was Fixed
✅ Enhanced directory handling - ensures upload folder is writable
✅ File verification - confirms file was actually saved
✅ Better error messages - shows exactly what went wrong
✅ Diagnostic tools - check system status
✅ Recovery scripts - find missing files

---

## Quick Actions (Choose One)

### 👉 **I Just Updated - What Do I Do?**
```bash
# 1. Test the system
node test-screenshot-system.js

# 2. Restart the server
npm start

# 3. Test an upload
# Go to http://localhost:4000/register.html
# Complete registration with screenshot
# Check server logs for [Screenshot] messages

# 4. Verify in CMS
# http://localhost:4000/cms/registrations.html
# Click on registration - screenshot should show
```

---

### 👉 **Screenshots Are Missing From Old Uploads**
```bash
# Check what's missing
node recover-screenshots.js

# This tells you:
# - How many screenshots are in database
# - How many files exist on disk
# - Which files are missing
# - Their expected paths
```

---

### 👉 **I Get "Screenshot File Not Found" Error**
```bash
# 1. Check diagnostic info
curl -H "Authorization: Bearer <your_admin_token>" \
  http://localhost:4000/api/cms/diagnostics/payment-screenshots

# 2. This returns:
# - Directory path
# - Whether it's writable
# - How many files are missing
# - Details about each missing file
```

---

### 👉 **Permissions/Access Issues**
```bash
# Check directory permissions
ls -la uploads/

# Make sure it's writable
chmod 755 uploads/
chmod 755 uploads/payment-screenshots/

# Test disk write
node test-screenshot-system.js
```

---

## New Tools Available

| Tool | Command | Purpose |
|------|---------|---------|
| Test System | `node test-screenshot-system.js` | Check all upload prerequisites |
| Recovery | `node recover-screenshots.js` | Find missing screenshot files |
| Diagnostic API | `GET /api/cms/diagnostics/payment-screenshots` | Get system status (admin only) |

---

## Key Logs to Look For

When uploading a screenshot, you should see in server console:

```
✅ Good Log Output:
[Screenshot Upload] File uploaded to: /path/to/uploads/payment-screenshots/...
[Screenshot Upload] Filename: 80595-1776582748697.jpg
[Screenshot] Saved for code: 80595 → 80595-1776582748697.jpg
[Screenshot] File verified at: /path/to/uploads/payment-screenshots/80595-1776582748697.jpg

❌ Bad Log Output (means file wasn't saved):
[Screenshot Upload] ERROR: File not found after save: ...
```

---

## Emergency Recovery

If many screenshots are missing and users need to re-upload:

```bash
# Option 1: Clear the problematic records (users re-upload)
# Use MongoDB directly or via API

# Option 2: Copy files if they're elsewhere
mv /some/other/location/*.jpg uploads/payment-screenshots/

# Option 3: Check temp directory for lost files
ls -la /tmp/ | grep 80595  # Linux/Mac
dir %temp% | findstr 80595  # Windows
```

---

## How to Know It's Fixed

When you:
1. Upload a screenshot → ✅ See `[Screenshot] Saved for code:` in logs
2. Go to CMS → ✅ Screenshot displays (not "Screenshot file not found")
3. Run diagnostic → ✅ `validFiles` shows the files, `missingFiles` is empty
4. Run recovery → ✅ Shows all files exist

---

## Files Modified

- `server/routes/public.js` - Upload handling improved
- `server/routes/cms.js` - Retrieval & diagnostic endpoints

## New Files Created

- `recover-screenshots.js` - Recovery utility
- `test-screenshot-system.js` - System test
- `SCREENSHOT_FIX_GUIDE.md` - Detailed troubleshooting
- `SCREENSHOT_FIX_CHANGES.md` - Technical changes summary

---

## Still Having Issues?

1. **Check logs first** - `NODE_ENV=development npm start`
2. **Run tests** - `node test-screenshot-system.js`
3. **Check diagnostics** - Use the diagnostic API endpoint
4. **Review guide** - See `SCREENSHOT_FIX_GUIDE.md`
5. **Manual recovery** - Use `recover-screenshots.js`

---

## Success Indicators ✅

- [ ] Server logs show upload messages with file paths
- [ ] Screenshots display in CMS (no 404 errors)
- [ ] Diagnostic endpoint shows valid files
- [ ] New uploads work immediately
- [ ] Test script shows all checks passing
