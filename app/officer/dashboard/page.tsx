'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface ClearanceSubmission {
  id: string;
  studentId: string;
  studentMatricNumber?: string;
  studentName?: string;
  officeId: string;
  officeName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export default function OfficerDashboard() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<ClearanceSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ClearanceSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [officerName, setOfficerName] = useState('');
  const router = useRouter();

  const fetchGlobalSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/officer/clearance-workflow/global');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data || []);
        setFilteredSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching global submissions:', error);
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
      }
    } catch (error) {
      console.error('Error fetching officer info:', error);
    }
  }, []);

  useEffect(() => {
    fetchGlobalSubmissions();
    fetchOfficerInfo();
  }, [fetchGlobalSubmissions, fetchOfficerInfo]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(
      (s) =>
        (s.studentName || '').toLowerCase().includes(query) ||
        (s.studentMatricNumber || '').toLowerCase().includes(query) ||
        (s.officeName || '').toLowerCase().includes(query)
    );
    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">University Clearance Tracking</h1>
              <p className="text-gray-600 mt-1">Hello, {officerName || 'Officer'} • Global View Mode</p>
            </div>
            <button
              onClick={() => router.push('/officer/clearance-workflow')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md flex items-center justify-center"
            >
              Go to My Active Workflow →
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by student name, matric number, or office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
            </div>
            <button
              onClick={() => fetchGlobalSubmissions()}
              className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center space-x-2"
            >
              <span>🔄 Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tracking Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">All Clearance Submissions</h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {filteredSubmissions.length} RESULTS
            </span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">🔎</div>
              <h3 className="text-xl font-semibold text-gray-900">No submissions found</h3>
              <p className="text-gray-500 mt-2">Adjust your search or wait for students to submit.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Current Office</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Submitted</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Reviewed At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {s.studentName?.[0] || 'S'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{s.studentName}</div>
                            <div className="text-xs text-gray-500 font-mono tracking-tighter">{s.studentMatricNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded border border-gray-200">
                          {s.officeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${s.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : s.status === 'approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(s.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                        {s.reviewedAt ? formatDate(s.reviewedAt) : 'Pending review'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

