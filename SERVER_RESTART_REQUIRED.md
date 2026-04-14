# CRITICAL: Server Must Be Restarted

## What Was Fixed

The registration department mapping now works correctly:

1. **server/registrationValidator.js** - Added `normalizeDepartment()` function with:
   - PEOPLE PULSE → HR
   - BRAND BLITZ → Marketing  
   - FINANCE FRONTIER → Finance

2. **server/routes/public.js** - Normalizes incoming departments BEFORE validation

3. **Debug logging** - Added console.log to trace:
   - Raw department from form
   - Normalized department value
   - Final department counts

## Why You Still See The Error

The code files are updated ✓, but **the Node.js server process is still running the OLD code**.

Node.js loads code into memory when the server starts. File changes don't take effect until the server restarts.

## How To Fix

### 1. Stop the Server
```bash
# Kill any running "npm start" or "node" processes
# Windows:
tasklist /FI "IMAGENAME eq node.exe"
taskkill /PID <PID> /F

# Or Ctrl+C in terminal where server is running
```

### 2. Restart the Server
```bash
npm start
```

The output will show:
```
[Registration] Normalizing department: "PEOPLE PULSE" → "HR"
[Registration] Normalizing department: "PEOPLE PULSE" → "HR"
[Registration] Normalizing department: "BRAND BLITZ" → "Marketing"
...
[Validator] Department counts: { HR: 2, Marketing: 2, Finance: 1 }
```

### 3. Test Registration Again
Fill out the form with 5 members and submit. It should now succeed.

---

## Verification Steps

1. **Check server logs** - You should see normalization debug output:
   ```
   [Registration] Normalizing department: "PEOPLE PULSE" → "HR"
   ```

2. **Check browser console** - Should show success message with registration code

3. **No more error** - The "Invalid team composition" message should be gone

---

## Files Modified (Ready to Use)

✓ server/registrationValidator.js - Normalization logic
✓ server/routes/public.js - Apply normalization  
✓ register.html - Already sends correct data

All changes are in place. **Just restart the server.**
