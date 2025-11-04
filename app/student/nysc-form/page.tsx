'use client'

import { useEffect, useState } from 'react';
import Image from "next/image";

interface OfficeStatus {
  officeId: string;
  officeName: string;
  stepNumber: number;
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
}

interface ClearanceStatus {
  offices: OfficeStatus[];
  overallProgress: number;
  isCompleted: boolean;
}

interface StudentInfo {
  name: string;
  faculty: string;
  department: string;
  courseOfStudy: string;
  matricNumber: string;
  jambRegNo?: string;
  sex?: 'male' | 'female';
  dateOfBirth?: {
    day: string;
    month: string;
    year: string;
  };
  maritalStatus?: 'single' | 'married';
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  dateOfGraduation?: string;
  phoneNumber?: string;
  email?: string;
}

export default function NYSCFormPage() {
    const [loading, setLoading] = useState(true);
    const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus | null>(null);
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            // Fetch NYSC info first (contains filled form data)
            const nyscInfoRes = await fetch('/api/student/nysc-info', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const nyscInfoData = await nyscInfoRes.json();
            
            if (nyscInfoData.success && nyscInfoData.data) {
                // Use saved NYSC info
                const info = nyscInfoData.data;
                setStudentInfo({
                    name: info.name,
                    faculty: info.faculty,
                    department: info.department,
                    courseOfStudy: info.courseOfStudy,
                    matricNumber: info.matricNumber,
                    jambRegNo: info.jambRegNo,
                    sex: info.sex,
                    dateOfBirth: {
                        day: info.dateOfBirthDay,
                        month: info.dateOfBirthMonth,
                        year: info.dateOfBirthYear
                    },
                    maritalStatus: info.maritalStatus,
                    stateOfOrigin: info.stateOfOrigin,
                    lgaOfOrigin: info.lgaOfOrigin,
                    dateOfGraduation: info.dateOfGraduation,
                    phoneNumber: info.phoneNumber,
                    email: info.email
                });
            } else {
                // Fallback to profile data if NYSC info not filled
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
                        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                        faculty: student.faculty?.name || '',
                        department: student.department?.name || '',
                        courseOfStudy: student.courseOfStudy || '',
                        matricNumber: student.matricNumber || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    function handlePrint() {
        window.print()
    }

    return (
        <div className="px-4 py-6">
            <div className="mx-auto bg-white text-black print:bg-white print:text-black border-2 border-black shadow-sm" style={{ width: '210mm' }}>
                {/* Header with logo, titles and passport box */}
                <div className="p-4 flex items-start justify-between gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Image src="/assets/eksulogo.png" alt="EKSU" width={120} height={120} className="w-[120px] h-auto" />
                    </div>
                    
                    {/* Center Text */}
                    <div className="flex-1 text-center leading-tight pt-2">
                        <h1 className="text-[14px] font-bold tracking-wide uppercase">EKITI STATE UNIVERSITY, ADO-EKITI</h1>
                        <p className="text-[11px] mt-1">P.M.B. 5363, ADO-EKITI, EKITI STATE</p>
                        <p className="text-[12px] font-bold mt-2 uppercase">APPLICATION FORM FOR NATIONAL</p>
                        <p className="text-[12px] font-bold uppercase">YOUTH SERVICE MOBILIZATION</p>
                    </div>
                    
                    {/* Passport Photo Box */}
                    <div className="flex-shrink-0 border-2 border-black w-[120px] h-[120px] flex items-center justify-center">
                        <div className="text-center leading-tight p-2 text-[9px]">
                            <div>Affix</div>
                            <div>Passport</div>
                            <div>Photograph</div>
                        </div>
                    </div>
                </div>

                {/* Instruction line */}
                <div className="px-4 py-3 text-[10px] italic border-t border-gray-300">
                    In the space provided, please affix one passport photograph using staple pin and must be duly stamped by your Head of Department
                </div>

                <div className="px-4 py-2 text-[10px] italic">
                    Please peruse and complete the form appropriately
                </div>

                {/* Numbered fields */}
                <div className="px-4 py-3 text-[11px] space-y-3">
                    <Row num={1} label="Name:" value={studentInfo?.name} fullWidth />
                    <Row num={2} label="Faculty:" value={studentInfo?.faculty} rightLabel="Department:" rightValue={studentInfo?.department} />
                    <Row num={3} label="Course of Study:" value={studentInfo?.courseOfStudy} fullWidth />
                    <Row num={4} label="Matric Number:" value={studentInfo?.matricNumber} fullWidth />
                    <Row num={5} label="JAMB Reg. No.:" value={studentInfo?.jambRegNo} fullWidth />

                    {/* Sex tick - single row */}
                    <div className="grid grid-cols-[30px,1fr] items-center gap-2">
                        <div className="text-left">6.</div>
                        <div className="flex items-center justify-between">
                            <div className="whitespace-nowrap">Sex (Tick X)</div>
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">Male <span className="inline-block w-6 h-5 border border-black mx-1 flex items-center justify-center text-xs font-bold">{studentInfo?.sex === 'male' ? 'X' : ''}</span></div>
                                <div className="flex items-center gap-2">Female <span className="inline-block w-6 h-5 border border-black mx-1 flex items-center justify-center text-xs font-bold">{studentInfo?.sex === 'female' ? 'X' : ''}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Date of birth - single row with boxes */}
                    <div className="grid grid-cols-[30px,1fr] items-center gap-2">
                        <div className="text-left">7.</div>
                        <div className="flex items-center gap-4">
                            <div className="whitespace-nowrap">Date of Birth</div>
                            <div className="flex items-end gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="border border-black w-16 h-8 flex items-center justify-center">
                                        <span className="text-xs font-semibold">{studentInfo?.dateOfBirth?.day || ''}</span>
                                    </div>
                                    <div className="text-[9px] mt-1">e.g. Day</div>
                                    <div className="text-[9px]">01</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="border border-black w-24 h-8 flex items-center justify-center">
                                        <span className="text-xs font-semibold">{studentInfo?.dateOfBirth?.month || ''}</span>
                                    </div>
                                    <div className="text-[9px] mt-1">Month</div>
                                    <div className="text-[9px]">January</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="border border-black w-16 h-8 flex items-center justify-center">
                                        <span className="text-xs font-semibold">{studentInfo?.dateOfBirth?.year || ''}</span>
                                    </div>
                                    <div className="text-[9px] mt-1">Year</div>
                                    <div className="text-[9px]">2013</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-[30px,1fr] items-center gap-2">
                        <div className="text-left">8.</div>
                        <div className="flex items-center justify-between">
                            <div className="whitespace-nowrap">Marital Status (Tick x)</div>
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">Single <span className="inline-block w-6 h-5 border border-black mx-1 flex items-center justify-center text-xs font-bold">{studentInfo?.maritalStatus === 'single' ? 'X' : ''}</span></div>
                                <div className="flex items-center gap-2">Married <span className="inline-block w-6 h-5 border border-black mx-1 flex items-center justify-center text-xs font-bold">{studentInfo?.maritalStatus === 'married' ? 'X' : ''}</span></div>
                            </div>
                        </div>
                    </div>

                    <Row num={9} label="State of Origin:" value={studentInfo?.stateOfOrigin} fullWidth />
                    <Row num={10} label="Local Government of Origin:" value={studentInfo?.lgaOfOrigin} fullWidth />
                    <Row num={11} label="Date and Year of Graduation:" value={studentInfo?.dateOfGraduation} fullWidth />
                    <Row num={12} label="Phone Number(s):" value={studentInfo?.phoneNumber} rightLabel="Email Address:" rightValue={studentInfo?.email} />

                    {/* Declaration */}
                    <div className="mt-6 text-[11px] italic">I Confirm that the information provided by me above is true and authentic.</div>
                    <div className="grid grid-cols-[1fr,1fr] items-end mt-6 gap-4">
                        <div className="border-b border-black h-8"></div>
                        <div className="text-[10px] text-center">Signature of Prospective Corps Member & Date</div>
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
                <div className="px-4 py-4 text-[11px] border-t-2 border-black mt-4">
                    <div className="text-center font-bold text-[12px] mb-4">OFFICIAL USE ONLY</div>

                    <div className="mt-4 text-[10px] font-semibold underline">Verification of Results by the Admission Office</div>
                    <div className="mt-2 text-[11px] italic">I confirm that the results of the Student has been verified by Admission Office</div>
                    <div className="grid grid-cols-[1fr,auto] items-end mt-4 gap-6">
                        <div className="border-b border-black h-8"></div>
                        <div className="text-[10px] whitespace-nowrap">Name and Signature of Admission Officer</div>
                    </div>

                    <div className="mt-8 text-[11px] font-semibold">HEAD OF DEPARTMENT</div>
                    <div className="mt-2 text-[11px]">I confirm that he/she is from the Department of <span className="border-b border-black px-20"></span> and his/her result was</div>
                    <div className="mt-1 text-[11px]">approved on <span className="border-b border-black px-12"></span>. /His or her result is yet to be approved but he/she is a graduating</div>
                    <div className="text-[11px]">students</div>
                    <div className="grid grid-cols-[1fr,auto] items-end mt-4 gap-6">
                        <div className="border-b border-black h-8"></div>
                        <div className="text-[10px] whitespace-nowrap">Head of Department Signature and Date</div>
                    </div>

                    <div className="mt-8 text-[11px] font-semibold">SUBMISSION TO STUDENTS&apos; AFFAIRS OFFICE</div>
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
            `}</style>
        </div>
    )
}

function Row({ num, label, value, rightLabel, rightValue, contentRight, singleRow, fullWidth }: { 
    num: number; 
    label: string; 
    value?: string;
    rightLabel?: string; 
    rightValue?: string;
    contentRight?: React.ReactNode; 
    singleRow?: boolean;
    fullWidth?: boolean;
}) {
    return (
        <div className="grid grid-cols-[30px,1fr] items-center gap-2">
            <div className="text-left">{num}.</div>
            {fullWidth ? (
                <div className="flex items-center gap-2">
                    <div className="whitespace-nowrap">{label}</div>
                    <div className="border-b border-black flex-1 h-[20px] relative">
                        {value && <span className="absolute left-0 top-0 text-[11px] font-semibold">{value}</span>}
                    </div>
                </div>
            ) : singleRow ? (
                <div className="grid grid-cols-1 items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="whitespace-nowrap">{label}</div>
                        <div className="border-b border-black flex-1 h-[20px] relative">
                            {value && <span className="absolute left-0 top-0 text-[11px]">{value}</span>}
                        </div>
                    </div>
                    {contentRight}
                </div>
            ) : (
                <div className="grid grid-cols-2 items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="whitespace-nowrap">{label}</div>
                        <div className="border-b border-black flex-1 h-[20px] relative">
                            {value && <span className="absolute left-0 top-0 text-[11px] font-semibold">{value}</span>}
                        </div>
                    </div>
                    {rightLabel && (
                        <div className="flex items-center gap-2">
                            <div className="whitespace-nowrap">{rightLabel}</div>
                            <div className="border-b border-black flex-1 h-[20px] relative">
                                {rightValue && <span className="absolute left-0 top-0 text-[11px] font-semibold">{rightValue}</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}



