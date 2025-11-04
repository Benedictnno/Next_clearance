'use client'

import { useRef } from 'react'
import DocumentViewer from './DocumentViewer'

export type QueueItem = {
    id: string
    student: string
    matric?: string
    submittedAt: string
    studentId: string
    stepId: string
    stepName: string
    receiptUrl?: string | null
    fileType?: string
}

export default function QueueTable({ items }: { items: QueueItem[] }) {
    const commentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

    async function act(studentId: string, stepId: string, action: 'approve'|'reject', key: string) {
        const comment = commentRefs.current[key]?.value || ''
        await fetch('/api/officer/act', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: String(studentId), stepId: String(stepId), action, comment }),
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
                    <th className="py-2 pr-4">Document</th>
                    <th className="py-2">Action</th>
                </tr>
            </thead>
            <tbody>
                {items.map((it) => (
                    <tr key={it.id} className="border-b align-top" style={{borderColor:'#E5E7EB'}}>
                        <td className="py-3 pr-4">
                            <div className="font-medium">{it.student}</div>
                            <div className="text-xs text-gray-500">{it.stepName}</div>
                        </td>
                        <td className="py-3 pr-4">{it.matric ?? '—'}</td>
                        <td className="py-3 pr-4">
                            <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                                Pending
                            </span>
                        </td>
                        <td className="py-3 pr-4">{it.submittedAt}</td>
                        <td className="py-3 pr-4">
                            {it.receiptUrl ? (
                                <DocumentViewer 
                                    documentUrl={it.receiptUrl} 
                                    fileName={`${it.student}_${it.stepName}`}
                                    fileType={it.fileType}
                                />
                            ) : (
                                <span className="text-gray-500 text-sm">No file</span>
                            )}
                        </td>
                        <td className="py-2">
                            <div className="space-y-2">
                                <textarea
                                    ref={(el) => {
                                        commentRefs.current[it.id] = el || null;
                                    }}
                                    placeholder="Add comment (optional)"
                                    className="w-full border rounded p-2 text-sm resize-none"
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        className="px-3 py-1 rounded text-white text-sm hover:opacity-90 transition-opacity" 
                                        style={{background:'#16a34a'}} 
                                        onClick={() => act(it.studentId, it.stepId, 'approve', it.id)}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button 
                                        className="px-3 py-1 rounded text-white text-sm hover:opacity-90 transition-opacity" 
                                        style={{background:'#ef4444'}} 
                                        onClick={() => act(it.studentId, it.stepId, 'reject', it.id)}
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}



