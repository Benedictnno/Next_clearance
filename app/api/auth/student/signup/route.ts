import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'

const SignupSchema = z.object({
	matric_no: z.string().min(1),
	first_name: z.string().min(1).optional().default(''),
	last_name: z.string().min(1),
	email: z.string().email().optional().or(z.literal('')).default(''),
	department: z.string().optional().or(z.literal('')).default(''),
	password: z.string().min(6),
})

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const input = SignupSchema.parse(body)

		const exists = await prisma.student.findFirst({ where: { matricNumber: input.matric_no } })
		if (exists) {
			return NextResponse.json({ error: 'Matric number already registered' }, { status: 400 })
		}

		const hashed = await bcrypt.hash(input.password, 10)

		// Create user first
		const user = await prisma.user.create({
			data: {
				email: input.email || `${input.matric_no}@student.eksu.edu.ng`,
				password: hashed,
				role: 'student',
			}
		});

		// Then create student profile
		const student = await prisma.student.create({
			data: {
				userId: user.id,
				matricNumber: input.matric_no,
				firstName: input.first_name,
				lastName: input.last_name,
				department: input.department || 'Not specified',
				faculty: 'Not specified', // Required field in schema
				level: 'Not specified', // Required field in schema
			},
		})

		const steps = await prisma.clearanceStep.findMany({ orderBy: { stepNumber: 'asc' } })
		if (steps.length) {
			await prisma.$transaction(
				steps.map((s) =>
					prisma.clearanceProgress.create({
						data: {
							studentId: student.id,
							stepId: s.id,
							status: 'pending',
							comment: '',
						},
					})
				)
			)
		}

		createSession({ userId: student.id, role: 'student' })
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Signup failed' }, { status: 400 })
	}
}


