'use client'

import { useRef } from 'react'

export type QueueItem = {
    id: string
    student: string
    matric?: string
    submittedAt: string
    studentId: string
    stepId: string
    stepName: string
    receiptUrl?: string | null
}

export default function QueueTable({ items }: { items: QueueItem[] }) {
    const commentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

    async function act(studentId: string, stepId: string, action: 'approve'|'reject', key: string) {
        const comment = commentRefs.current[key]?.value || ''
        await fetch('/api/officer/act', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: Number(studentId), stepId: Number(stepId), action, comment }),
        })
        location.reload()
    }

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr className="text-left border-b" style={{borderColor:'#8FD6E1'}}>
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Matric</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Updated</th>
                    <th className="py-2 pr-4">Receipt</th>
                    <th className="py-2">Action</th>
                </tr>
            </thead>
            <tbody>
                {items.map((it) => (
                    <tr key={it.id} className="border-b align-top" style={{borderColor:'#E5E7EB'}}>
                        <td className="py-3 pr-4">{it.student}</td>
                        <td className="py-3 pr-4">{it.matric ?? '—'}</td>
                        <td className="py-3 pr-4">pending</td>
                        <td className="py-3 pr-4">{it.submittedAt}</td>
                        <td className="py-3 pr-4">{it.receiptUrl ? <a className="text-blue-600 underline" href={it.receiptUrl} target="_blank">View</a> : 'No file'}</td>
                        <td className="py-2">
                            <div className="space-y-2">
                                <textarea
                                    ref={(el) => {
                                        commentRefs.current[it.id] = el || null;
                                    }}
                                    placeholder="Optional"
                                    className="w-full border rounded p-2 text-sm"
                                />
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded text-white" style={{background:'#16a34a'}} onClick={() => act(it.studentId, it.stepId, 'approve', it.id)}>Approve</button>
                                    <button className="px-3 py-1 rounded text-white" style={{background:'#ef4444'}} onClick={() => act(it.studentId, it.stepId, 'reject', it.id)}>Reject</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}



