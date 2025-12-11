'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ActivityItem {
  id: string;
  stepNumber: number;
  stepName: string;
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
  actionedAt: string;
  student: {
    firstName: string;
    lastName: string;
    matricNumber: string;
    department?: { name: string };
  };
}

export default function OfficerHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    // Filter by status
    if (filter !== 'ALL') {
      filtered = filtered.filter((item) => item.status === filter);
    }

    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'TODAY':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item) => new Date(item.actionedAt) >= today);
        break;
      case 'WEEK':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((item) => new Date(item.actionedAt) >= weekAgo);
        break;
      case 'MONTH':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((item) => new Date(item.actionedAt) >= monthAgo);
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.student.firstName.toLowerCase().includes(query) ||
          item.student.lastName.toLowerCase().includes(query) ||
          item.student.matricNumber.toLowerCase().includes(query)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filter, searchQuery, dateRange]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/officer/history');
      const data = await res.json();
      setActivities(data.data || []);
      setFilteredActivities(data.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-dark-700 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-200">
      {/* Gradient Ribbon Header */}
      <div className="gradient-ribbon h-2"></div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-soft-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h2 text-primary-500 font-semibold">Activity History</h1>
              <p className="text-label text-dark-600 mt-1">Review your past clearance decisions</p>
            </div>
            <button
              onClick={() => router.push('/officer/clearance-workflow')}
              className="btn-accent"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card glow-on-hover border-l-4 border-secondary-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Total Actions</p>
            <p className="text-h1 text-dark-900 font-bold mt-2">{filteredActivities.length}</p>
          </div>
          <div className="card glow-on-hover border-l-4 border-green-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Approved</p>
            <p className="text-h1 text-green-600 font-bold mt-2">
              {filteredActivities.filter((a) => a.status === 'APPROVED').length}
            </p>
          </div>
          <div className="card glow-on-hover border-l-4 border-accent-500">
            <p className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Rejected</p>
            <p className="text-h1 text-accent-600 font-bold mt-2">
              {filteredActivities.filter((a) => a.status === 'REJECTED').length}
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
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
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="input-field"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h3 text-primary-500 font-semibold">
              Activity Timeline ({filteredActivities.length})
            </h2>
            <button onClick={fetchHistory} className="btn-secondary text-sm">
              🔄 Refresh
            </button>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-soft-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-body font-semibold text-dark-900">No activities found</h3>
              <p className="mt-2 text-label text-dark-600">
                {searchQuery || filter !== 'ALL' || dateRange !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Start reviewing clearance requests to see your activity here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative p-6 bg-soft-100 rounded-lg border-2 border-soft-400 hover:border-secondary-300 transition-all duration-120"
                >
                  {/* Timeline line */}
                  {index !== filteredActivities.length - 1 && (
                    <div className="absolute left-9 top-20 bottom-0 w-0.5 bg-soft-400"></div>
                  )}

                  <div className="flex space-x-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.status === 'APPROVED'
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-accent-100 border-2 border-accent-500'
                          }`}
                      >
                        <span className="text-2xl">
                          {activity.status === 'APPROVED' ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full font-medium text-label ${activity.status === 'APPROVED'
                                ? 'badge-approved'
                                : 'badge-rejected'
                              }`}
                          >
                            {activity.status}
                          </span>
                          <span className="ml-3 text-label text-dark-500 font-mono">
                            {new Date(activity.actionedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-soft-400">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-mist-400 rounded-full flex items-center justify-center shadow-glow">
                            <span className="text-white font-bold">
                              {activity.student.firstName[0]}{activity.student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-dark-900 text-body">
                              {activity.student.firstName} {activity.student.lastName}
                            </p>
                            <p className="data-field inline-block">{activity.student.matricNumber}</p>
                            {activity.student.department && (
                              <span className="ml-2 text-label text-dark-600">
                                • {activity.student.department.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-label text-dark-600 mt-2">
                          <span className="font-semibold">Step {activity.stepNumber}:</span> {activity.stepName}
                        </p>

                        {activity.comment && (
                          <div className="mt-3 p-3 bg-soft-200 rounded border border-soft-400">
                            <p className="text-label-sm font-medium text-dark-700 mb-1">
                              {activity.status === 'APPROVED' ? 'Comment:' : 'Reason:'}
                            </p>
                            <p className="text-label text-dark-900 italic">
                              "{activity.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Gradient */}
      <div className="gradient-ribbon h-2 mt-12"></div>
    </div>
  );
}