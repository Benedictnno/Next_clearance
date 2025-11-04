# EKSU Digital Clearance Management System - API Documentation

## Overview

This document provides comprehensive API documentation for the EKSU Digital Clearance Management System. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The system uses JWT-based authentication with role-based access control. Include the session cookie in requests for authenticated endpoints.

### Roles

- **Student**: Can upload documents, view progress, download certificates
- **Officer**: Can review and approve/reject student submissions
- **Admin**: Full system access, can manage users, steps, and officers

## Rate Limiting

- **Authentication endpoints**: 5-10 requests per minute
- **File uploads**: 5 requests per minute
- **General API**: 100 requests per minute

## Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## API Endpoints

### Authentication

#### Student Registration
```http
POST /api/auth/student/signup
```

**Request Body:**
```json
{
  "matric_no": "CS/20/1234",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@student.eksu.edu.ng",
  "department": "Computer Science",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Registration successful. Your profile has been synced with university records."
}
```

#### Student Login
```http
POST /api/auth/student/signin
```

**Request Body:**
```json
{
  "matric_no": "CS/20/1234",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "ok": true
}
```

#### Officer Login
```http
POST /api/auth/officer/signin
```

**Request Body:**
```json
{
  "email": "officer@eksu.edu.ng",
  "password": "OfficerPass123"
}
```

#### Admin Login
```http
POST /api/auth/admin/signin
```

**Request Body:**
```json
{
  "email": "admin@eksu.edu.ng",
  "password": "AdminPass123"
}
```

### Student Endpoints

#### Get Clearance Progress
```http
GET /api/student/clearance
```

**Response:**
```json
{
  "student": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "1",
    "matricNumber": "CS/20/1234",
    "firstName": "John",
    "lastName": "Doe",
    "department": "Computer Science",
    "faculty": "Faculty of Science",
    "level": "400"
  },
  "clearance": {
    "steps": [
      {
        "step": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "stepNumber": 1,
          "name": "Library Clearance",
          "requiresPayment": false,
          "paymentAmount": null
        },
        "progress": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "status": "approved",
          "comment": null,
          "receiptUrl": null,
          "updatedAt": "2024-01-15T10:30:00Z",
          "officerId": "64f8a1b2c3d4e5f6a7b8c9d3"
        }
      }
    ],
    "progressPercentage": 25,
    "isCompleted": false,
    "currentStepNumber": 2
  }
}
```

#### Upload Document
```http
POST /api/student/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `step_id`: ObjectId of the clearance step
- `file`: File to upload (PDF, JPG, PNG, DOC, DOCX, WEBP)

**Response:**
```json
{
  "ok": true,
  "message": "Document uploaded successfully",
  "fileUrl": "/uploads/secure_filename.pdf"
}
```

#### Download Clearance Certificate
```http
GET /api/student/clearance-certificate
```

**Response:** PDF file download

#### Download NYSC Form
```http
GET /api/student/nysc-form/download
```

**Response:** PDF file download

#### Check NYSC Form Availability
```http
POST /api/student/nysc-form/download
```

**Response:**
```json
{
  "available": true,
  "formNumber": "EKSU-NYSC-2024-123456",
  "generatedDate": "2024-01-15T10:30:00Z",
  "message": "NYSC form is ready for download."
}
```

### Officer Endpoints

#### Get Officer Dashboard Data
```http
GET /api/officer/dashboard
```

**Response:**
```json
{
  "officer": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@eksu.edu.ng",
    "position": "Head of Department",
    "department": "Computer Science",
    "assignedStep": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "stepNumber": 1,
      "name": "Library Clearance"
    }
  },
  "submissions": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "student": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "matricNumber": "CS/20/1234",
        "firstName": "John",
        "lastName": "Doe",
        "department": "Computer Science"
      },
      "status": "pending",
      "submittedAt": "2024-01-15T09:00:00Z",
      "receiptUrl": "/uploads/document.pdf"
    }
  ],
  "statistics": {
    "pendingCount": 5,
    "approvedCount": 12,
    "rejectedCount": 2
  }
}
```

#### Approve/Reject Submission
```http
POST /api/officer/act
```

**Request Body:**
```json
{
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "stepId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "action": "approve",
  "comment": "All requirements met"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Clearance for John Doe for step \"Library Clearance\" has been approved.",
  "nextStep": 2,
  "isCompleted": false,
  "notifications": []
}
```

### Admin Endpoints

#### Get Admin Dashboard Data
```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "statistics": {
    "totalStudents": 150,
    "completedClearances": 45,
    "pendingClearances": 105,
    "completionRate": 30
  },
  "stepBreakdown": [
    {
      "stepNumber": 1,
      "stepName": "Library Clearance",
      "pendingCount": 25,
      "approvedCount": 100,
      "rejectedCount": 5
    }
  ],
  "recentStudents": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "matricNumber": "CS/20/1234",
      "department": "Computer Science",
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ]
}
```

#### Get All Students
```http
GET /api/admin/students
```

**Response:**
```json
{
  "students": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "matric": "CS/20/1234",
      "department": "Computer Science",
      "faculty": "Faculty of Science",
      "level": "400",
      "progress": 75,
      "isCompleted": false,
      "completedSteps": 3,
      "totalSteps": 4,
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ]
}
```

#### Create Officer
```http
POST /api/admin/officers
```

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane.smith@eksu.edu.ng",
  "position": "Head of Department",
  "department": "Computer Science",
  "assignedStepId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "password": "OfficerPass123"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Officer created successfully",
  "officer": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@eksu.edu.ng",
    "position": "Head of Department",
    "department": "Computer Science",
    "assignedStepId": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
}
```

#### Get All Officers
```http
GET /api/admin/officers
```

**Response:**
```json
{
  "officers": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@eksu.edu.ng",
      "position": "Head of Department",
      "department": "Computer Science",
      "assignedStepId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "assignedStepNumber": 1
    }
  ]
}
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "userId": "1",
      "title": "Step Approved: Library Clearance",
      "message": "Your submission for \"Library Clearance\" has been approved. You can now proceed to the next step.",
      "type": "success",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

#### Mark Notification as Read
```http
POST /api/notifications/mark-read
```

**Request Body:**
```json
{
  "notificationId": "64f8a1b2c3d4e5f6a7b8c9d6"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read."
}
```

#### Mark All Notifications as Read
```http
POST /api/notifications/mark-read
```

**Request Body:**
```json
{
  "markAll": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marked 3 notifications as read."
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **413**: Payload Too Large (file size exceeded)
- **415**: Unsupported Media Type (invalid file type)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

## File Upload Guidelines

### Supported File Types
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG, WEBP

### File Size Limits
- **Maximum size**: 10MB per file
- **Rate limit**: 5 uploads per minute per user

### Security Measures
- File content scanning for malicious code
- Secure filename generation
- Type validation
- Size validation

## External API Integration

### Student Data API
- **Endpoint**: `https://coreeksu.vercel.app/api/users/{id}`
- **Method**: GET
- **Authentication**: Not required
- **Rate Limit**: 100 requests per minute

**Response Format:**
```json
{
  "id": "68f650ad139569c128ca2f6d",
  "matricNumber": "CS/20/1234",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@student.eksu.edu.ng",
  "department": "Computer Science",
  "faculty": "Faculty of Science",
  "level": "400",
  "phoneNumber": "+2348012345678",
  "address": "123 University Road, Ado-Ekiti",
  "dateOfBirth": "2000-01-15",
  "gender": "Male"
}
```

## Webhooks (Future Implementation)

The system is designed to support webhooks for external integrations:

- **Student registration**: `POST /webhooks/student-registered`
- **Clearance completion**: `POST /webhooks/clearance-completed`
- **Document approval**: `POST /webhooks/document-approved`

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install axios
```

### Python
```bash
pip install requests
```

### cURL Examples

#### Student Login
```bash
curl -X POST https://your-domain.com/api/auth/student/signin \
  -H "Content-Type: application/json" \
  -d '{"matric_no": "CS/20/1234", "password": "SecurePass123"}'
```

#### Upload Document
```bash
curl -X POST https://your-domain.com/api/student/upload \
  -F "step_id=64f8a1b2c3d4e5f6a7b8c9d1" \
  -F "file=@document.pdf"
```

## Support

For API support and questions:
- **Email**: support@eksu-clearance.edu.ng
- **Documentation**: https://docs.eksu-clearance.edu.ng
- **Status Page**: https://status.eksu-clearance.edu.ng