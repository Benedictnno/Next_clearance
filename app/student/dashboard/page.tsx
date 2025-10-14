import prisma from '@/lib/db'
import Link from 'next/link'

async function getData(studentId: number) {
	const rows = await prisma.student_clearance_progress.findMany({
		where: { student_id: studentId },
		include: { clearance_steps: true },
		orderBy: { clearance_steps: { step_no: 'asc' } },
	})
	let unlock: number | null = null
	for (const r of rows) {
		if (r.status !== 'approved') { unlock = r.clearance_steps.step_no as unknown as number; break }
	}
	return { rows, unlock }
}

export default async function Dashboard() {
	// In a full app, derive studentId from session in a server action or header
	// For now, show placeholder and links
	return (
		<div className="container" style={{ maxWidth: 900, margin: '2rem auto' }}>
			<h2>Student Dashboard</h2>
			<p>Use the legacy PHP DB via Prisma; UI to be enhanced.</p>
			<div style={{ marginTop: 16 }}>
				<Link className="btn" href="/student/slip">Open Clearance Slip</Link>
			</div>
		</div>
	)
}


