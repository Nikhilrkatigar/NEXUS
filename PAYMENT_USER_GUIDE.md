# Payment System - User Experience Guide

## Registration Flow Diagram

```
┌─────────────────────────────────────────┐
│        User Visits /register            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     STEP 1: Registration Form           │
│  ✓ College Name                         │
│  ✓ Email                                │
│  ✓ Team Leader                          │
│  ✓ Participants                         │
│  ✓ Select Event                         │
│                                         │
│  [Clear]  [Register Team]               │
└─────────────────────────────────────────┘
                    │
                    ▼
         ✓ Registration Success!
             Code: 12345
                    │
                    ▼
┌─────────────────────────────────────────┐
│       STEP 2: Payment Display           │
│                                         │
│  📱 Payment Required                    │
│                                         │
│  ┌──────────────────────────────┐      │
│  │                              │      │
│  │     [QR CODE IMAGE]          │      │
│  │  (Scan with phone)           │      │
│  │                              │      │
│  └──────────────────────────────┘      │
│                                         │
│  Registration Code: 12345               │
│                                         │
│  Instructions:                          │
│  • Scan the QR code with your phone    │
│  • Complete the payment                │
│  • Take screenshot of confirmation     │
│  • Upload screenshot below              │
└─────────────────────────────────────────┘
                    │
                    ▼
        ✓ Payment Complete!
      Take Payment Confirmation Screenshot
                    │
                    ▼
┌─────────────────────────────────────────┐
│    STEP 3: Upload Verification          │
│                                         │
│  📸 Upload Payment Screenshot           │
│                                         │
│  ┌──────────────────────────────┐      │
│  │  [Drag & Drop or Click]      │      │
│  │  PNG, JPG, WebP (Max 5MB)    │      │
│  │                              │      │
│  │  📤 [Upload Area]            │      │
│  │                              │      │
│  └──────────────────────────────┘      │
│                                         │
│  ✓ Screenshot Preview Shown             │
│                                         │
│  [Upload Screenshot] [Back to Dashboard]│
└─────────────────────────────────────────┘
                    │
                    ▼
        ✓ Screenshot Uploaded!
          Awaiting Admin Verification
                    │
                    ▼
┌─────────────────────────────────────────┐
│    Registration Complete!               │
│    Pending Payment Verification         │
│    Check back for updates               │
└─────────────────────────────────────────┘
```

## State Persistence Feature

```
Scenario: User navigates away during payment

┌─────────────────┐
│ User in Step 2  │  → Fills registration code in form
│ (Payment)       │  → Starts payment process
│                 │  → Must go to bank/payment app
└────────┬────────┘
         │
         │ [Data saved to localStorage automatically]
         │
         ▼
    Closes browser OR
    Visits different URL
         │
         │
         ▼
    Navigates back to /register
         │
         │ [Page detects saved state]
         │
         ▼
    Forms show:
    ✓ Step 1 Completed ✓
    ◆ Step 2 Active   (Back to payment display)
    ○ Step 3 Pending  (Screenshot upload)
         │
         │
         ▼
    User can continue from Step 2
    (No data loss)
```

## Admin Workflow

### Reviewing Payment Submissions

#### CMS Registrations Table View
```
# | Code  | College      | Event      | Group Leader | Faculty  | Participants | Payment      | Date
1 | #1001 | City College | Dance      | Raj Kumar    | Dr. Smith| 5 participants| ✓ Verified  | 1/15/2026
2 | #1002 | Tech Institute| Ramp Walk  | Priya Singh  | Prof. Doe| 3 participants| ⏳ Pending   | 1/16/2026
3 | #1003 | Alpha School | Cultural   | Amit Patel   | Ms. Jane | 4 participants| ✓ Verified  | 1/16/2026
```

#### Click "View" on Registration #1002

```
┌─────────────────────────────────────────────────┐
│          Registration Details                   │
│                                                 │
│              #1002                              │
│                                                 │
│  College: Tech Institute                        │
│  Event: Ramp Walk                               │
│  Email: tech@college.edu                        │
│  Faculty: Prof. Doe                             │
│  Group Leader: Priya Singh                      │
│  Registered: 1/16/2026 2:30 PM                  │
│                                                 │
│  ─────────────────────────────────────────      │
│  PAYMENT STATUS: ⏳ Pending Verification        │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │                                     │       │
│  │  [Payment Screenshot Thumbnail]     │       │
│  │  (Click to view full size)          │       │
│  │                                     │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  [✓ Verify Payment]  [✕ Reject]               │
│  ─────────────────────────────────────────      │
│                                                 │
│  PARTICIPANTS:                                  │
│  1. Priya Singh      +91 9876543210             │
│  2. Rohit Kumar      +91 9876543211             │
│  3. Maya Patel       +91 9876543212             │
│                                                 │
│                                          [x]    │
└─────────────────────────────────────────────────┘
```

### Actions Available

#### Action 1: Verify Payment
```
Admin clicks: [✓ Verify Payment]
      ↓
System confirms: "Mark this payment as verified?"
      ↓
Admin confirms
      ↓
✓ Payment verified successfully
  - Status changes to "✓ Verified"
  - paymentVerifiedAt timestamp set
  - Audit log created
  - Calendar updated (registration confirmed)
```

#### Action 2: Reject Payment
```
Admin clicks: [✕ Reject]
      ↓
System confirms: "Reject this payment? User will resubmit."
      ↓
Admin confirms
      ↓
✓ Payment rejected
  - Screenshot file deleted
  - Status reset to "⏳ Pending"
  - User sees message to resubmit
  - Can upload new screenshot
  - Audit log created
```

## Email Notifications (Future)

```
After Payment Screenshot Upload:
─────────────────────────────────
To: team@college.edu
Subject: Payment Screenshot Received - NEXUS Registration #1002

Hi Priya,

Thank you for uploading your payment screenshot for registration #1002.
We have received it and will verify within 24 hours.

Registration: NEXUS 2026 - Ramp Walk
Team: Tech Institute
Status: Pending Verification

You will receive an email once your payment is verified.

Thanks,
NEXUS Team

─────────────────────────────────

After Admin Verification:
─────────────────────────
To: team@college.edu
Subject: Payment Verified! ✓ NEXUS Registration #1002

Hi Priya,

Great! Your payment has been verified successfully.

Registration Code: 1002
Team: Tech Institute
Event: Ramp Walk
Status: ✓ CONFIRMED

You're all set to participate in NEXUS 2026!

Thanks,
NEXUS Team

─────────────────────────
(Email feature can be added later)
```

## File Upload Scenarios

### Success Scenario
```
User selects payment screenshot:
  Image: payment_proof.jpg
  Size: 2.5 MB
  Type: JPEG
      ↓
Client validation:
  ✓ Is image → YES
  ✓ MIME type → image/jpeg
  ✓ Size < 5MB → YES
      ↓
Server receives file
      ↓
Server validation:
  ✓ File type → image/jpeg
  ✓ File size → 2.5 MB
  ✓ No malware → NO THREATS
      ↓
File saved to: uploads/payment-screenshots/1002-1642345890.jpg
      ↓
Database updated:
  paymentScreenshot: "1002-1642345890.jpg"
  paymentStatus: "pending"
      ↓
User sees: "✓ Screenshot uploaded successfully!"
```

### Error Scenario 1: Wrong File Type
```
User selects: test.pdf
      ↓
Client validation fails:
  ✗ Is image → NO
      ↓
Error message: "Please select an image file"
Action: File not sent to server
```

### Error Scenario 2: File Too Large
```
User selects: large_image.jpg (8 MB)
      ↓
Client validation fails:
  ✗ Size < 5MB → NO (8 MB > 5 MB)
      ↓
Error message: "File size must be less than 5MB"
Action: File not sent to server
```

### Error Scenario 3: Server Issues
```
User uploads: payment.png (valid)
      ↓
Server receives file
      ↓
Server error occurs
      ↓
"Upload failed" message
      ↓
Options:
  - Try again
  - Select different file
  - Contact support
```

## Data Flow Summary

### Registration Submission
```
Form → Validation → API /api/public/registrations → Database → Success
                                                                   ↓
                                                      Show registration code
```

### Payment Screenshot Upload
```
File Selection → Client Validation → API /api/public/registrations/:code/payment-screenshot
    ↓                                                    ↓
Drag & Drop      Check Type, Size                    Server Validation
Click Browse     Show Preview                        ↓ Save to uploads/
                                                     ↓ Update database
                                                     ↓ Return success
```

### Admin Verification
```
CMS View Registrations
    ↓
Click "View" on registration
    ↓
Load details: GET /api/cms/payment-screenshot/:code
    ↓
Display screenshot thumbnail
    ↓
Admin actions:
  a) Verify: POST /api/cms/registrations/:code/verify-payment
  b) Reject: POST /api/cms/registrations/:code/reject-payment
```

## LocalStorage Structure

```javascript
// Saved in browser when user registers
localStorage.setItem('currentRegistrationCode', '12345');
localStorage.setItem('currentStep', '2');

// On page return
if (localStorage.getItem('currentRegistrationCode')) {
  // Restore form state
  // Show appropriate step
  // User can continue
}

// Cleared when:
// - Registration completes successfully
// - User clicks "Clear" button
// - Browser history is cleared
```

## Summary

**Key Points:**
1. ✓ Multi-step registration with progress tracking
2. ✓ State auto-saves to localStorage
3. ✓ QR code displayed for payment
4. ✓ Screenshot upload with preview
5. ✓ Admin can verify/reject payments
6. ✓ Audit trail for all actions
7. ✓ CSV export includes payment status
8. ✓ Security validation on all uploads
