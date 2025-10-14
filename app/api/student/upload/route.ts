import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession, requireRole } from '@/lib/auth'
import { isStepCurrent } from '@/lib/helpers'
import { saveUpload } from '@/lib/upload'

export const runtime = 'nodejs'

export async function POST(req: Request) {
	try {
		const session = requireRole('student')
		const form = await (req as any).formData?.() ?? await req.formData()
		const stepId = Number(form.get('step_id'))
		const file = form.get('file') as File | null

		if (!Number.isFinite(stepId) || stepId <= 0) {
			return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
		}

		const currentOk = await isStepCurrent(session.userId, stepId)
		if (!currentOk) {
			return NextResponse.json({ error: 'You can only submit the current step.' }, { status: 400 })
		}

		let relPath: string | null = null
		if (file) {
			relPath = await saveUpload(session.userId, stepId, file)
		}

		await prisma.clearanceProgress.update({
			where: { 
				studentId_stepId: { 
					studentId: session.userId, 
					stepId: stepId 
				} 
			},
			data: { 
				status: 'pending', 
				updatedAt: new Date() 
			},
		})

		return NextResponse.json({ ok: true, file: relPath })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 400 })
	}
}


