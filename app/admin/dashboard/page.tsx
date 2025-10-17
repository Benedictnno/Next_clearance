import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

export default async function AdminDashboard() {
	const metrics = { students: 42, completed: 8, pending: 34 }
	return (
		<DashboardShell title="Admin Dashboard">
			<div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="card p-4"><div className="text-gray-500 text-sm">Students</div><div className="text-3xl font-semibold" style={{color:'#150E56'}}>{metrics.students}</div></div>
				<div className="card p-4"><div className="text-gray-500 text-sm">Completed</div><div className="text-3xl font-semibold" style={{color:'#1597BB'}}>{metrics.completed}</div></div>
				<div className="card p-4"><div className="text-gray-500 text-sm">Pending</div><div className="text-3xl font-semibold" style={{color:'#7B113A'}}>{metrics.pending}</div></div>
			</div>
			<div className="mt-6">
				<Link className="btn-primary" href="/admin/students">View Students</Link>
			</div>
		</DashboardShell>
	)
}


