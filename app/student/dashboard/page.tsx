import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

type StepStatus = 'pending' | 'approved' | 'rejected'

function StatusBadge({ status }: { status: StepStatus }) {
    const cls =
        status === 'approved'
            ? 'bg-green-100 text-green-700'
            : status === 'rejected'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
    return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{status.toUpperCase()}</span>
}

export default async function Dashboard() {
    const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// const res = await fetch(`${baseUrl}/api/student/clearance`, { cache: "no-store" });
const res = await fetch(`https://eksu-clearance.vercel.app/api/student/clearance`, { cache: "no-store" });

if (!res.ok) {
  console.error("❌ Failed to fetch clearance:", await res.text());
  throw new Error(`API returned ${res.status}`);
}

const json = await res.json();
console.log("DEBUG JSON:", json);
    const steps = json.clearance.steps as any[]
    const student = json.student
    const current = steps.find((s: any) => s.status !== 'approved')
    const currentStepNumber = current ? current.step.stepNumber : null
	return (
		<DashboardShell title="Student Dashboard">
			<div className="rounded-lg card p-4">
                <h3 className="text-lg font-medium" style={{color:'#1597BB'}}>Welcome, {student.name}</h3>
                <p className="text-sm text-gray-500">Matric: {student.matricNumber}</p>
			</div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-3">
                    {steps.map((s: any) => (
                        <div key={s.step.id} className="card p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Step {s.step.stepNumber}{s.step.requiresPayment ? ' · Requires receipt' : ''}</p>
                                    <h3 className="font-medium">{s.step.name}</h3>
                                </div>
                                <StatusBadge status={s.status as StepStatus} />
						</div>
                            {currentStepNumber === s.step.stepNumber && (
                                <form className="mt-4" method="post" action="https://eksu-clearance.vercel.app/api/student/upload" encType="multipart/form-data">
                                    <input type="hidden" name="step_id" value={s.step.id} />
                                    <label className="block text-xs text-gray-600 mb-1">{s.step.requiresPayment ? 'Upload Receipt (PDF/JPG/PNG)' : 'Upload Supporting Doc (optional)'}</label>
                                    <input type="file" name="file" className="w-full rounded border p-2 text-sm" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp" />
                                    <button className="mt-3 w-full rounded bg-[#7B113A] text-white py-2 text-sm">Submit for Review</button>
                                </form>
                            )}

                            {s.comment && (
                                <div className="mt-3 text-xs text-gray-600">Officer note: {s.comment}</div>
                            )}
                            {s.receiptUrl && (
                                <div className="mt-2 text-xs"><a className="text-blue-600 underline" href={s.receiptUrl} target="_blank">View submitted file</a></div>
                            )}
					</div>
				))}
                </div>

                <aside className="card p-4 h-fit">
                    <h3 className="font-semibold mb-2">Overall Status</h3>
                    <p className="text-sm text-gray-600 mb-4">{currentStepNumber ? <>Currently on <span className="font-medium">Step {currentStepNumber}</span>.</> : '🎉 All steps approved.'}</p>
                    <Link href="/student/slip" className="inline-block rounded bg-green-600 text-white px-3 py-2 text-sm">Open Clearance Slip</Link>
                </aside>
			</div>
		</DashboardShell>
	)
}


