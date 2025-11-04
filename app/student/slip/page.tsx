'use client'

import { useEffect, useState } from 'react';
import Image from "next/image";

interface OfficeStatus {
  officeId: string;
  officeName: string;
  stepNumber: number;
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  comment?: string;
}

interface StudentInfo {
  name: string;
  matricNumber: string;
  faculty: string;
  department: string;
  level: string;
}

export default function SlipPage() {
    const [loading, setLoading] = useState(true);
    const [offices, setOffices] = useState<OfficeStatus[]>([]);
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

    useEffect(() => {
        fetchClearanceData();
    }, []);

    async function fetchClearanceData() {
        try {
            // Fetch clearance status with no-cache to prevent stale data
            const clearanceRes = await fetch('/api/student/clearance-workflow/status', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const clearanceData = await clearanceRes.json();
            
            if (clearanceData.success) {
                setOffices(clearanceData.data.offices || []);
            }

            // Fetch student profile information with no-cache
            const profileRes = await fetch('/api/student/profile', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const profileData = await profileRes.json();
            
            if (profileData.success) {
                const student = profileData.data;
                setStudentInfo({
                    name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || clearanceData.data?.studentName || 'N/A',
                    matricNumber: student.matricNumber || clearanceData.data?.studentMatricNumber || 'N/A',
                    faculty: student.faculty?.name || 'N/A',
                    department: student.department?.name || 'N/A',
                    level: student.level || 'N/A'
                });
            } else {
                // Fallback to clearance data
                setStudentInfo({
                    name: clearanceData.data?.studentName || 'N/A',
                    matricNumber: clearanceData.data?.studentMatricNumber || 'N/A',
                    faculty: 'N/A',
                    department: 'N/A',
                    level: 'N/A'
                });
            }
        } catch (error) {
            console.error('Error fetching clearance data:', error);
        } finally {
            setLoading(false);
        }
    }

	function handlePrint() {
		window.print()
	}

    function formatDate(dateString?: string): string {
        if (!dateString) return '__________';
        return new Date(dateString).toLocaleDateString('en-GB');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading clearance slip...</p>
                </div>
            </div>
        );
    }

	return (
        <div className="px-4 py-6 mx-auto max-w-[900px]">
            <div className="bg-white text-black print:bg-white print:text-black border-2 border-black shadow-lg">
                {/* Header */}
                <div className="p-6 border-b-4 border-black">
                    <div className="flex items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Image 
                                src="/assets/eksulogo.png" 
                                alt="EKSU" 
                                width={180} 
                                height={180} 
                                className="w-[180px] h-auto" 
                            />
                        </div>
                        
                        {/* Center Text */}
                        <div className="flex-1 text-center leading-tight">
                            <h1 className="text-[16px] font-bold tracking-wide uppercase">EKITI STATE UNIVERSITY, ADO-EKITI</h1>
                            <p className="text-[14px] font-bold mt-2">REGISTRY</p>
                            <p className="text-[14px] font-bold mt-2">CLEARANCE FORM FOR FINAL YEAR STUDENTS</p>
                        </div>
                        
                        {/* No. Box */}
                        <div className="flex-shrink-0 border-2 border-black w-[90px] h-[90px] flex items-center justify-center">
                            <div className="text-[12px] font-semibold text-center">No.</div>
                        </div>
                    </div>
                </div>

                {/* Instruction Text */}
                <div className="px-4 py-3 text-[10px] leading-relaxed border-b border-gray-300">
                    Each Student must complete this form in duplicate before being cleared by the Registry. Each Department in the University must keep complete with all the information to show a recommendation/clearance letter only as are in the instructions on the back of the form to be followed by each student.
                </div>

                {/* Student details */}
                <div className="px-4 py-4 text-[11px]">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex">
                            <span className="font-bold">NAME OF GRADUATING<br/>STUDENT:</span>
                            <span className="ml-2 border-b border-black flex-1">{studentInfo?.name.toUpperCase()}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold">FACULTY:</span>
                            <span className="ml-2 border-b border-black flex-1">{studentInfo?.faculty.toUpperCase()}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold">MATRIC NO.:</span>
                            <span className="ml-2 border-b border-black flex-1">{studentInfo?.matricNumber}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold">DEPARTMENT:</span>
                            <span className="ml-2 border-b border-black flex-1">{studentInfo?.department}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold">YEAR OF ADMISSION:</span>
                            <span className="ml-2 border-b border-black flex-1">{new Date().getFullYear() - 4}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold">YEAR OF GRADUATION:</span>
                            <span className="ml-2 border-b border-black flex-1">{new Date().getFullYear()}</span>
                        </div>
                        <div className="flex col-span-2">
                            <span className="font-bold">DEGREE/COURSE:</span>
                            <span className="ml-2 border-b border-black flex-1">B.Sc.</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-4">
                        <div className="border-2 border-black px-4 py-2 text-center font-bold">
                            CLEARED / NOT CLEARED
                        </div>
                        <div className="border-2 border-black px-4 py-2 text-center font-bold">
                            SIGN AND STAMP
                        </div>
                    </div>
                </div>

                {/* Offices table */}
                <div className="border-t-2 border-black">
                    {offices.map((o, idx) => {
                        const isCleared = o.status === 'approved';
                        const isNotCleared = o.status === 'rejected' || o.status === 'not_started';
                        return (
                            <div
                                key={o.officeId}
                                className="grid items-center border-b-2 border-black min-h-[70px]"
                                style={{ gridTemplateColumns: '50% 20% 30%' }}
                            >
                                {/* Office Name */}
                                <div className="p-3 border-r-2 border-black">
                                    <div className="font-bold uppercase text-[11px]">{o.officeName}</div>
                                    <div className="text-[9px] text-gray-600 mt-1 italic">
                                        (Please include acknowledgement no)
                                    </div>
                                </div>

                                {/* Checkbox Section */}
                                <div className="p-3 border-r-2 border-black flex flex-col justify-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-black flex items-center justify-center font-bold text-[16px]">
                                            {isCleared ? '✓' : ''}
                                        </div>
                                        <span className="text-[11px] font-semibold">CLEARED</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-black flex items-center justify-center font-bold text-[16px]">
                                            {isNotCleared ? '✓' : ''}
                                        </div>
                                        <span className="text-[11px] font-semibold">NOT CLEARED</span>
                                    </div>
                                </div>

                                {/* Status and Date */}
                                <div className="p-3 flex flex-col justify-center">
                                    {isCleared && (
                                        <div className="text-[11px] font-bold text-blue-600 mb-2">
                                            CLEARED - {o.stepNumber.toString().padStart(2, '0')}/{new Date().getFullYear()}
                                        </div>
                                    )}
                                    <div className="text-[10px]">
                                        Date: {isCleared ? formatDate(o.reviewedAt) : '_______________'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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


