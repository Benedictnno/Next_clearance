# Clearance Workflow System Documentation

## Overview

The Clearance Workflow System manages the student clearance process across seven designated offices. Each student must submit required documents to each office, and officers review and approve/reject submissions. Once all offices approve, students gain access to their Final Clearance Form and NYSC Form.

## Architecture

### Database Schema

**MongoDB Collection: `clearances`**

Each document represents a student's submission to a specific office:

```typescript
{
  _id: ObjectId,
  studentId: string,              // Student's ID
  studentMatricNumber: string,    // Student matric number
  studentName: string,            // Student full name
  officeId: string,               // Office identifier (e.g., 'faculty_library')
  officeName: string,             // Human-readable office name
  officerId: string,              // Assigned officer's ID
  documents: [{                   // Uploaded documents
    fileName: string,
    fileUrl: string,
    fileType: string,
    uploadedAt: Date
  }],
  status: 'pending' | 'approved' | 'rejected',
  comment: string,                // Officer's feedback
  submittedAt: Date,              // Submission timestamp
  reviewedAt: Date,               // Review timestamp
  reviewedBy: string,             // Reviewing officer's ID
  createdAt: Date,
  updatedAt: Date
}
```

### Seven Clearance Offices

The system processes clearances through these seven offices in sequence:

1. **Faculty Library** (`faculty_library`)
2. **Sports Directorate** (`sports_directorate`)
3. **Hostel Management** (`hostel_management`)
4. **Student Affairs** (`student_affairs`)
5. **Department (HOD)** (`department_hod`)
6. **Faculty (Dean)** (`faculty_dean`)
7. **Bursary** (`bursary`)

## API Endpoints

### Student Endpoints

#### 1. Get Clearance Status
```
GET /api/student/clearance-workflow/status
```

Returns the student's clearance status across all offices.

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "string",
    "studentName": "string",
    "studentMatricNumber": "string",
    "offices": [
      {
        "officeId": "faculty_library",
        "officeName": "Faculty Library",
        "stepNumber": 1,
        "status": "pending" | "approved" | "rejected" | "not_started",
        "submittedAt": "2024-11-04T10:00:00Z",
        "reviewedAt": "2024-11-04T11:00:00Z",
        "comment": "string"
      }
    ],
    "overallProgress": 42,
    "isCompleted": false,
    "canAccessFinalForms": false
  }
}
```

#### 2. Submit Documents to Office
```
POST /api/student/clearance-workflow/submit
```

Submit clearance documents to a specific office.

**Request Body:**
```json
{
  "officeId": "faculty_library",
  "documents": [
    {
      "fileName": "library_clearance.pdf",
      "fileUrl": "https://cloudinary.com/...",
      "fileType": "application/pdf"
    }
  ],
  "officerId": "optional-officer-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Documents submitted successfully",
  "submissionId": "submission-id"
}
```

#### 3. Get List of Offices
```
GET /api/student/clearance-workflow/offices
```

Returns list of all clearance offices.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "faculty_library",
      "name": "Faculty Library",
      "step": 1
    }
  ]
}
```

#### 4. Check Final Forms Access
```
GET /api/student/clearance-workflow/can-access-forms
```

Check if student can access final clearance forms.

**Response:**
```json
{
  "success": true,
  "canAccessFinalForms": false
}
```

### Officer Endpoints

#### 1. Get Pending Submissions
```
GET /api/officer/clearance-workflow/pending?officeId=faculty_library
```

Get pending submissions for a specific office.

**Query Parameters:**
- `officeId` (required): Office identifier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "submission-id",
      "studentId": "student-id",
      "studentMatricNumber": "CSC/2020/001",
      "studentName": "John Doe",
      "officeId": "faculty_library",
      "officeName": "Faculty Library",
      "documents": [
        {
          "fileName": "library_clearance.pdf",
          "fileUrl": "https://...",
          "fileType": "application/pdf",
          "uploadedAt": "2024-11-04T10:00:00Z"
        }
      ],
      "status": "pending",
      "submittedAt": "2024-11-04T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### 2. Get All Submissions
```
GET /api/officer/clearance-workflow/all?officeId=faculty_library
```

Get all submissions (including reviewed) for a specific office.

**Query Parameters:**
- `officeId` (required): Office identifier

**Response:** Same format as pending submissions.

#### 3. Approve Submission
```
POST /api/officer/clearance-workflow/approve
```

Approve a student's clearance submission.

**Request Body:**
```json
{
  "submissionId": "submission-id",
  "comment": "All documents verified and approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission approved successfully"
}
```

#### 4. Reject Submission
```
POST /api/officer/clearance-workflow/reject
```

Reject a student's clearance submission.

**Request Body:**
```json
{
  "submissionId": "submission-id",
  "reason": "Missing library card payment receipt"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission rejected"
}
```

#### 5. Get Submission Details
```
GET /api/officer/clearance-workflow/submission/[submissionId]
```

Get detailed information about a specific submission.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission-id",
    "studentId": "student-id",
    "studentMatricNumber": "CSC/2020/001",
    "studentName": "John Doe",
    "officeId": "faculty_library",
    "officeName": "Faculty Library",
    "documents": [...],
    "status": "pending",
    "submittedAt": "2024-11-04T10:00:00Z"
  }
}
```

#### 6. Get Office Statistics
```
GET /api/officer/clearance-workflow/statistics?officeId=faculty_library
```

Get statistics for a specific office.

**Query Parameters:**
- `officeId` (required): Office identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 25,
    "approved": 70,
    "rejected": 5
  }
}
```

## Workflow Logic

### Student Flow

1. **View Status**: Student checks their clearance status across all offices
2. **Select Office**: Student selects an office to submit documents to
3. **Upload Documents**: Student uploads required documents for that office
4. **Submit**: Documents are stored in `clearances` collection with status `pending`
5. **Wait for Review**: Officer reviews the submission
6. **Receive Notification**: Student receives notification of approval/rejection
7. **Resubmit if Rejected**: If rejected, student can review feedback and resubmit
8. **Repeat**: Process continues for all seven offices
9. **Access Final Forms**: Once all offices approve, student can download Final Clearance Form and NYSC Form

### Officer Flow

1. **View Dashboard**: Officer sees pending submissions for their office
2. **Review Submission**: Officer reviews student documents
3. **Make Decision**: Officer approves or rejects with comments
4. **Update Status**: Submission status updates in database
5. **Notify Student**: Student receives notification of the decision
6. **Track Statistics**: Officer can view statistics for their office

### Key Functional Behaviors

1. **Office Isolation**: Each office only views and manages submissions intended for them
2. **Real-time Updates**: Approval/rejection immediately updates both officer and student dashboards
3. **Completion Check**: System checks all statuses before enabling "Print Clearance Slip" button
4. **Resubmission Support**: Students can resubmit documents if rejected
5. **Notification System**: Automated notifications for submissions, approvals, and rejections
6. **Progress Tracking**: Real-time progress percentage calculation

## Service Layer

The `clearanceWorkflow` service (`lib/clearanceWorkflow.ts`) provides the following methods:

- `submitToOffice()` - Submit documents to an office
- `getStudentStatus()` - Get student's overall clearance status
- `getOfficePendingSubmissions()` - Get pending submissions for an office
- `getOfficeAllSubmissions()` - Get all submissions for an office
- `approveSubmission()` - Approve a submission
- `rejectSubmission()` - Reject a submission
- `getSubmissionById()` - Get a specific submission
- `canAccessFinalForms()` - Check if student can access final forms
- `getOfficeStatistics()` - Get statistics for an office

## Integration Points

### Authentication
All endpoints require authentication using the existing JWT system. Users must have appropriate roles:
- Students: `STUDENT` role
- Officers: `OFFICER` role

### File Upload
Document uploads should use the existing upload system (`/api/upload`). Upload files first, then include the returned URLs in the clearance submission.

### Notifications
The system integrates with the existing notification service to send real-time updates to students and officers.

### Final Forms Access
When all offices approve, the system enables access to:
- Final Clearance Form (`/api/student/clearance-certificate`)
- NYSC Form (`/api/nysc/generate`)

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

### Test Flow for Students

1. Login as student
2. GET `/api/student/clearance-workflow/offices` - Get list of offices
3. GET `/api/student/clearance-workflow/status` - Check current status
4. POST `/api/upload` - Upload document
5. POST `/api/student/clearance-workflow/submit` - Submit to an office
6. GET `/api/student/clearance-workflow/status` - Verify submission recorded
7. GET `/api/student/clearance-workflow/can-access-forms` - Check forms access

### Test Flow for Officers

1. Login as officer
2. GET `/api/officer/clearance-workflow/pending?officeId=faculty_library` - View pending
3. GET `/api/officer/clearance-workflow/submission/[id]` - View details
4. POST `/api/officer/clearance-workflow/approve` - Approve submission
5. GET `/api/officer/clearance-workflow/statistics?officeId=faculty_library` - View stats

## Security Considerations

1. **Role-Based Access**: Endpoints enforce proper role checks
2. **Office Assignment**: Officers can only view/act on their assigned office submissions
3. **Document Security**: File URLs should use secure storage (Cloudinary with signed URLs)
4. **Input Validation**: All inputs validated using Zod schemas
5. **CORS Protection**: Security headers applied to all responses

## Future Enhancements

Potential improvements:
1. Bulk approval/rejection for officers
2. Document type validation per office
3. Deadline tracking and reminders
4. Analytics dashboard for administrators
5. Email notifications in addition to in-app notifications
6. Mobile app integration
7. Document preview in officer dashboard
8. Advanced search and filtering for officers
