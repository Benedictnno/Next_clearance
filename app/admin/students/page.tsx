import prisma from '@/lib/db'

export default async function AdminStudents() {
	const students = await prisma.students.findMany({ orderBy: { created_at: 'desc' as any } })
	return (
		<div style={{ maxWidth: 900, margin: '2rem auto' }}>
			<h2>Students</h2>
			<table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
				<thead>
					<tr>
						<th>Name</th>
						<th>Matric</th>
						<th>Department</th>
						<th>Joined</th>
					</tr>
				</thead>
				<tbody>
					{students.map((s) => (
						<tr key={s.id}>
							<td>{`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()}</td>
							<td>{s.matric_no}</td>
							<td>{s.department}</td>
							<td>{String(s.created_at)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}


