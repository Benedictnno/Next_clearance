import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { clearanceEngine } from '@/lib/clearanceEngine'

const ActSchema = z.object({
	studentId: z.string().min(1),
	stepId: z.string().min(1),
	action: z.enum(['approve', 'reject']),
	comment: z.string().optional().default(''),
})

export async function POST(req: Request) {
	try {
		const session = await requireRole('OFFICER')
		const body = await req.json()
		const input = ActSchema.parse(body)

		// Process the officer action through the clearance engine
		const result = await clearanceEngine.processOfficerAction(
			input.studentId,
			input.stepId,
			input.action,
			String(session.user?.id), // Fix: use user.id instead of userId
			input.comment
		)

		if (!result.success) {
			return NextResponse.json({ error: result.message }, { status: 400 })
		}

		return NextResponse.json({ 
			ok: true, 
			message: result.message,
			nextStep: result.nextStep,
			isCompleted: result.isCompleted,
			notifications: result.notifications
		})
	} catch (e: any) {
		console.error('Officer action error:', e);
		return NextResponse.json({ error: e?.message || 'Action failed' }, { status: 400 })
	}
}


