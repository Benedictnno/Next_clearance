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

interface Office {
  id: string;
  name: string;
}

const OFFICES: Office[] = [
  { id: 'department_hod', name: 'Head of Department (HOD)' },
  { id: 'faculty_officer', name: 'Faculty Officer' },
  { id: 'university_librarian', name: 'University Librarian' },
  { id: 'exams_transcript', name: 'Exams and Transcript Office' },
  { id: 'bursary', name: 'Bursary' },
  { id: 'sports_council', name: 'Sports Council' },
  { id: 'alumni_association', name: 'Alumni Association' },
  { id: 'internal_audit', name: 'Internal Audit' },
  { id: 'student_affairs', name: 'Student Affairs' },
  { id: 'security_office', name: 'Security Office' },
];

export default function OfficerClearanceWorkflow() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState<string>(OFFICES[0].id);
  const [submissions, setSubmissions] = useState<ClearanceSubmission[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [selectedSubmission, setSelectedSubmission] = useState<ClearanceSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter submissions by search query (student name or matric number)
  const visibleSubmissions = !searchQuery.trim()
    ? submissions
    : submissions.filter((s) => {
        const name = (s.studentName || '').toLowerCase();
        const matric = (s.studentMatricNumber || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || matric.includes(q);
      });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Clearance Workflow - Officer Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Review and process student submissions</p>
            </div>
            <button
              onClick={() => router.push('/officer/dashboard')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Office Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Office</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {OFFICES.map((office) => (
              <button
                key={office.id}
                onClick={() => setSelectedOffice(office.id)}
                className={`p-3 rounded-lg text-sm font-medium transition ${
                  selectedOffice === office.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {office.name}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Total Submissions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Approved</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 font-medium">Rejected</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.rejected}</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending ({statistics.pending})
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                viewMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
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
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          ) : visibleSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No {viewMode === 'pending' ? 'pending' : ''} submissions
              </h3>
              <p className="mt-2 text-gray-600">
                {viewMode === 'pending'
                  ? 'All submissions for this office have been reviewed!'
                  : 'No submissions found for this office.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visibleSubmissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {submission.studentName?.[0] || 'S'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{submission.studentName}</h3>
                          <p className="text-sm text-gray-600">{submission.studentMatricNumber}</p>
                        </div>
                      </div>

                      <div className="ml-13 space-y-2">
                        <div className="flex items-center space-x-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full font-medium ${
                              submission.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : submission.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {submission.status.toUpperCase()}
                          </span>
                          <span className="text-gray-500">
                            Submitted {formatDate(submission.submittedAt)}
                          </span>
                        </div>

                        {submission.documents.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Documents ({submission.documents.length}):
                            </p>
                            <div className="space-y-1">
                              {submission.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <span>{doc.fileName}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {submission.comment && (
                          <div className="bg-gray-100 rounded p-3">
                            <p className="text-xs font-medium text-gray-700">Comment:</p>
                            <p className="text-sm text-gray-900">{submission.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {submission.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => openModal(submission, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => openModal(submission, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {action === 'approve' ? '✓ Approve Submission' : '✗ Reject Submission'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Student Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSubmission.studentName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Matric Number:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSubmission.studentMatricNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Office:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedSubmission.officeName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === 'approve' ? (
                    <>
                      Comment <span className="text-gray-400">(Optional)</span>
                    </>
                  ) : (
                    <>
                      Reason for Rejection <span className="text-red-600">*</span>
                    </>
                  )}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || (action === 'reject' && !comment.trim())}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
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
    </div>
  );
}
