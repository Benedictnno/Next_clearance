import DashboardShell from '@/components/DashboardShell'

export default async function AdminStudents() {
	const students = [
		{ id: 1, firstName: 'Dev', lastName: 'Student', matric: 'EKSU/21/0001', department: 'Computer Science', createdAt: '2025-01-10' },
		{ id: 2, firstName: 'Ada', lastName: 'Lovelace', matric: 'EKSU/21/0002', department: 'Mathematics', createdAt: '2025-02-02' },
	]
	return (
		<DashboardShell title="Students">
			<div className="mt-4 overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left border-b" style={{borderColor:'#8FD6E1'}}>
							<th className="py-2 pr-4">Name</th>
							<th className="py-2 pr-4">Matric</th>
							<th className="py-2 pr-4">Department</th>
							<th className="py-2">Joined</th>
						</tr>
					</thead>
					<tbody>
						{students.map((s) => (
							<tr key={s.id} className="border-b" style={{borderColor:'#E5E7EB'}}>
								<td className="py-2 pr-4">{s.firstName} {s.lastName}</td>
								<td className="py-2 pr-4">{s.matric}</td>
								<td className="py-2 pr-4">{s.department}</td>
								<td className="py-2">{s.createdAt}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</DashboardShell>
	)
}


