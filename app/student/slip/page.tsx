'use client'

import Image from "next/image";

export default function SlipPage() {
	function handlePrint() {
		window.print()
	}
    const offices: { title: string; requiresReceipt?: boolean; cleared?: boolean; date?: string }[] = [
        { title: 'PAYMENTS (NOR, CLEARANCE SLIP, ADVANCEMENT & LINKAGES, SPORTS, NYSC)', requiresReceipt: true, cleared: true, date: '17/08/2025' },
        { title: 'EXAMINATIONS & RECORDS (COLLECT CLEARANCE SLIP)', requiresReceipt: true, cleared: true, date: '17/08/2025' },
        { title: 'HEAD OF DEPARTMENT OR ASSISTANT DIRECTOR', cleared: true, date: '17/08/2025' },
        { title: 'FACULTY OFFICER/SECRETARY', cleared: true, date: '17/08/2025' },
        { title: 'FACULTY LIBRARY', cleared: false },
        { title: 'MAIN LIBRARY', cleared: false },
        { title: "SPORTS DIRECTORATE", cleared: false },
        { title: 'ALUMNI OFFICE (TELLER/RECEIPT/BOND)', cleared: false },
        { title: 'BURSARY', cleared: false },
        { title: 'STUDENT AFFAIRS', cleared: false },
        { title: 'SIWES/INDUSTRIAL TRAINING', cleared: false },
        { title: 'WORKS & SERVICES', cleared: false },
        { title: 'HEALTH CENTRE', cleared: false },
        { title: 'ICT DIRECTORATE', cleared: false },
        { title: 'SECURITY UNIT', cleared: false },
        { title: 'EXAMS MALPRACTICE UNIT (IF APPLICABLE)', cleared: false },
        { title: 'FINAL CLEARANCE & SLIP', cleared: false },
    ]

	return (
        <div className="px-4 py-6 mx-auto max-w-[900px]">
            <div className="bg-white text-black print:bg-white print:text-black border shadow-sm">
                {/* Header */}
                <div className="p-3 border-b grid grid-cols-[120px,1fr,90px] items-center gap-3">
                    <div className="flex items-center">
                        <Image src="/assets/eksulogo.png" alt="EKSU" className="w-[70px] h-auto" />
                    </div>
                    <div className="leading-tight">
                        <h1 className="text-[12px] font-extrabold tracking-wide text-center">EKITI STATE UNIVERSITY, ADO-EKITI</h1>
                        <p className="text-[11px] text-center">REGISTRY</p>
                        <p className="text-[11px] font-semibold text-center">CLEARANCE FORM FOR FINAL YEAR STUDENTS</p>
                    </div>
                    <div className="text-[10px] text-right">No. ______</div>
                </div>

                {/* Student details */}
                <div className="px-4 py-3 text-[11px] border-b">
                    <div className="grid grid-cols-2 gap-2">
                        <div>NAME OF GRADUATING STUDENT: <span className="font-semibold">BENEDICT NNAOMA</span></div>
                        <div>FACULTY: <span className="font-semibold">SCIENCE</span></div>
                        <div>MATRIC NO.: <span className="font-semibold">2393999090</span></div>
                        <div>DEPARTMENT: <span className="font-semibold">Computer Science</span></div>
                        <div>YEAR OF ADMISSION: <span className="font-semibold">2021</span></div>
                        <div>YEAR OF GRADUATION: <span className="font-semibold">2025</span></div>
                        <div>DEGREE/COURSE: <span className="font-semibold">B.Sc.</span></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button className="border px-2 py-1 text-[10px]">CLEARED / NOT CLEARED</button>
                        <button className="border px-2 py-1 text-[10px]">SIGN AND STAMP</button>
                    </div>
                </div>

                {/* Offices table */}
                <div className="text-[11px]">
                    {offices.map((o, idx) => (
                        <div
                            key={idx}
                            className="grid items-stretch border-b"
                            style={{ gridTemplateColumns: '60% 18% 22%' }}
                        >
                            <div className="p-2 leading-snug">
                                <div className="font-semibold uppercase">{o.title}</div>
                                {o.requiresReceipt && (
                                    <div className="text-[10px] italic">(Receipt to be uploaded where necessary)</div>
                                )}
                            </div>
                            <div className="p-2 border-l">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <div className="w-4 h-4 border flex items-center justify-center">{o.cleared ? '✔' : ''}</div>
                                    <span>CLEARED</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
                                    <div className="w-4 h-4 border"></div>
                                    <span>NOT CLEARED</span>
                                </div>
                            </div>
                            <div className="p-2 border-l leading-tight whitespace-nowrap">
                                <div className="text-[11px] font-semibold">{o.cleared ? `CLEARED - ${o.date}` : ''}</div>
                                <div className="text-[10px] mt-2">Date: {o.date ?? '__________'}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer entitlement and signatures */}
                <div className="px-4 py-4 text-[11px]">
                    <div className="border-t my-3"></div>
                    <div className="font-semibold mb-2">She/He is entitled to:</div>
                    <ol className="list-decimal ml-6 space-y-1">
                        <li>Final Examination Result</li>
                        <li>NYSC Call-up/Exclusion Letter</li>
                        <li>Caution Deposit Refund</li>
                    </ol>

                    <div className="grid grid-cols-[1fr,160px] items-end gap-4 mt-8">
                        <div>
                            <div className="h-[1px] bg-black w-56"></div>
                            <div className="mt-1 text-[10px]">Student&apos;s Affairs Officer</div>
                        </div>
                        <div className="text-right text-[11px]">Date: __________</div>
                    </div>
                </div>
			</div>

            <div className="mt-4 flex gap-3 no-print">
                <button onClick={handlePrint} className="px-4 py-2 rounded bg-blue-600 text-white text-sm flex items-center gap-2">
                    <span>🖨️</span>
                    <span>Print / Save as PDF</span>
                </button>
                <a href="/student/dashboard" className="px-4 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-sm flex items-center gap-2">
                    <span>⬅</span>
                    <span>Back to Dashboard</span>
                </a>
			</div>

            <style jsx global>{`
                /* Exact print layout tuning */
                @media print {
                    html, body { height: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
                /* Table borders consistency */
                .border, .border-b, .border-l { border-color: #111 !important; }
                /* Make checkboxes perfectly square */
                .w-4.h-4 { width: 12px; height: 12px; }
            `}</style>
		</div>
	)
}


