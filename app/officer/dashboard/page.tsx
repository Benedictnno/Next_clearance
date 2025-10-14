import prisma from '@/lib/db'

export default async function OfficerDashboard() {
	// Placeholder view; data wiring to be enhanced
	const totalPending = await prisma.student_clearance_progress.count({ where: { status: 'pending' } })
	return (
		<div style={{ maxWidth: 900, margin: '2rem auto' }}>
			<h2>Officer Dashboard</h2>
			<p>Pending submissions: {totalPending}</p>
		</div>
	)
}


