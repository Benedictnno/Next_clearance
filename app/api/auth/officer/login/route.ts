import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const input = LoginSchema.parse(body)

		const user = await prisma.user.findFirst({
			where: { 
				email: input.email,
				role: 'officer'
			},
			include: { officer: true }
		})
		
		if (!user || !user.password || !user.officer) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
		}

		const ok = await bcrypt.compare(input.password, user.password)
		if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

		await createSession({ userId: Number(user.id), role: 'officer' })
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 400 })
	}
}


