import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'

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

		await prisma.clearanceProgress.update({
			where: { 
				studentId_stepId: { 
					studentId: input.studentId, 
					stepId: input.stepId 
				} 
			},
			data: {
				status: input.action === 'approve' ? 'approved' : 'rejected',
				comment: input.comment || '',
				updatedAt: new Date(),
			},
		})

		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Action failed' }, { status: 400 })
	}
}


