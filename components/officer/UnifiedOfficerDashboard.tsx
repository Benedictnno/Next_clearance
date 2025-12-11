'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ClearanceSubmission {
    id: string;
    studentId: string;
    studentMatricNumber?: string;
    studentName?: string;
    officeId: string;
    officeName: string;
    documents: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
        uploadedAt: string;
    }>;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    submittedAt: string;
    reviewedAt?: string;
}

interface Statistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export default function UnifiedOfficerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<ClearanceSubmission[]>([]);
    const [statistics, setStatistics] = useState<Statistics>({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [selectedOffice, setSelectedOffice] = useState<string>('');
    const [selectedSubmission, setSelectedSubmission] = useState<ClearanceSubmission | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [action, setAction] = useState<'approve' | 'reject'>('approve');
    const [comment, setComment] = useState('');
    const [processing, setProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [officerInfo, setOfficerInfo] = useState<{ assignedOfficeId: string; assignedOfficeName: string } | null>(null);

    useEffect(() => {
        async function fetchOfficerInfo() {
            try {
                const res = await fetch('/api/officer/me');
                const data = await res.json();
                if (data.success && data.data.assignedOfficeId) {
                    setOfficerInfo(data.data);
                    setSelectedOffice(data.data.assignedOfficeId);
                }
            } catch (error) {
                console.error('Error fetching officer info:', error);
            }
        }
        fetchOfficerInfo();
    }, []);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint =
                viewMode === 'pending'
                    ? `/api/officer/clearance-workflow/pending?officeId=${selectedOffice}`
                    : `/api/officer/clearance-workflow/all?officeId=${selectedOffice}`;

            const res = await fetch(endpoint);
            const data = await res.json();
            setSubmissions(data.data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedOffice, viewMode]);

    const fetchStatistics = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/officer/clearance-workflow/statistics?officeId=${selectedOffice}`
            );
            const data = await res.json();
            if (data.success) {
                setStatistics(data.data);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    }, [selectedOffice]);

    useEffect(() => {
        if (selectedOffice) {
            fetchSubmissions();
            fetchStatistics();
        }
    }, [selectedOffice, viewMode, fetchSubmissions, fetchStatistics]);

    const handleAction = async () => {
        if (!selectedSubmission) return;

        if (action === 'reject' && !comment.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessing(true);
        try {
            const endpoint =
                action === 'approve'
                    ? '/api/officer/clearance-workflow/approve'
                    : '/api/officer/clearance-workflow/reject';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    [action === 'approve' ? 'comment' : 'reason']: comment,
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert(`Submission ${action}d successfully!`);
                setShowModal(false);
                setSelectedSubmission(null);
                setComment('');
                await fetchSubmissions();
                await fetchStatistics();
            } else {
                alert(data.error || `Failed to ${action} submission`);
            }
        } catch (error) {
            alert(`Error ${action}ing submission`);
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (submission: ClearanceSubmission, actionType: 'approve' | 'reject') => {
        setSelectedSubmission(submission);
        setAction(actionType);
        setShowModal(true);
        setComment('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const visibleSubmissions = !searchQuery.trim()
        ? submissions
        : submissions.filter((s) => {
            const name = (s.studentName || '').toLowerCase();
            const matric = (s.studentMatricNumber || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            return name.includes(q) || matric.includes(q);
        });

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
                                Officer Dashboard
                            </h1>
                            <p className="text-label text-dark-600 mt-1">Review and process student clearance submissions</p>
                        </div>
                        <button
                            onClick={() => router.push('/officer/dashboard')}
                            className="btn-accent"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Office Header */}
                <div className="card-primary mb-6 glow-on-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-h3 text-white font-semibold">
                                {officerInfo?.assignedOfficeName || 'Loading...'}
                            </h2>
                            <p className="text-mist-200 text-label mt-1">Your assigned clearance office</p>
                        </div>
                        <span className="px-4 py-2 bg-white/20 text-white rounded-full text-label font-semibold backdrop-blur-sm">
                            Assigned Unit
                        </span>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card glow-on-hover border-l-4 border-secondary-500">
                        <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Total Submissions</p>
                        <p className="text-h1 text-dark-900 font-bold mt-2">{statistics.total}</p>
                    </div>
                    <div className="card glow-on-hover border-l-4 border-secondary-500">
                        <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Pending</p>
                        <p className="text-h1 text-secondary-600 font-bold mt-2">{statistics.pending}</p>
                    </div>
                    <div className="card glow-on-hover border-l-4 border-green-500">
                        <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Approved</p>
                        <p className="text-h1 text-green-600 font-bold mt-2">{statistics.approved}</p>
                    </div>
                    <div className="card glow-on-hover border-l-4 border-accent-500">
                        <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Rejected</p>
                        <p className="text-h1 text-accent-600 font-bold mt-2">{statistics.rejected}</p>
                    </div>
                </div>

                {/* View Mode Toggle & Refresh */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewMode('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-120 ${viewMode === 'pending'
                                ? 'bg-secondary-500 text-white shadow-glow'
                                : 'bg-white text-dark-700 hover:bg-soft-300'
                                }`}
                        >
                            Pending ({statistics.pending})
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-120 ${viewMode === 'all'
                                ? 'bg-secondary-500 text-white shadow-glow'
                                : 'bg-white text-dark-700 hover:bg-soft-300'
                                }`}
                        >
                            All Submissions ({statistics.total})
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            fetchSubmissions();
                            fetchStatistics();
                        }}
                        className="btn-secondary"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Search */}
                <div className="card mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 relative">
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by student name or matric number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="btn-secondary"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Submissions List */}
                <div className="card">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-secondary-500 mx-auto"></div>
                            <p className="mt-4 text-dark-600 font-medium">Loading submissions...</p>
                        </div>
                    ) : visibleSubmissions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-soft-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">✓</span>
                            </div>
                            <h3 className="text-body font-semibold text-dark-900">
                                No {viewMode === 'pending' ? 'pending' : ''} submissions
                            </h3>
                            <p className="mt-2 text-label text-dark-600">
                                {viewMode === 'pending'
                                    ? 'All submissions for this office have been reviewed!'
                                    : 'No submissions found for this office.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-soft-400">
                            {visibleSubmissions.map((submission) => (
                                <div key={submission.id} className="p-6 hover:bg-soft-100 transition-all duration-120">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-secondary-500 to-mist-400 rounded-full flex items-center justify-center shadow-glow">
                                                    <span className="text-white font-bold text-body">
                                                        {submission.studentName?.[0] || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-dark-900 text-body">{submission.studentName}</h3>
                                                    <p className="data-field inline-block">{submission.studentMatricNumber}</p>
                                                </div>
                                            </div>

                                            <div className="ml-15 space-y-3">
                                                <div className="flex items-center space-x-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full font-medium text-label ${submission.status === 'pending'
                                                            ? 'badge-pending'
                                                            : submission.status === 'approved'
                                                                ? 'badge-approved'
                                                                : 'badge-rejected'
                                                            }`}
                                                    >
                                                        {submission.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-label text-dark-500">
                                                        Submitted {formatDate(submission.submittedAt)}
                                                    </span>
                                                </div>

                                                {submission.documents.length > 0 && (
                                                    <div>
                                                        <p className="text-label font-medium text-dark-700 mb-2">
                                                            Documents ({submission.documents.length}):
                                                        </p>
                                                        <div className="space-y-1">
                                                            {submission.documents.map((doc, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={doc.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center space-x-2 text-label text-secondary-600 hover:text-secondary-800 font-medium"
                                                                >
                                                                    <span>📄</span>
                                                                    <span>{doc.fileName}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {submission.comment && (
                                                    <div className="bg-soft-300 rounded-lg p-3">
                                                        <p className="text-label-sm font-medium text-dark-700">Comment:</p>
                                                        <p className="text-label text-dark-900 mt-1">{submission.comment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {submission.status === 'pending' && (
                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => openModal(submission, 'approve')}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg active:scale-95 transition-all duration-120 font-medium"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => openModal(submission, 'reject')}
                                                    className="btn-accent"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {showModal && selectedSubmission && (
                <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full animate-scale-in">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-h3 text-primary-500 font-semibold">
                                    {action === 'approve' ? '✓ Approve Submission' : '✗ Reject Submission'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-dark-400 hover:text-dark-600 font-bold text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="bg-soft-200 rounded-lg p-4 mb-4">
                                <h4 className="text-label font-semibold text-dark-700 mb-2">Student Information</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-label text-dark-600">Name:</span>
                                        <span className="text-label font-medium text-dark-900">
                                            {selectedSubmission.studentName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-label text-dark-600">Matric Number:</span>
                                        <span className="data-field">
                                            {selectedSubmission.studentMatricNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-label font-medium text-dark-700 mb-2">
                                    {action === 'approve' ? (
                                        <>
                                            Comment <span className="text-dark-400">(Optional)</span>
                                        </>
                                    ) : (
                                        <>
                                            Reason for Rejection <span className="text-accent-600">*</span>
                                        </>
                                    )}
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    className="input-field"
                                    placeholder={
                                        action === 'approve'
                                            ? 'Add any comments...'
                                            : 'Please provide a reason for rejection...'
                                    }
                                    required={action === 'reject'}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={processing}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={processing || (action === 'reject' && !comment.trim())}
                                    className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-120 ${action === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                                        : 'bg-accent-600 hover:bg-accent-700 hover:shadow-glow-accent'
                                        } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                                >
                                    {processing
                                        ? 'Processing...'
                                        : action === 'approve'
                                            ? 'Approve'
                                            : 'Reject'}
                                </button>
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
