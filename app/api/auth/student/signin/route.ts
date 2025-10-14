import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'

const SigninSchema = z.object({
	matric_no: z.string().min(1),
	password: z.string().min(1),
})

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const input = SigninSchema.parse(body)

		// Find user by email that might be derived from matric number
		const user = await prisma.user.findFirst({
			where: {
				OR: [
					{ student: { matricNumber: input.matric_no } },
					{ email: `${input.matric_no}@student.eksu.edu.ng` }
				]
			},
			include: { student: true }
		})

		if (!user || !user.password || !user.student) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
		}

		const ok = await bcrypt.compare(input.password, user.password)
		if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

		createSession({ userId: user.id, role: 'student' })
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Signin failed' }, { status: 400 })
	}
}


