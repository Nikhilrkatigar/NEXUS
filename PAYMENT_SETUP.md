# Payment System Setup & Guide

## Overview

The NEXUS Event Management system now includes a complete payment workflow with QR code display and screenshot verification.

## Features Implemented

### 1. **User Registration Flow**
- **Step 1**: Fill registration form (existing)
- **Step 2**: View payment QR code after registration
- **Step 3**: Upload payment screenshot verification

### 2. **State Persistence**
- Registration data is automatically saved to browser's localStorage
- If user navigates away during payment step, they can return and continue
- No data loss on page reload

### 3. **Payment Display**
- Direct QR code visible on payment step
- Registration code displayed for reference
- Clear instructions for payment process

### 4. **Screenshot Upload**
- Drag & drop support
- Click to browse and upload
- Preview before submission
- Automatic validation (JPEG, PNG, WebP only)
- File size limit: 5MB

## File Structure

```
uploads/
├── payment-screenshots/    (NEW - Payment screenshots stored here)
├── site-assets/
└── team-members/

server/models/
└── Registration.js         (UPDATED - Added payment fields)

server/routes/
├── public.js               (UPDATED - Added payment endpoints)
└── cms.js                  (UPDATED - Added verification endpoints)

cms/
└── registrations.html      (UPDATED - Payment status display & verification UI)

register.html              (UPDATED - Multi-step registration form)
```

## Database Schema Updates

The Registration model now includes:

```javascript
// Payment Status Fields
paymentStatus: "pending" | "verified"
paymentScreenshot: String       // Filename
paymentScreenshotPath: String   // Full server path
paymentVerifiedAt: Date         // When admin verified
```

## API Endpoints

### Public Endpoints

#### Get Payment Status
```
GET /api/public/registrations/:code/payment-status
Response:
{
  code: "12345",
  paymentStatus: "pending",
  paymentScreenshot: "12345-1234567890.jpg",
  paymentVerifiedAt: null
}
```

#### Upload Payment Screenshot
```
POST /api/public/registrations/:code/payment-screenshot
Content-Type: multipart/form-data
Field: screenshot (file)

Response:
{
  success: true,
  message: "Payment screenshot uploaded successfully. Awaiting admin verification.",
  registration: { ... }
}
```

### Admin Endpoints (Requires Authentication)

#### Get Payment Screenshot
```
GET /api/cms/payment-screenshot/:code
Returns: Binary image file
```

#### Verify Payment
```
POST /api/cms/registrations/:code/verify-payment

Response:
{
  ok: true,
  message: "Payment verified successfully",
  registration: { ... }
}
```

#### Reject Payment
```
POST /api/cms/registrations/:code/reject-payment

Response:
{
  ok: true,
  message: "Payment rejected - user can resubmit",
  registration: { ... }
}
```

## Admin Features in CMS

### Registration List
- New "Payment" column shows status badge
- Green "✓ Verified" for verified payments
- Yellow "⏳ Pending" for pending payments

### Registration Details
- View payment screenshot thumbnail
- Click thumbnail to see full-size image in modal
- **Verify Payment** - Marks payment as verified
- **Reject Payment** - Deletes screenshot and resets to pending

### Audit Trail
- All payment verifications/rejections logged
- Includes user, timestamp, and action details

## How to Use

### For Users

1. **Fill Registration Form**
   - Complete all required fields
   - Select event and participants

2. **View Payment Instructions**
   - After registration, see QR code
   - Copy or photograph the registration code

3. **Make Payment**
   - Scan QR code with phone
   - Complete payment process

4. **Upload Verification**
   - Take screenshot of payment confirmation
   - Return to registration form (data auto-saved)
   - Upload screenshot in Step 3

### For Admin

1. **Review Registrations**
   - Go to CMS → Registrations
   - Look for "⏳ Pending" status in Payment column

2. **Verify Payment**
   - Click "View" on registration
   - See payment screenshot thumbnail
   - Click to view full-size image
   - Click "✓ Verify Payment" button

3. **Reject Payment**
   - If screenshot invalid: Click "✕ Reject"
   - User can resubmit new screenshot

4. **Export Data**
   - CSV export includes payment status
   - Download updated data for records

## Testing Checklist

- [ ] Complete registration form and submit
- [ ] Verify you're taken to payment step
- [ ] Check localStorage has registration code
- [ ] Close browser and return to /register
- [ ] Verify form state is restored
- [ ] Upload test payment screenshot
- [ ] Login to CMS
- [ ] View registration with payment screenshot
- [ ] Test Verify Payment button
- [ ] Check audit log for payment action
- [ ] Test Reject Payment button
- [ ] Download CSV export with payment status

## Browser Compatibility

- Modern browsers with localStorage support
- File drag-and-drop support
- Image preview support

## Important Notes

1. **Screenshot Storage**: Saved in `uploads/payment-screenshots/`
2. **File Limits**: Max 5MB per image
3. **Accepted Formats**: JPEG, PNG, WebP
4. **Auto-cleanup**: Rejected screenshots are automatically deleted
5. **State Persistence**: Only works if user doesn't clear browser data
6. **Authentication**: Payment verification requires admin login

## Troubleshooting

### Registration code not showing?
- Check browser console for errors
- Verify API endpoint is working
- Check `GET /api/health`

### Can't upload screenshot?
- Ensure file is valid image (JPEG, PNG, WebP)
- Check file size is < 5MB
- Verify browser allows file uploads
- Check console for CORS errors

### Admin can't see payment screenshot?
- Verify admin user has correct role (superadmin/organiser)
- Check that file exists in `uploads/payment-screenshots/`
- Verify registration code is correct

### State not persisting?
- Check if browser has localStorage enabled
- Verify browser isn't in private/incognito mode
- Check if localStorage is full (quota exceeded)

## Security Considerations

- Validate file types on both client and server
- Limit file sizes to prevent storage abuse
- Require authentication for sensitive operations
- Log all admin actions (audit trail)
- Secure file storage with proper permissions

## Future Enhancements

- Automated QR code generation with UPI/PaymentLink
- Payment status notifications (email/SMS)
- Batch payment verification
- Payment analytics dashboard
- Integration with payment gateways
- Automated receipt generation
