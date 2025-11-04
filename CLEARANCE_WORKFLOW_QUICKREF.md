# Clearance Workflow - Quick Reference Card

## 📋 Seven Offices
```
1. faculty_library      → Faculty Library
2. sports_directorate   → Sports Directorate
3. hostel_management    → Hostel Management
4. student_affairs      → Student Affairs
5. department_hod       → Department (HOD)
6. faculty_dean         → Faculty (Dean)
7. bursary              → Bursary
```

## 🎓 Student API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/student/clearance-workflow/status` | GET | Get clearance status |
| `/api/student/clearance-workflow/submit` | POST | Submit documents |
| `/api/student/clearance-workflow/offices` | GET | List all offices |
| `/api/student/clearance-workflow/can-access-forms` | GET | Check final forms access |

### Submit Example
```json
POST /api/student/clearance-workflow/submit
{
  "officeId": "faculty_library",
  "documents": [
    {
      "fileName": "library_clearance.pdf",
      "fileUrl": "https://cloudinary.com/...",
      "fileType": "application/pdf"
    }
  ]
}
```

## 👨‍💼 Officer API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/officer/clearance-workflow/pending?officeId=X` | GET | Get pending submissions |
| `/api/officer/clearance-workflow/all?officeId=X` | GET | Get all submissions |
| `/api/officer/clearance-workflow/approve` | POST | Approve submission |
| `/api/officer/clearance-workflow/reject` | POST | Reject submission |
| `/api/officer/clearance-workflow/submission/[id]` | GET | Get submission details |
| `/api/officer/clearance-workflow/statistics?officeId=X` | GET | Get office stats |

### Approve Example
```json
POST /api/officer/clearance-workflow/approve
{
  "submissionId": "abc123",
  "comment": "All documents verified"
}
```

### Reject Example
```json
POST /api/officer/clearance-workflow/reject
{
  "submissionId": "abc123",
  "reason": "Missing payment receipt"
}
```

## 📊 Status Values
- `not_started` - Student hasn't submitted yet
- `pending` - Submitted, awaiting officer review
- `approved` - Officer approved
- `rejected` - Officer rejected (can resubmit)

## 🔧 Service Functions

```typescript
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';

// Submit to office
await clearanceWorkflow.submitToOffice(
  studentId, studentName, matricNumber, 
  officeId, documents, officerId
);

// Get student status
const status = await clearanceWorkflow.getStudentStatus(studentId);

// Get pending for office
const pending = await clearanceWorkflow.getOfficePendingSubmissions(officeId);

// Approve
await clearanceWorkflow.approveSubmission(submissionId, officerId, comment);

// Reject
await clearanceWorkflow.rejectSubmission(submissionId, officerId, reason);

// Check final forms access
const canAccess = await clearanceWorkflow.canAccessFinalForms(studentId);
```

## 🗄️ MongoDB Collection

**Collection**: `clearances`

```javascript
{
  studentId: "string",
  studentMatricNumber: "string",
  studentName: "string",
  officeId: "faculty_library",
  officeName: "Faculty Library",
  officerId: "string",
  documents: [{ fileName, fileUrl, fileType, uploadedAt }],
  status: "pending" | "approved" | "rejected",
  comment: "string",
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: "string"
}
```

## ✅ Key Business Rules

1. **Student can submit** to any office at any time
2. **Officer only sees** submissions for their assigned office
3. **Resubmission allowed** if rejected (overwrites previous)
4. **All offices must approve** before final forms access
5. **Notifications sent** on submit, approve, and reject
6. **Progress calculated** as (approved / 7) * 100%

## 🎯 Testing Commands

### Test Student Flow
```bash
# 1. Get status
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/student/clearance-workflow/status

# 2. Submit documents
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"officeId":"faculty_library","documents":[...]}' \
  http://localhost:3000/api/student/clearance-workflow/submit

# 3. Check forms access
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/student/clearance-workflow/can-access-forms
```

### Test Officer Flow
```bash
# 1. Get pending
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/officer/clearance-workflow/pending?officeId=faculty_library"

# 2. Approve
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"xyz","comment":"Approved"}' \
  http://localhost:3000/api/officer/clearance-workflow/approve
```

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Office ID is required` | Missing officeId param | Add `?officeId=X` to URL |
| `Submission already reviewed` | Trying to review again | Check submission status first |
| `This office has already approved` | Resubmitting to approved office | No action needed |
| `Unauthorized` | No/invalid auth token | Verify JWT token |
| `Access denied` | Officer accessing wrong office | Check office assignment |

## 📁 File Locations

```
lib/
├── clearanceWorkflow.ts          # Main service
└── mongoCollections.ts           # DB schema (modified)

app/api/
├── student/clearance-workflow/
│   ├── status/route.ts          # Get status
│   ├── submit/route.ts          # Submit docs
│   ├── offices/route.ts         # List offices
│   └── can-access-forms/route.ts # Check access
└── officer/clearance-workflow/
    ├── pending/route.ts          # Get pending
    ├── all/route.ts              # Get all
    ├── approve/route.ts          # Approve
    ├── reject/route.ts           # Reject
    ├── submission/[id]/route.ts  # Get details
    └── statistics/route.ts       # Get stats

Docs/
├── CLEARANCE_WORKFLOW_DOCS.md    # Full documentation
├── CLEARANCE_WORKFLOW_SUMMARY.md # Implementation summary
└── CLEARANCE_WORKFLOW_QUICKREF.md # This file
```

## 🔗 Integration Points

- **Auth**: Uses `getCurrentUser()` from `lib/auth.ts`
- **Uploads**: Compatible with `/api/upload`
- **Notifications**: Uses `notificationService` from `lib/notificationService.ts`
- **Security**: Uses `applySecurityHeaders()` from `lib/security.ts`

## 💡 Pro Tips

1. Always upload files **before** submitting clearance
2. Check student status to show progress on frontend
3. Use office statistics for officer dashboard insights
4. Filter pending submissions by date for prioritization
5. Show clear error messages to students when rejected
6. Enable final forms button only when `canAccessFinalForms: true`

---
**Quick Start**: Read `CLEARANCE_WORKFLOW_SUMMARY.md`  
**Full Details**: Read `CLEARANCE_WORKFLOW_DOCS.md`
