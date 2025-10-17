import { Collection, Db } from 'mongodb'
import { getDb } from './mongo'

export type UserDoc = { _id?: any; id?: number; email: string; role: 'student'|'officer'|'admin'; password?: string; name?: string }
export type StudentDoc = { _id?: any; userId: number; firstName: string; lastName: string; matricNumber: string; department: string; faculty: string; level: string }
export type ClearanceStepDoc = { _id?: any; stepNumber: number; name: string; requiresPayment?: boolean; paymentAmount?: number|null }
export type ClearanceProgressDoc = { _id?: any; studentId: any; stepId: any; status: 'pending'|'approved'|'rejected'; comment?: string|null; officerId?: any|null; updatedAt?: Date; receiptUrl?: string|null }

export async function collections(db?: Db) {
	const d = db ?? await getDb()
	return {
		users: d.collection<UserDoc>('users'),
		students: d.collection<StudentDoc>('students'),
		steps: d.collection<ClearanceStepDoc>('clearance_steps'),
		progress: d.collection<ClearanceProgressDoc>('clearance_progress'),
		notifications: d.collection('notifications'),
	}
}


