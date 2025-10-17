import { getDb } from '../lib/mongo'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

async function main() {
	// Load env from .env.local when running via tsx/npm script
	dotenv.config({ path: '.env.local' })
	const db = await getDb()
	const users = db.collection('users')
	const students = db.collection('students')
	const steps = db.collection('clearance_steps')
	const progress = db.collection('clearance_progress')
	const officers = db.collection('officers')

	await Promise.all([
		users.deleteMany({}),
		students.deleteMany({}),
		steps.deleteMany({}),
		progress.deleteMany({}),
		officers.deleteMany({}),
	])

	const userRes = await users.insertMany([
		{ id: 1, email: 'dev.student@example.com', role: 'student', name: 'Dev Student' },
		{ id: 2, email: 'officer@example.com', role: 'officer', name: 'Officer One' },
		{ id: 3, email: 'admin@example.com', role: 'admin', name: 'Admin One' },
	])

	const [studentUser] = Object.values(userRes.insertedIds)

	const studentRes = await students.insertOne({
		userId: 1,
		firstName: 'Dev',
		lastName: 'Student',
		matricNumber: 'EKSU/21/0001',
		department: 'Computer Science',
		faculty: 'Science',
		level: '400L',
	})

	const stepsDocs = await steps.insertMany([
		{ stepNumber: 1, name: 'Departmental Clearance', requiresPayment: false },
		{ stepNumber: 2, name: 'Library', requiresPayment: false },
		{ stepNumber: 3, name: 'ICT', requiresPayment: false },
		{ stepNumber: 4, name: 'Bursary', requiresPayment: false },
		{ stepNumber: 5, name: 'Hostel', requiresPayment: false },
		{ stepNumber: 6, name: 'Sports', requiresPayment: false },
		{ stepNumber: 7, name: 'Security', requiresPayment: false },
		{ stepNumber: 8, name: 'Student Affairs', requiresPayment: false },
		{ stepNumber: 9, name: 'Medical', requiresPayment: false },
		{ stepNumber: 10, name: 'Exams & Records', requiresPayment: false },
		{ stepNumber: 11, name: 'Admission Office', requiresPayment: false },
		{ stepNumber: 12, name: 'Faculty Office', requiresPayment: false },
		{ stepNumber: 13, name: 'Department Head', requiresPayment: false },
		{ stepNumber: 14, name: 'Dean', requiresPayment: false },
		{ stepNumber: 15, name: 'ICT Final', requiresPayment: false },
		{ stepNumber: 16, name: 'Registrar', requiresPayment: false },
		{ stepNumber: 17, name: 'VC Office', requiresPayment: false },
	])

	const stepIds = Object.values(stepsDocs.insertedIds)

	await progress.insertMany(stepIds.map((sid) => ({
		studentId: studentRes.insertedId,
		stepId: sid,
		status: 'pending',
		updatedAt: new Date(),
	})))

	// Seed officers from CSV if exists
	try {
		const provided = process.env.OFFICERS_CSV
		const defaultPath = path.join(process.cwd(), 'next_clearence_app', 'officers.csv')
		const altPath = 'C:/Users/ADMIN/Downloads/officers.csv'
		const csvPath = provided && fs.existsSync(provided)
			? provided
			: (fs.existsSync(defaultPath) ? defaultPath : (fs.existsSync(altPath) ? altPath : defaultPath))
		if (fs.existsSync(csvPath)) {
			const raw = fs.readFileSync(csvPath, 'utf8')
			const rows = raw.split(/\r?\n/).filter(Boolean)
			const records = rows.slice(1).map((line) => {
				const [name, email, assigned_step] = line.split(',').map(s => s.trim())
				return { name, email, assigned_step: Number(assigned_step), default_password: 'officer123' }
			}).filter(r => r.name && r.email && Number.isFinite(r.assigned_step))
			if (records.length) {
				await officers.insertMany(records)
			}
		}
	} catch (e) {
		console.warn('Officer CSV seed skipped:', e)
	}

	console.log('Mongo seed completed')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
