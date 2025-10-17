import { NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { isStepCurrent } from '@/lib/helpers'
import { saveUpload } from '@/lib/upload'
import { collections } from '@/lib/mongoCollections'

export const runtime = 'nodejs'

export async function POST(req: Request) {
	try {
		const session = await requireRole('student')
		const form = await (req as any).formData?.() ?? await req.formData()
		const file = form.get('file') as File | null

		const rawStepId = form.get('step_id');
        const stepId = isNaN(Number(rawStepId)) ? Number(rawStepId) : Number(rawStepId);

		const currentOk = await isStepCurrent(session.userId, Number(stepId))
		if (!currentOk) {
			return NextResponse.json({ error: 'You can only submit the current step.' }, { status: 400 })
		}

		let relPath: string | null = null
		if (file) {
			relPath = await saveUpload(session.userId, stepId, file)
		}

		const { students, progress: progressCol } = await collections()
		const student = await students.findOne({ userId: session.userId })
		if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
		await progressCol.updateOne(
			{ studentId: student._id, stepId },
			{ $set: { status: 'pending', updatedAt: new Date(), receiptUrl: relPath || null } },
			{ upsert: true }
		)

		return NextResponse.json({ ok: true, file: relPath })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 400 })
	}
}


