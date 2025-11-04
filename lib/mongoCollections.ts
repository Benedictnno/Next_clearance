import { Collection, Db } from 'mongodb'
import { getDb } from './mongo'

export type UserDoc = { _id?: any; id?: number; email: string; role: 'student'|'officer'|'admin'; password?: string; name?: string }
export type StudentDoc = { _id?: any; userId: string; firstName: string; lastName: string; matricNumber: string; department: string; faculty: string; level: string; createdAt?: Date; updatedAt?: Date }
export type ClearanceStepDoc = { _id?: any; stepNumber: number; name: string; requiresPayment?: boolean; paymentAmount?: number|null }
export type ClearanceProgressDoc = { _id?: any; studentId: any; stepId: any; status: 'pending'|'approved'|'rejected'; comment?: string|null; officerId?: any|null; updatedAt?: Date; receiptUrl?: string|null }

// Clearance submission for office-specific workflow
export type ClearanceSubmissionDoc = {
  _id?: any;
  studentId: string;           // Student's ID
  studentMatricNumber?: string; // For easy reference
  studentName?: string;         // Student's full name
  officeId: string;             // Office/Officer ID (e.g., "department_hod", "faculty_officer", "university_librarian")
  officeName: string;           // Human-readable office name
  officerId?: string;           // Assigned officer's ID
  documents: Array<{            // Submitted documents
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  status: 'pending' | 'approved' | 'rejected';  // Submission status
  comment?: string;             // Officer's comment/feedback
  submittedAt: Date;            // When student submitted
  reviewedAt?: Date;            // When officer reviewed
  reviewedBy?: string;          // Officer who reviewed
  createdAt: Date;
  updatedAt: Date;
}

export async function collections(db?: Db) {
	const d = db ?? await getDb()
	return {
		users: d.collection<UserDoc>('users'),
		students: d.collection<StudentDoc>('students'),
		steps: d.collection<ClearanceStepDoc>('clearance_steps'),
		progress: d.collection<ClearanceProgressDoc>('clearance_progress'),
		clearances: d.collection<ClearanceSubmissionDoc>('clearances'),  // Office-specific clearance submissions
		notifications: d.collection('notifications'),
		officers: d.collection('officers'),
		certificates: d.collection('certificates'),
		nyscForms: d.collection('nysc_forms'),
		notificationPreferences: d.collection('notification_preferences'),
	}
}


