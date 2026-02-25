'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { logout } from '@/lib/user-storage';

interface ClearanceRequest {
    id: string;
    studentName: string;
    studentMatricNumber: string;
    studentDepartment: string;
    studentFaculty: string;
    currentStep: number;
    status: string;
    startedAt: string;
    updatedAt: string;
    completedSteps: number;
    totalSteps: number;
    isFullyCompleted: boolean;
}

export default function OversightDashboard() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<ClearanceRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [facultyFilter, setFacultyFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [officerName, setOfficerName] = useState('');
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/officer/clearance-workflow/oversight');
            const data = await res.json();
            if (data.success) {
                setRequests(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching oversight data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOfficerInfo = useCallback(async () => {
        try {
            const res = await fetch('/api/officer/me');
            const data = await res.json();
            if (data.success) {
                setOfficerName(data.data.name);
                // Strict Gating: Only Student Affairs (OVERSEER/STUDENT_AFFAIRS) can view this page
                const isAuthorized = ['OVERSEER', 'STUDENT_AFFAIRS', 'ADMIN', 'SUPER_ADMIN'].includes(data.data.role);
                if (!isAuthorized) {
                    console.warn('[Oversight] Unauthorized access attempt, redirecting to dashboard...');
                    router.push('/officer/dashboard');
                }
            } else {
                router.push('/officer/dashboard');
            }
        } catch (error) {
            console.error('Error fetching officer info:', error);
            router.push('/officer/dashboard');
        }
    }, [router]);

    useEffect(() => {
        fetchOfficerInfo();
        fetchData();
    }, [fetchData, fetchOfficerInfo]);

    // Extract unique departments and faculties for filters
    const departments = useMemo(() => {
        const set = new Set(requests.map(r => r.studentDepartment).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [requests]);

    const faculties = useMemo(() => {
        const set = new Set(requests.map(r => r.studentFaculty).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            const matchesSearch =
                r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.studentMatricNumber.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDept = deptFilter === 'All' || r.studentDepartment === deptFilter;
            const matchesFaculty = facultyFilter === 'All' || r.studentFaculty === facultyFilter;
            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Completed' && r.isFullyCompleted) ||
                (statusFilter === 'In Progress' && !r.isFullyCompleted);

            return matchesSearch && matchesDept && matchesFaculty && matchesStatus;
        });
    }, [requests, searchQuery, deptFilter, facultyFilter, statusFilter]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const calculateProgress = (completed: number, total: number) => {
        return Math.round((completed / total) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading University Audit System...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Banner */}
            <div className="bg-slate-900 text-white border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center space-x-2 text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                <span>System Overseer Mode</span>
                            </div>
                            <h1 className="text-4xl text-white font-black tracking-tight">Student Affairs Oversight</h1>
                            <p className="text-slate-400 mt-2 font-medium">Hello, {officerName || 'Officer'} • Monitoring all University Clearance activity.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Print Report
                            </button>
                            <button
                                onClick={() => logout()}
                                className="bg-slate-800 text-white hover:bg-slate-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center border border-slate-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Started Clearance</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{requests.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                        <p className="text-3xl font-black text-amber-600 mt-1">{requests.filter(r => !r.isFullyCompleted).length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fully Completed</p>
                        <p className="text-3xl font-black text-emerald-600 mt-1">{requests.filter(r => r.isFullyCompleted).length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Progress</p>
                        <p className="text-3xl font-black text-blue-600 mt-1">
                            {requests.length > 0
                                ? Math.round(requests.reduce((acc, r) => acc + calculateProgress(r.completedSteps, r.totalSteps), 0) / requests.length)
                                : 0}%
                        </p>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Search Students</label>
                            <input
                                type="text"
                                placeholder="Name or Matric Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none border"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Faculty</label>
                            <select
                                value={facultyFilter}
                                onChange={(e) => setFacultyFilter(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none border"
                            >
                                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Department</label>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none border"
                            >
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none border"
                            >
                                <option value="All">All Statuses</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900">Student Affairs Registry</h2>
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase">
                            {filteredRequests.length} Students
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student Info</th>
                                    <th className="px-6 py-4 text-left">Academic Data</th>
                                    <th className="px-6 py-4 text-left">Clearance Progress</th>
                                    <th className="px-6 py-4 text-left">Started At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-all group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-sm border border-slate-200">
                                                    {r.studentName[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-black text-slate-900">{r.studentName}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{r.studentMatricNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <p className="text-xs font-bold text-slate-600">{r.studentDepartment}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.studentFaculty}</p>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap min-w-[200px]">
                                            <div className="flex flex-col space-y-1.5">
                                                <div className="flex justify-between items-end">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${r.isFullyCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                        Step {r.currentStep} of {r.totalSteps}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400">
                                                        {calculateProgress(r.completedSteps, r.totalSteps)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${r.isFullyCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${calculateProgress(r.completedSteps, r.totalSteps)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <p className="text-xs font-bold text-slate-600">{formatDate(r.startedAt)}</p>
                                            <p className="text-[10px] text-slate-400">Updated {formatDate(r.updatedAt)}</p>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            {r.isFullyCompleted ? (
                                                <button
                                                    className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                                >
                                                    View Forms
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="bg-slate-50 border border-slate-200 text-slate-400 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest cursor-not-allowed"
                                                >
                                                    In Progress
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredRequests.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="text-6xl mb-4 grayscale opacity-20">📊</div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No match found</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your audit filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
