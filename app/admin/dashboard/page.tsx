import prisma from '@/lib/db'
import Link from 'next/link'

export default async function AdminDashboard() {
	const total = await prisma.students.count()
	const done = await prisma.$queryRawUnsafe<number>(
		`SELECT COUNT(*) c FROM (SELECT student_id, SUM(status='approved') a, COUNT(*) c FROM student_clearance_progress GROUP BY student_id HAVING a=c) t`
	) as any
	return (
		<div style={{ maxWidth: 900, margin: '2rem auto' }}>
			<h2>Admin Dashboard</h2>
			<p>Students: {total} • Completed: {Number((done as any)?.[0]?.c ?? 0)}</p>
			<Link className="btn" href="/admin/students">View Students</Link>
		</div>
	)
}


