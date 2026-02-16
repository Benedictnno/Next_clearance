'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Office {
    id: string;
    name: string;
    step: number;
}

interface OfficeStatus {
    officeId: string;
    officeName: string;
    stepNumber: number;
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    submittedAt?: string;
    reviewedAt?: string;
    comment?: string;
}

interface ClearanceStatus {
    studentId: string;
    studentName?: string;
    studentMatricNumber?: string;
    offices: OfficeStatus[];
    overallProgress: number;
    isCompleted: boolean;
    canAccessFinalForms: boolean;
}

interface StudentProfile {
    firstName: string;
    lastName: string;
    matricNumber: string;
    email: string;
    department?: { name: string };
}

interface UploadedFile {
    fileName: string;
    fileUrl: string;
    fileType: string;
}

export default function UnifiedStudentDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<ClearanceStatus | null>(null);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch student profile
            const profileRes = await fetch('/api/student/profile', {
                credentials: 'include',
            });

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setStudentProfile(profileData.data);
            } else if (profileRes.status === 401 || profileRes.status === 403) {
                router.push('/');
                return;
            }

            // Fetch clearance status
            const statusRes = await fetch('/api/student/clearance-workflow/status');
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setStatus(statusData.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load clearance data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            const uploadedData = Array.isArray(data.files) ? data.files : (data.data ? [data.data] : []);

            const newFiles: UploadedFile[] = uploadedData.map((file: any) => ({
                fileName: file.fileName || file.originalName || file.name,
                fileUrl: file.url || file.fileUrl,
                fileType: file.mimeType || file.type || 'application/octet-stream',
            }));

            setUploadedFiles([...uploadedFiles, ...newFiles]);
            setSuccess(`Successfully uploaded ${newFiles.length} file(s)`);

            e.target.value = '';
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to upload files');
            e.target.value = '';
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedOffice || uploadedFiles.length === 0) {
            setError('Please select an office and upload at least one document');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/student/clearance-workflow/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    officeId: selectedOffice,
                    documents: uploadedFiles,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Submission failed');
            }

            setSuccess('Documents submitted successfully!');
            setUploadedFiles([]);
            setSelectedOffice(null);

            await fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit documents');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-300';
            case 'pending': return 'bg-secondary-100 text-secondary-800 border-secondary-300';
            case 'rejected': return 'bg-accent-100 text-accent-800 border-accent-300';
            default: return 'bg-soft-400 text-dark-700 border-soft-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return '✓';
            case 'pending': return '⏳';
            case 'rejected': return '✗';
            default: return '○';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-soft-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500 mx-auto"></div>
                    <p className="mt-4 text-dark-700 font-medium">Loading your clearance dashboard...</p>
                </div>
            </div>
        );
    }

    if (!studentProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-soft-200">
                <div className="text-center card max-w-md">
                    <p className="text-accent-600 mb-4 font-medium">Failed to load student profile</p>
                    <button onClick={() => window.location.reload()} className="btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const approvedCount = status?.offices.filter(o => o.status === 'approved').length || 0;
    const pendingCount = status?.offices.filter(o => o.status === 'pending').length || 0;
    const totalOffices = status?.offices.length || 10;

    return (
        <div className="min-h-screen bg-soft-200">
            {/* Gradient Ribbon Header */}
            <div className="gradient-ribbon h-2"></div>

            {/* Header */}
            <div className="bg-white shadow-sm border-b border-soft-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-h2 text-primary-500 font-semibold">
                                Welcome, {studentProfile.firstName}!
                            </h1>
                            <p className="text-label text-dark-600 mt-1">
                                <span className="data-field inline-block">{studentProfile.matricNumber}</span>
                                {studentProfile.department && (
                                    <span className="ml-3 text-dark-600">• {studentProfile.department.name}</span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/auth/logout')}
                            className="btn-accent"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alerts */}
                {error && (
                    <div className="mb-6 bg-accent-50 border-2 border-accent-300 rounded-lg p-4 flex items-center justify-between animate-shake">
                        <p className="text-accent-700 font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="text-accent-600 hover:text-accent-800 font-bold">
                            ✕
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-between animate-scale-in">
                        <p className="text-green-700 font-medium">{success}</p>
                        <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800 font-bold">
                            ✕
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card-primary glow-on-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-mist-200 text-label-sm font-medium uppercase tracking-wide">Overall Progress</p>
                                <p className="text-h1 text-white font-bold mt-2">{status?.overallProgress || 0}%</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-3xl">📊</span>
                            </div>
                        </div>
                        <div className="mt-4 progress-bar">
                            <div className="progress-fill" style={{ width: `${status?.overallProgress || 0}%` }}></div>
                        </div>
                    </div>

                    <div className="card glow-on-hover border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-600 text-label-sm font-medium uppercase tracking-wide">Approved</p>
                                <p className="text-h1 text-green-600 font-bold mt-2">{approvedCount}/{totalOffices}</p>
                            </div>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl">✓</span>
                            </div>
                        </div>
                    </div>

                    <div className="card glow-on-hover border-l-4 border-secondary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-600 text-label-sm font-medium uppercase tracking-wide">Pending Review</p>
                                <p className="text-h1 text-secondary-600 font-bold mt-2">{pendingCount}</p>
                            </div>
                            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl">⏳</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Office List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-h3 text-primary-500 font-semibold">Clearance Offices</h2>
                                <button onClick={fetchData} className="btn-secondary text-sm">
                                    🔄 Refresh
                                </button>
                            </div>

                            <div className="space-y-4">
                                {status?.offices.map((office, index) => (
                                    <div
                                        key={office.officeId}
                                        className={`border-2 rounded-lg p-5 transition-all duration-160 ${getStatusColor(office.status)} ${selectedOffice === office.officeId ? 'ring-4 ring-secondary-300' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-3xl">{getStatusIcon(office.status)}</span>
                                                    <div>
                                                        <h3 className="font-semibold text-dark-900 text-body">
                                                            {office.stepNumber}. {office.officeName}
                                                        </h3>
                                                        <p className="text-label mt-1 capitalize font-medium">
                                                            Status: {office.status.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {office.comment && (
                                                    <div className="mt-3 bg-white/70 rounded-lg p-3">
                                                        <p className="text-label-sm font-medium text-dark-700">Officer's Comment:</p>
                                                        <p className="text-label text-dark-900 mt-1">{office.comment}</p>
                                                    </div>
                                                )}

                                                {office.submittedAt && (
                                                    <p className="text-label-sm text-dark-600 mt-2 font-mono">
                                                        Submitted: {new Date(office.submittedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                {(office.status === 'not_started' || office.status === 'rejected') && (
                                                    <button
                                                        onClick={() => setSelectedOffice(office.officeId)}
                                                        className="btn-primary text-sm"
                                                    >
                                                        {office.status === 'rejected' ? 'Resubmit' : 'Submit'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Completion Card */}
                        {status?.isCompleted && (
                            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white animate-scale-in">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-5xl">🎉</span>
                                    </div>
                                    <h3 className="text-h3 font-bold mb-2">All Approved!</h3>
                                    <p className="text-label mb-4">Congratulations! You can now access your clearance forms.</p>
                                    <button
                                        onClick={() => router.push('/student/slip')}
                                        className="w-full bg-white text-green-600 px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-120"
                                    >
                                        Download Clearance Forms
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="card">
                            <h3 className="text-h3 text-primary-500 font-semibold mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/student/profile')}
                                    className="w-full text-left p-3 text-label font-medium hover:text-white text-black  hover:bg-green-600 rounded-lg transition-all duration-120"
                                >
                                    👤 View Profile
                                </button>
                                <button
                                    onClick={() => router.push('/student/notifications')}
                                    className="w-full text-left p-3 text-label font-medium hover:text-white text-black hover:bg-green-700 rounded-lg transition-all duration-120"
                                >
                                    🔔 Notifications
                                </button>
                                <button
                                    onClick={() => router.push('/student/slip')}
                                    className="w-full text-left p-3 text-label font-medium hover:text-white text-black hover:bg-green-700 rounded-lg transition-all duration-120"
                                >
                                    📄 View/Print Clearance Slip
                                </button>
                                <button
                                    onClick={() => router.push('/student/nysc-info')}
                                    className="w-full text-left p-3 text-label font-medium hover:text-white text-black hover:bg-green-700 rounded-lg transition-all duration-120"
                                >
                                    📝 Fill NYSC Information
                                </button>
                                <button
                                    onClick={() => router.push('/student/nysc-form')}
                                    className="w-full text-left p-3 text-label font-medium hover:text-white text-black  hover:bg-green-700 rounded-lg transition-all duration-120"
                                >
                                    📥 Download NYSC Form
                                </button>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="card bg-secondary-50 border-2 border-secondary-200">
                            <h4 className="font-semibold text-secondary-900 mb-3 text-body">📌 Important Notes</h4>
                            <ul className="text-label text-secondary-800 space-y-2">
                                <li>• Upload clear, legible documents</li>
                                <li>• Ensure all required receipts are included</li>
                                <li>• You can resubmit if rejected</li>
                                <li>• All {totalOffices} offices must approve</li>
                                <li>• Check notifications for updates</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {selectedOffice && (
                <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full animate-scale-in">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-h3 text-primary-500 font-semibold">
                                    Submit to {status?.offices.find(o => o.officeId === selectedOffice)?.officeName}
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedOffice(null);
                                        setUploadedFiles([]);
                                    }}
                                    className="text-dark-400 hover:text-dark-600 font-bold text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-label font-medium text-dark-700 mb-2">
                                        Upload Documents
                                    </label>
                                    <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-secondary-500 hover:bg-secondary-50 transition-all duration-160">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                                                <span className="text-3xl">📎</span>
                                            </div>
                                            <p className="text-body text-dark-700 font-medium">
                                                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-label-sm text-dark-500 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                                        </label>
                                    </div>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div>
                                        <p className="text-label font-medium text-dark-700 mb-2">Uploaded Files:</p>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {uploadedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-soft-300 rounded-lg p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-secondary-600 text-xl">📄</span>
                                                        <span className="text-label text-dark-900 font-medium">{file.fileName}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="text-accent-600 hover:text-accent-800 font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedOffice(null);
                                            setUploadedFiles([]);
                                        }}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || uploadedFiles.length === 0}
                                        className="flex-1 btn-primary"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Documents'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Gradient */}
            <div className="gradient-ribbon h-2 mt-12"></div>
        </div>
    );
}
