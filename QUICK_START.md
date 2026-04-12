# Quick Start - Payment System

## What's New?

The registration form now includes a **3-step payment verification process**:

1. **Step 1**: Fill & Submit Registration Form (existing)
2. **Step 2**: View Payment QR Code (NEW)
3. **Step 3**: Upload Payment Screenshot (NEW)

Plus admin payment verification in CMS!

## For Users

### Quick Steps

```
1. Complete registration form
   ↓
2. After success, see payment QR code + registration code
   ↓
3. Scan QR to make payment
   ↓
4. Take screenshot of payment confirmation
   ↓
5. Return to form (your data is saved!)
   ↓
6. Upload screenshot in Step 3
   ↓
7. ✓ Done! Admin will verify
```

### Key Features

✓ **Data Persists**: Close browser, return later, data is still there!
✓ **Progress Tracking**: See which step you're on
✓ **Clear Instructions**: Know exactly what to do at each step
✓ **File Preview**: See screenshot before uploading
✓ **Drag & Drop**: Easy file upload with drag-and-drop

## For Admins

### What You Can Do Now

In **CMS → Registrations**:

1. See payment status for each registration
   - ✓ Verified (green badge)
   - ⏳ Pending (yellow badge)

2. View payment screenshot
   - Click "View" on any registration
   - See screenshot thumbnail
   - Click to view full-size image

3. Verify or Reject
   - **Verify**: Confirm payment is valid
   - **Reject**: Ask user to resubmit

4. Export Data
   - CSV includes payment status

### Admin Actions

```
Click [View] on registration
    ↓
See payment screenshot
    ↓
Choose one:
  a) [✓ Verify Payment]  → Status becomes ✓ Verified
  b) [✕ Reject]         → User must resubmit
```

## Getting Started

### Setup (One-time)

1. **Note**: Payment screenshots directory is created automatically
   - Location: `uploads/payment-screenshots/`
   - No manual setup needed!

2. **Server restart** (if needed):
   ```bash
   npm run dev
   ```

### First Test

1. Go to `/register`
2. Fill form and submit
3. See payment QR code
4. Click back (your data stays!)
5. Upload test screenshot
6. Login to CMS
7. View registration with payment badge

## User Flow Example

```
User's Journey with State Persistence:

2:00 PM: Visit /register
2:05 PM: Fill form and click "Register Team"
2:06 PM: See QR code for payment
2:07 PM: Navigate to payment app (Data saved automatically)
2:10 PM: Complete payment
2:15 PM: Close browser
...
3:30 PM: Return to /register
3:31 PM: Page loads and shows Step 2 (Payment)
        ✓ Registration Code: 12345
        ✓ QR Code: Still visible
        ✓ Everything remembered!
3:32 PM: Upload payment screenshot
3:33 PM: Success!
```

## Important Notes

### For Users
- **Browser must have localStorage enabled** (default)
- **Data cleared when**: Browser cache cleared, incognito mode used
- **Keep registration code**: Used for all payment-related queries
- **Upload only valid payment screenshots**: JPEG, PNG, or WebP

### For Admins
- **File stored on server**: `uploads/payment-screenshots/{code}-{timestamp}.jpg`
- **Rejection deletes file**: User must resubmit new screenshot
- **Audit logged**: Every verify/reject action is recorded

## Common Questions

**Q: What if user doesn't upload screenshot?**
A: Registration stays in "pending" state until screenshot uploaded

**Q: Can user resubmit screenshot?**
A: Yes! They can upload a new one anytime or after rejection

**Q: What happens if I reject a payment?**
A: Screenshot is deleted, user sees message to resubmit

**Q: Is the QR code static or dynamic?**
A: Currently static (shows Cloudinary URL). Can be made dynamic later with UPI/PaymentLink

**Q: Can user see their payment status?**
A: Currently in registration code. Can add status page later

**Q: How long is payment data stored?**
A: Indefinitely (until manually deleted by admin)

## Testing Checklist

- [ ] Register successfully
- [ ] See payment QR code
- [ ] Close browser and return
- [ ] Data is still there
- [ ] Upload test screenshot
- [ ] Admin sees payment badge
- [ ] Admin views screenshot
- [ ] Admin clicks Verify Payment
- [ ] Status changes to ✓ Verified
- [ ] CSV export includes payment status

## Files Modified

- `register.html` - Multi-step form
- `server/models/Registration.js` - Payment fields
- `server/routes/public.js` - Payment endpoints
- `server/routes/cms.js` - Admin verification endpoints
- `cms/registrations.html` - Payment display in admin
- `server/app.js` - Directory creation

## New Files Created

- `PAYMENT_SETUP.md` - Complete technical guide
- `PAYMENT_USER_GUIDE.md` - Detailed user flows
- `QUICK_START.md` - This file!

## Support

For issues or questions about payment system:
1. Check browser console for errors
2. Check server logs
3. Verify MongoDB is running
4. Ensure authentication tokens are valid

## Next Steps (Optional Future Enhancements)

- [ ] Email notifications on payment verification
- [ ] SMS notifications
- [ ] Payment status API for users to check
- [ ] Automated payment gateway integration (UPI/PayPal/Stripe)
- [ ] Payment analytics dashboard
- [ ] Receipt generation
- [ ] Bulk payment verification
- [ ] Payment reminder emails

---

**System Ready!** 🎉

Everything is set up and ready to use. Users can now:
1. Register through the form
2. See payment QR code
3. Upload payment screenshot
4. Have admins verify the payment

All with complete state persistence so users won't lose their data!
