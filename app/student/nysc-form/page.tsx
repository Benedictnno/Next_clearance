'use client'

import Image from "next/image";

export default function NYSCFormPage() {
    function handlePrint() {
        window.print()
    }

    return (
        <div className="px-4 py-6">
            <div className="mx-auto bg-white text-black print:bg-white print:text-black border shadow-sm" style={{ width: '210mm' }}>
                {/* Header with logo, titles and passport box */}
                <div className="p-3 grid grid-cols-[120px,1fr,140px] items-start gap-3">
                    <div className="flex items-center">
                        <Image src="/assets/eksulogo.png" alt="EKSU" className="w-[70px] h-auto" />
                    </div>
                    <div className="leading-tight text-center">
                        <h1 className="text-[12px] font-extrabold tracking-wide">EKITI STATE UNIVERSITY, ADO-EKITI</h1>
                        <p className="text-[10px]">P.M.B. 5363, ADO-EKITI, EKITI STATE</p>
                        <p className="text-[11px] font-semibold mt-1">APPLICATION FORM FOR NATIONAL YOUTH SERVICE MOBILIZATION</p>
                    </div>
                    <div className="text-[10px] border h-[100px] flex items-center justify-center">
                        <div className="text-center leading-tight p-1">
                            <div>Affix</div>
                            <div>Passport</div>
                            <div>Photograph</div>
                        </div>
                    </div>
                </div>

                {/* Instruction line */}
                <div className="px-4 py-2 text-[10px]">
                    In the space provided, please affix one passport photograph using staple pin and must be duly stamped by your Head of Department
                </div>

                {/* Numbered fields */}
                <div className="px-4 py-3 text-[11px] space-y-2">
                    <Row num={1} label="Name" />
                    <Row num={2} label="Faculty" rightLabel="Department" />
                    <Row num={3} label="Course of Study" />
                    <Row num={4} label="Matric Number" />
                    <Row num={5} label="JAMB Reg. No." />

                    {/* Sex tick - single row */}
                    <div className="grid grid-cols-[30px,1fr] items-center gap-2">
                        <div className="text-left">6.</div>
                        <div className="flex items-center gap-6">
                            <div className="whitespace-nowrap">Sex (Tick ✓)</div>
                            <div className="flex items-center gap-2 whitespace-nowrap"><Square /> Male ( )</div>
                            <div className="flex items-center gap-2 whitespace-nowrap"><Square /> Female ( )</div>
                        </div>
                    </div>

                    {/* Date of birth - single row with boxes */}
                    <div className="grid grid-cols-[30px,1fr] items-center gap-2">
                        <div className="text-left">7.</div>
                        <div className="flex items-end gap-6">
                            <div className="whitespace-nowrap">Date of Birth</div>
                            <div className="grid grid-cols-3 gap-4 items-end">
                                <Box label="Day" />
                                <Box label="Month" />
                                <Box label="Year" />
                            </div>
                        </div>
                    </div>

                    <Row num={8} label="Marital Status (Tick ✓)" contentRight={<div className="grid grid-cols-3 gap-4"><Tick label="Single" /><Tick label="Married" /><Tick label="—" /></div>} singleRow />
                    <Row num={9} label="State of Origin" />
                    <Row num={10} label="Local Government of Origin" />
                    <Row num={11} label="Date and Year of Graduation" />
                    <Row num={12} label="Phone Number(s)" rightLabel="Email Address" />

                    {/* Declaration */}
                    <div className="mt-4 text-[11px]">I Confirm that the information provided by me above is true and authentic.</div>
                    <div className="grid grid-cols-[1fr,240px] items-center mt-4">
                        <div></div>
                        <div className="text-[10px]">Signature of Prospective Corps Member & Date</div>
                    </div>
                </div>

                {/* N.B. area */}
                <div className="px-4 py-3 text-[10px]">
                    <div className="font-semibold">N.B.</div>
                    <ul className="list-disc ml-5 leading-relaxed">
                        <li>Prospective corps member must attach a copy of notification Result or Certificate issued by the University</li>
                        <li>This form should be filled personally as any information provided here is irreversible</li>
                        <li>Alteration will not be entertained</li>
                        <li>Complete form legibly please.</li>
                    </ul>
                </div>

                {/* Official use only */}
                <div className="px-4 py-3 text-[11px]">
                    <div className="text-center font-semibold">OFFICIAL USE ONLY</div>

                    <div className="mt-3 text-[10px] underline">Verification of Results by the Admission Office</div>
                    <div className="mt-2 text-[11px]">I confirm that the results of the Student has been verified by Admission Office</div>
                    <div className="grid grid-cols-[1fr,260px] items-end mt-6 gap-6">
                        <div className="h-[1px] bg-black"></div>
                        <div className="text-[10px]">Name and Signature of Admission Officer</div>
                    </div>

                    <div className="mt-6 text-[11px]">HEAD OF DEPARTMENT</div>
                    <div className="mt-1 text-[11px]">I confirm that he/she is from the Department of ______________________________ and his/her result was ______________________________</div>
                    <div className="mt-1 text-[11px]">approved on __________. His or her result is yet to be approved but he/she is a graduating student</div>
                    <div className="grid grid-cols-[1fr,260px] items-end mt-6 gap-6">
                        <div className="h-[1px] bg-black"></div>
                        <div className="text-[10px]">Head of Department Signature and Date</div>
                    </div>

                    <div className="mt-6 text-[11px]">SUBMISSION TO STUDENTS&apos; AFFAIRS OFFICE</div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-3 no-print justify-center">
                <button onClick={handlePrint} className="px-4 py-2 rounded bg-blue-600 text-white text-sm">Print</button>
                <a href="/student/dashboard" className="px-4 py-2 rounded bg-gray-100 text-sm">Back</a>
            </div>

            <style jsx global>{`
                @media print {
                    html, body { height: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
                .box { border: 1px solid #111; height: 28px; }
            `}</style>
        </div>
    )
}

function Row({ num, label, rightLabel, contentRight, singleRow }: { num: number; label: string; rightLabel?: string; contentRight?: React.ReactNode; singleRow?: boolean }) {
    return (
        <div className="grid grid-cols-[30px,1fr] items-center gap-2">
            <div className="text-left">{num}.</div>
            {singleRow ? (
                <div className="grid grid-cols-1 items-center gap-2">
                    <div className="grid grid-cols-[200px,1fr] items-center gap-3">
                        <div className="whitespace-nowrap">{label}</div>
                        <div className="border-b h-[18px]"></div>
                    </div>
                    {contentRight}
                </div>
            ) : (
                <div className="grid grid-cols-2 items-center gap-4">
                    <div className="grid grid-cols-[200px,1fr] items-center gap-3">
                        <div className="whitespace-nowrap">{label}</div>
                        <div className="border-b h-[18px]"></div>
                    </div>
                    <div className="grid grid-cols-[200px,1fr] items-center gap-3">
                        <div className="whitespace-nowrap">{rightLabel ?? ''}</div>
                        <div className="border-b h-[18px]"></div>
                    </div>
                </div>
            )}
        </div>
    )
}

function Box({ label }: { label: string }) {
    return (
        <div>
            <div className="box"></div>
            <div className="text-[10px] mt-1">e.g. {label === 'Month' ? 'January' : label === 'Day' ? '01' : '2013'}</div>
        </div>
    )
}

function Square() {
    return <span className="inline-block border align-middle" style={{ width: 12, height: 12 }}></span>
}

function Tick({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2">
            <Square /> {label}
        </div>
    )
}


