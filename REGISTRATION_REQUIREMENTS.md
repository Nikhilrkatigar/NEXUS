# Team Registration Requirements System

## Overview
This document outlines the team composition requirements for NEXUS 2026 events. Teams must meet specific department and member requirements to be eligible for competition.

## Team Composition Requirements

### General Events (FINVERSE, ASVENTIQ, MIND WAR)

#### Total Members: **5**

#### Department Breakdown (Mandatory):
- **HR Department**: Exactly 2 members
- **Marketing Department**: Exactly 2 members  
- **Finance Department**: Exactly 1 member

**Example Valid Team:**
```
1. Participant 1 (HR)
2. Participant 2 (HR)
3. Participant 3 (Marketing)
4. Participant 4 (Marketing)
5. Participant 5 (Finance)
```

### Cultural Events

#### Dance
- **Total Members**: Maximum 4 members
- **Requirements**: No department requirements
- **Category**: Cultural/Performing Arts

#### Ramp Walk
- **Total Members**: 1 member
- **Requirements**: No department requirements
- **Category**: Cultural/Fashion

## Events List

| Event | Type | Team Size | Requirements | Max Capacity |
|-------|------|-----------|--------------|--------------|
| FINVERSE | Competitive | 5 | 2 HR, 2 Marketing, 1 Finance | 5 |
| ASVENTIQ | Competitive | 5 | 2 HR, 2 Marketing, 1 Finance | 5 |
| MIND WAR | Competitive | 5 | 2 HR, 2 Marketing, 1 Finance | 5 |
| Dance | Cultural | 4 | None | 4 |
| Ramp Walk | Cultural | 1 | None | 1 |

## Registration Process

### Step 1: Access Registration
- Navigate to `/register.html` or click "Register Team" button
- Or access via `/api/public/events` to get programmatic list

### Step 2: Enter Team Information
- **College Name**: Your institution name
- **Email**: Contact email for the team
- **Address**: Team office or college address (optional)

### Step 3: Select Event
- Choose event from dropdown
- System displays specific requirements for selected event
- Dynamic participant fields appear based on team size

### Step 4: Enter Team Leader
- **Leader Name**: Primary contact for the team
- **Faculty Advisor**: Optional faculty coordinator name
- **Faculty Phone**: Contact number for faculty advisor

### Step 5: Add Participants
- Add each team member with:
  - Full Name
  - Phone Number
  - Department (for events requiring it)
- System validates in real-time:
  - Total member count matches requirement
  - Department breakdown is correct
  - No duplicate entries

### Step 6: Submit Registration
- Review validation status
- Click "Register Team" button
- Receive confirmation with registration code

## Validation Rules

### Real-time Validation
The registration form performs real-time validation:

1. **Member Count Check**
   - Validates exact count for team events
   - Validates maximum count for cultural events

2. **Department Distribution Check**
   - For team events: verifies exact 2-2-1 split
   - Prevents duplicate department assignments in violation

3. **Field Completion Check**
   - Ensures all required fields are filled
   - Validates email format
   - Validates phone number format

### Server-side Validation
Upon submission, server validates:

```javascript
{
  valid: true,
  errors: [],
  requirements: { /* event requirements */ },
  breakdown: { HR: 2, Marketing: 2, Finance: 1 }
}
```

If validation fails:
```json
{
  error: "Invalid team composition: HR: Must have exactly 2 member(s). You have 1."
}
```

## API Endpoints

### Get Event Requirements
```
GET /api/public/events
```

Returns:
```json
{
  "events": [
    {
      "key": "FINVERSE",
      "name": "FINVERSE",
      "type": "team",
      "totalMembers": 5,
      "description": "5-member team: 2 HR, 2 Marketing, 1 Finance",
      "departmentRequirements": {
        "HR": { "min": 2, "max": 2 },
        "Marketing": { "min": 2, "max": 2 },
        "Finance": { "min": 1, "max": 1 }
      }
    },
    ...
  ]
}
```

### Submit Registration
```
POST /api/public/registrations
```

Request body:
```json
{
  "college": "Sample College",
  "email": "team@college.edu",
  "leader": "Team Leader Name",
  "event": "FINVERSE",
  "faculty": "Dr. Faculty Name",
  "facultyPhone": "+91 9876543210",
  "address": "College Address",
  "participants": [
    { "name": "Member 1", "phone": "+91 9876543210", "department": "HR" },
    { "name": "Member 2", "phone": "+91 9876543210", "department": "HR" },
    { "name": "Member 3", "phone": "+91 9876543210", "department": "Marketing" },
    { "name": "Member 4", "phone": "+91 9876543210", "department": "Marketing" },
    { "name": "Member 5", "phone": "+91 9876543210", "department": "Finance" }
  ]
}
```

Response (Success):
```json
{
  "registration": {
    "code": "12345",
    "college": "Sample College",
    "email": "team@college.edu",
    "event": "FINVERSE",
    "leader": "Team Leader Name",
    "participants": 5,
    "createdAt": "2026-04-15T10:30:00Z"
  }
}
```

Response (Error):
```json
{
  "message": "Invalid team composition: HR: Must have exactly 2 member(s). You have 1."
}
```

## Data Structure

### Registration Schema
```javascript
{
  code: String,              // Unique 5-digit registration code
  college: String,          // Team's college
  address: String,          // Team address
  email: String,            // Contact email
  event: String,            // Event key (FINVERSE, ASVENTIQ, etc.)
  faculty: String,          // Faculty advisor name
  facultyPhone: String,     // Faculty phone
  leader: String,           // Team leader name
  participants: [{          // Array of participants
    name: String,
    phone: String,
    department: String      // HR, Marketing, Finance
  }],
  category: String,         // For cultural events: Dance, Ramp Walk
  departmentBreakdown: {    // Calculated for team events
    HR: Number,
    Marketing: Number,
    Finance: Number
  },
  sourceIp: String,         // Registration IP for audit
  createdAt: Date,
  updatedAt: Date
}
```

## Error Scenarios

### Insufficient Members
```
Error: Invalid team composition: Team must have exactly 5 members. You have 3.
```

### Incorrect Department Distribution
```
Error: Invalid team composition: 
HR: Must have exactly 2 member(s). You have 1.
Marketing: Must have exactly 2 member(s). You have 3.
```

### Missing Required Fields
```
Error: College, email, leader, and event are required.
```

### Invalid Event
```
Error: Event not found or invalid.
```

## Examples

### Valid FINVERSE Registration
```json
{
  "college": "St. Joseph's College",
  "email": "business@sjc.ac.in",
  "leader": "Ameera",
  "event": "FINVERSE",
  "faculty": "Prof. Mahesh Hiremath",
  "facultyPhone": "+91 9876543210",
  "participants": [
    { "name": "Ameera", "phone": "+91 9988776655", "department": "HR" },
    { "name": "Vaishnavi", "phone": "+91 9988776654", "department": "HR" },
    { "name": "Sumaya", "phone": "+91 9988776653", "department": "Marketing" },
    { "name": "Madhu", "phone": "+91 9988776652", "department": "Marketing" },
    { "name": "Veerbhadra", "phone": "+91 9988776651", "department": "Finance" }
  ]
}
```

### Valid Dance Registration
```json
{
  "college": "St. Joseph's College",
  "email": "culture@sjc.ac.in",
  "leader": "Choreographer",
  "event": "CULTURAL_DANCE",
  "category": "Dance",
  "participants": [
    { "name": "Dancer 1", "phone": "+91 9988776655" },
    { "name": "Dancer 2", "phone": "+91 9988776654" },
    { "name": "Dancer 3", "phone": "+91 9988776653" },
    { "name": "Dancer 4", "phone": "+91 9988776652" }
  ]
}
```

## Files Modified/Created

### New Files:
- `register.html` - Public registration form with department selection
- `server/registrationValidator.js` - Validation utility functions

### Modified Files:
- `server/models/Registration.js` - Added department and breakdown fields
- `server/defaults.js` - Added EVENT_REQUIREMENTS configuration
- `server/routes/public.js` - Added event endpoint and enhanced registration with validation

## Features

✅ **Real-time Validation** - Instant feedback as users build their team
✅ **Department Tracking** - Automatic counting and enforcement of requirements
✅ **Dynamic Forms** - Participant fields adapt to event requirements
✅ **Clear Requirements** - Each event shows exact team composition needed
✅ **Error Messages** - Specific guidance when teams don't meet requirements
✅ **Registration Code** - Unique code provided for reference
✅ **Audit Trail** - All registrations logged with IP and timestamp

## Testing

### Test: Valid Team Registration
1. Go to `/register.html`
2. Select "FINVERSE" event
3. Add 5 members: 2 HR, 2 Marketing, 1 Finance
4. Submit - Should succeed with registration code

### Test: Invalid Department Split
1. Go to `/register.html`
2. Select "FINVERSE" event
3. Add 5 members all from HR department
4. Submit - Should show error about department requirements

### Test: Insufficient Members
1. Go to `/register.html`
2. Select "FINVERSE" event
3. Add only 3 members
4. Submit - Should show error about member count

### Test: Cultural Event (Dance)
1. Go to `/register.html`
2. Select "Dance" event
3. Add 4 members (no department selection needed)
4. Submit - Should succeed

## Future Enhancements

- [ ] Bulk registration via CSV upload
- [ ] Team roster export to PDF
- [ ] Registration status updates via email
- [ ] Team name and logo upload
- [ ] Payment integration for event fees
- [ ] QR code for team identification
- [ ] Team modification/roster changes
- [ ] Duplicate registration prevention

---

**Version**: 1.0.0
**Last Updated**: April 2026
