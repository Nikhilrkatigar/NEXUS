# Team Registration Quick Start Guide

## What Changed?

NEXUS now requires specific team compositions for events:

### Team Events (5 members):
```
FINVERSE, ASVENTIQ, MIND WAR
├─ 2 HR Members
├─ 2 Marketing Members
└─ 1 Finance Member
```

### Cultural Events:
```
Dance         → up to 4 members
Ramp Walk     → 1 member only
```

## How to Register

### 1. Open Registration Form
Visit: `http://localhost:4000/register.html`

Or click "Register Your Team" → "Open Registration Form" on the homepage

### 2. Fill Team Information
- College Name *
- Email *
- Address (optional)
- Select Event *

### 3. Select Event Type
- Choose from: FINVERSE, ASVENTIQ, MIND WAR, Dance, Ramp Walk
- Requirements display automatically

### 4. Add Team Leader
- Leader Name *
- Faculty Advisor
- Faculty Phone

### 5. Add Team Members
For each member:
- **Name** - Full name required
- **Phone** - Contact number
- **Department** - HR, Marketing, or Finance (auto-selected based on progress for team events)

The form will:
- ✓ Show real-time member count
- ✓ Show department breakdown
- ✓ Highlight when requirements are met
- ✓ Block submission if invalid

### 6. Submit & Get Code
Click "Register Team" when all requirements met
→ Success! Your registration code appears

## Example: Registering for FINVERSE

**Step 1**: Select "FINVERSE" event
- Form shows: "5-member team: 2 HR, 2 Marketing, 1 Finance"
- 5 participant fields appear

**Step 2**: Add Members
```
Member 1: Name, Phone, Department: HR       → Status: HR (1/2)
Member 2: Name, Phone, Department: HR       → Status: HR (2/2) ✓
Member 3: Name, Phone, Department: Marketing → Status: Marketing (1/2)
Member 4: Name, Phone, Department: Marketing → Status: Marketing (2/2) ✓
Member 5: Name, Phone, Department: Finance  → Status: Finance (1/1) ✓
```

**Step 3**: Submit
- All requirements met → Registration succeeds
- Code: 42857

## Example: Registering for Dance

**Step 1**: Select "Dance" event
- Form shows: "Cultural event - Dance: Maximum 4 members"
- 4 participant fields appear
- NO Department dropdown (not needed)

**Step 2**: Add Members (up to 4)
```
Member 1: Name, Phone
Member 2: Name, Phone
Member 3: Name, Phone
Member 4: Name, Phone
```

**Step 3**: Submit
- Can submit with 1-4 members
- Code: 58462

## Real-Time Validation Indicators

### What You'll See:

```
Status Indicators (top of form):
✓ 5/5 Members          (when all 5 added)
✓ HR (2)               (when 2 HR members)
✓ Marketing (2)        (when 2 Marketing members)
✓ Finance (1)          (when 1 Finance member)
```

### Color Coding:
- **Pending** (Gray) - Still needed
- **Done** (Green) - Requirement met
- **Error** (Red) - Requirement violated

## Error Messages

### Too Few Members
```
Error: Team must have exactly 5 members. You have 3.
```
**Fix**: Add 2 more participants

### Wrong Department Split
```
Error: HR: Must have exactly 2 member(s). You have 1.
```
**Fix**: Change one participant's department to HR

### Invalid Event Selection
```
Error: Please select an event
```
**Fix**: Choose an event from dropdown

## API Usage (Developers)

### Get Available Events
```bash
curl http://localhost:4000/api/public/events
```

Response shows all events with requirements.

### Submit Registration Programmatically
```bash
curl -X POST http://localhost:4000/api/public/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "college": "College Name",
    "email": "team@college.edu",
    "leader": "Team Leader",
    "event": "FINVERSE",
    "participants": [
      {"name": "P1", "phone": "0000", "department": "HR"},
      {"name": "P2", "phone": "0000", "department": "HR"},
      {"name": "P3", "phone": "0000", "department": "Marketing"},
      {"name": "P4", "phone": "0000", "department": "Marketing"},
      {"name": "P5", "phone": "0000", "department": "Finance"}
    ]
  }'
```

## Troubleshooting

### Q: Can I change team members after registration?
**A**: Not yet. Re-register with the correct team (new code issued).

### Q: What if someone isn't HR/Marketing/Finance department?
**A**: This system is designed for the 2026 BA Department fest where all participants come from these departments. Contact organizers for exceptions.

### Q: Can Dance team have more than 4 members?
**A**: No. Maximum 4 for Dance competition.

### Q: Is Ramp Walk strictly 1 person?
**A**: Yes. Ramp Walk event requires exactly 1 member.

### Q: What does the registration code do?
**A**: Save it! Present at event check-in to confirm registration.

### Q: Can multiple teams from same college register?
**A**: Yes! Each team gets a unique code. Submit separate registrations.

### Q: Is the form mobile-friendly?
**A**: Yes! Works on phones, tablets, and desktops.

## Offline Access

The registration form works offline (if previously loaded):
- Data entered is saved locally
- Submission will queue when online
- Uses PWA technology

## Support

### For Registration Issues:
- Check event requirements at top of form
- Ensure all required fields (marked *) are filled
- Verify department counts match requirements

### For Technical Support:
- Contact: BA Department Organizers
- Check: `REGISTRATION_REQUIREMENTS.md` for detailed docs
- API: GET `/api/public/events` for programmatic access

## Key Files

- **Registration Form**: `/register.html`
- **Documentation**: `REGISTRATION_REQUIREMENTS.md`
- **API Routes**: `server/routes/public.js`
- **Validation Logic**: `server/registrationValidator.js`
- **Event Config**: `server/defaults.js` (EVENT_REQUIREMENTS)

## Quick Reference

| Event | Members | Departments | Link |
|-------|---------|-------------|------|
| FINVERSE | 5 | 2HR + 2Mkt + 1Fin | `/register.html` |
| ASVENTIQ | 5 | 2HR + 2Mkt + 1Fin | `/register.html` |
| MIND WAR | 5 | 2HR + 2Mkt + 1Fin | `/register.html` |
| Dance | 1-4 | None | `/register.html` |
| Ramp Walk | 1 | None | `/register.html` |

---

**For complete documentation, see**: `REGISTRATION_REQUIREMENTS.md`
**Version**: 1.0.0
**Last Updated**: April 2026
