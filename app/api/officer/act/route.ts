import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { collections } from '@/lib/mongoCollections'

const ActSchema = z.object({
	studentId: z.number().int().positive(),
	stepId: z.number().int().positive(),
	action: z.enum(['approve', 'reject']),
	comment: z.string().optional().default(''),
})

export async function POST(req: Request) {
	try {
		requireRole('officer')
		const body = await req.json()
		const input = ActSchema.parse(body)

		const { progress } = await collections()
		await progress.updateOne(
			{ studentId: input.studentId as any, stepId: input.stepId as any },
			{ $set: { status: input.action === 'approve' ? 'approved' : 'rejected', comment: input.comment || '', updatedAt: new Date() } }
		)

		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Action failed' }, { status: 400 })
	}
}


