# EKSU Digital Clearance Management System

## Overview

The EKSU Digital Clearance Management System is a comprehensive web application designed to streamline the student clearance process. It allows students to complete their clearance requirements digitally, officers to review and approve submissions, and administrators to manage the entire process.

## Features

- **Digital Clearance Process**: Complete the entire clearance process online
- **Role-Based Access**: Different interfaces for students, officers, and administrators
- **Document Management**: Upload and manage clearance documents
- **Real-time Status Tracking**: Monitor clearance progress in real-time
- **Certificate Generation**: Automatically generate clearance certificates and NYSC forms
- **QR Code Verification**: Verify certificates using QR codes

## Application Flow

### Student Flow

1. **Registration/Login**: Students register with their matriculation number or log in to their account
2. **Dashboard Access**: View clearance progress and pending requirements
3. **Document Submission**: Upload required documents for each clearance step
4. **Status Tracking**: Monitor approval status for each clearance step
5. **Certificate Download**: Download clearance certificate and NYSC form upon completion

### Officer Flow

1. **Login**: Officers log in with their credentials
2. **Review Submissions**: View pending student submissions for their department/unit
3. **Approval/Rejection**: Approve or reject submissions with comments
4. **Notification Management**: Receive notifications for new submissions

### Admin Flow

1. **System Management**: Configure clearance steps and requirements
2. **User Management**: Manage student and officer accounts
3. **Progress Monitoring**: View overall clearance statistics and progress
4. **Issue Resolution**: Address issues and override steps when necessary

## Setup Instructions

### Prerequisites

- Node.js 20+
- MongoDB 6.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Benedictnno/Next_clearance.git
   cd Next_clearance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Update `.env.local` with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/eksu_clearance
   MONGODB_DB=eksu_clearance
   SESSION_SECRET=your-super-secret-session-key-here
   EXTERNAL_API_BASE_URL=https://coreeksu.vercel.app
   EXTERNAL_API_KEY=your-external-api-key-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   npm run seed:mongo
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Usage Guide

### For Students

1. **Registration**: Sign up with your matriculation number and personal details
2. **Dashboard**: Access your dashboard to view clearance progress
3. **Document Submission**: 
   - Navigate to each clearance step
   - Upload required documents
   - Submit for review
4. **Status Tracking**: Monitor the status of each step (pending, approved, rejected)
5. **Certificate Download**: Once all steps are approved, download your clearance certificate and NYSC form

### For Officers

1. **Login**: Sign in with your officer credentials
2. **Pending Reviews**: View the list of pending submissions for your department/unit
3. **Review Process**:
   - Open each submission
   - Review attached documents
   - Approve or reject with comments
4. **Notifications**: Receive notifications for new submissions

### For Administrators

1. **System Configuration**: Set up clearance steps and requirements
2. **User Management**: Add/edit/remove student and officer accounts
3. **Progress Monitoring**: View statistics and reports on clearance progress
4. **Issue Resolution**: Address student issues and override steps when necessary

## Technologies Used

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB, Prisma ORM
- **Authentication**: JWT-based authentication
- **PDF Generation**: PDF-lib, React-PDF
- **QR Code**: QRCode library

## Support

For support or inquiries, please contact the system administrator or IT department.