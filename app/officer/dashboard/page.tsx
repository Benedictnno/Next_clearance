import DashboardShell from '@/components/DashboardShell'
import { collections } from '@/lib/mongoCollections'
import QueueTable, { type QueueItem } from '@/components/officer/QueueTable'

type Item = { id: string; student: string; submittedAt: string; studentId: string; stepId: string; stepName: string }

export default async function OfficerDashboard() {
	const devStep = Number(process.env.DEV_STEP || '1')
	const { steps, progress, students } = await collections()
	const stepDoc = await steps.findOne({ stepNumber: devStep })
    let pendingItems: QueueItem[] = []
    let approvedItems: QueueItem[] = []
	if (stepDoc) {
        const pendings = await progress.find({ stepId: stepDoc._id, status: 'pending' }).sort({ updatedAt: -1 }).toArray()
        const approved = await progress.find({ stepId: stepDoc._id, status: 'approved' }).sort({ updatedAt: -1 }).limit(20).toArray()
        const studentIds = [...new Set([...pendings, ...approved].map((p: any) => p.studentId))]
		const mapStudents = new Map<string, any>()
		if (studentIds.length) {
			const studs = await students.find({ _id: { $in: studentIds } }).toArray()
			for (const s of studs) mapStudents.set(String(s._id), s)
		}
        pendingItems = pendings.map((p: any) => {
			const s = mapStudents.get(String(p.studentId))
			return {
				id: String(p._id),
				student: s ? `${s.firstName} ${s.lastName}` : 'Unknown',
                matric: s?.matricNumber,
				submittedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—',
				studentId: String(p.studentId),
				stepId: String(stepDoc._id),
                stepName: stepDoc.name,
                receiptUrl: p.receiptUrl || null,
			}
		})
        approvedItems = approved.map((p: any) => {
            const s = mapStudents.get(String(p.studentId))
            return {
                id: String(p._id),
                student: s ? `${s.firstName} ${s.lastName}` : 'Unknown',
                matric: s?.matricNumber,
                submittedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—',
                studentId: String(p.studentId),
                stepId: String(stepDoc._id),
                stepName: stepDoc.name,
                receiptUrl: p.receiptUrl || null,
            }
        })
	}
	return (
		<DashboardShell title="Officer Dashboard">
            <p className="text-sm text-gray-500">Step {devStep}: {stepDoc?.name ?? 'N/A'} • Pending submissions: {pendingItems.length}</p>
            <div className="mt-4 card p-4">
                <h3 className="font-semibold mb-2">Pending Submissions</h3>
                <div className="overflow-x-auto">
                    <QueueTable items={pendingItems} />
                </div>
            </div>

            <div className="mt-6 card p-4">
                <h3 className="font-semibold mb-2">Approved Submissions</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left border-b" style={{borderColor:'#8FD6E1'}}>
                                <th className="py-2 pr-4">Student</th>
                                <th className="py-2 pr-4">Matric</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Updated</th>
                                <th className="py-2 pr-4">Receipt</th>
                                <th className="py-2 pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedItems.map((it) => (
                                <tr key={it.id} className="border-b" style={{borderColor:'#E5E7EB'}}>
                                    <td className="py-2 pr-4">{it.student}</td>
                                    <td className="py-2 pr-4">{it.matric ?? '—'}</td>
                                    <td className="py-2 pr-4">approved</td>
                                    <td className="py-2 pr-4">{it.submittedAt}</td>
                                    <td className="py-2 pr-4">{it.receiptUrl ? <a className="text-blue-600 underline" href={it.receiptUrl} target="_blank">View</a> : '-'}</td>
                                    <td className="py-2 pr-4">-</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
		</DashboardShell>
	)
}


