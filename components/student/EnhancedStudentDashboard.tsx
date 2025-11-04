'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClearanceStepCard from './ClearanceStepCard';
import NotificationBell from '@/components/NotificationBell';

interface ClearanceStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  requiresPayment: boolean;
  paymentAmount?: number;
  requiresReceipt: boolean;
  receiptDescription?: string;
  supportingDocsDescription?: string;
  requiredDocuments?: string[];
}

interface StepProgress {
  id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  actionedAt?: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface ClearanceData {
  request: {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'REJECTED' | 'COMPLETED';
    currentStep: number;
  };
  steps: Array<{
    step: ClearanceStep;
    progress: StepProgress;
  }>;
  progressPercentage: number;
  isCompleted: boolean;
}

interface StudentProfile {
  firstName: string;
  lastName: string;
  matricNumber: string;
  email: string;
  department?: { name: string };
}

export default function EnhancedStudentDashboard() {
  const [loading, setLoading] = useState(false);
  const [clearanceData, setClearanceData] = useState<ClearanceData | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch student profile
      const profileRes = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/api/student/profile`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setStudentProfile(profileData.data);
      } else if (profileRes.status === 401 || profileRes.status === 403) {
        // Authentication error - user needs to log in
        console.error('Authentication error - redirecting to login');
        router.push('/auth/login');
        return;
      } else {
        console.error('Failed to fetch profile data, status:', profileRes.status);
        throw new Error('Failed to fetch student profile');
      }

      // Fetch clearance data
      const clearanceRes = await fetch('/api/student/clearance', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (clearanceRes.ok) {
        const data = await clearanceRes.json();
        setClearanceData(data);
      } else if (clearanceRes.status === 401 || clearanceRes.status === 403) {
        // Authentication error - user needs to log in
        console.error('Authentication error - redirecting to login');
        router.push('/auth/login');
        return;
      } else if (clearanceRes.status === 404) {
        // No clearance request yet
        setClearanceData(null);
      } else {
        console.error('Unexpected error status:', clearanceRes.status);
        setClearanceData(null); // Gracefully handle other errors
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const initiateClearance = async () => {
    setInitiating(true);
    try {
      const response = await fetch('/api/clearance/initiate', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate clearance');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error initiating clearance:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate clearance');
    } finally {
      setInitiating(false);
    }
  };

  const handleDocumentSubmit = async (stepId: string, documents: any[], comment?: string) => {
    try {
      const response = await fetch(`/api/student/clearance/step/${stepId}`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents,
          comment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit documents');
      }

      // Refresh clearance data
      await fetchData();
    } catch (err) {
      console.error('Error submitting documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit documents');
    }
  };

  const downloadClearanceSlip = async () => {
    try {
      const response = await fetch('/api/student/clearance-certificate', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `clearance-certificate-${studentProfile?.matricNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading certificate:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">Failed to load student profile</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {studentProfile.firstName}! ({studentProfile.matricNumber})
              </h1>
              <p className="text-gray-600 text-sm">
                Complete each step in order. Upload receipts where required
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={() => router.push('/auth/logout')}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Workflow Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex md:flex-row flex-col gap-4 items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">🎯 New: Office Clearance Workflow</h3>
              <p className="text-indigo-100 text-sm">
                Submit documents to 7 designated offices (Faculty Library, Sports, Hostel, Student Affairs, HOD, Dean, Bursary) and track your progress in real-time!
              </p>
            </div>
            <button
              onClick={() => router.push('/student/clearance-workflow')}
              className="ml-6  bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 font-bold transition shadow-md whitespace-nowrap"
            >
              Start Your Clearance →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!clearanceData ? (
              /* No Clearance Request */
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Start Your Clearance</h3>
                  <p className="mt-2 text-gray-600">
                    Begin your clearance process to complete your graduation requirements. 
                    This process involves approval from 7 different offices.
                  </p>
                </div>
                <button
                  // onClick={initiateClearance}
                  disabled={initiating}
                  className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {initiating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initiating...
                    </>
                  ) : (
                    'Initiate Clearance Request'
                  )}
                </button>
              </div>
            ) : (
              /* Clearance Steps */
              <div className="space-y-4">
                {clearanceData.steps.map((stepData, index) => (
                  <ClearanceStepCard
                    key={stepData.step.id}
                    step={stepData.step}
                    progress={stepData.progress}
                    isCurrentStep={stepData.step.stepNumber === clearanceData.request.currentStep}
                    onDocumentSubmit={handleDocumentSubmit}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Status</h3>
              
              {clearanceData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Currently on Step {clearanceData.request.currentStep}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${clearanceData.progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{clearanceData.progressPercentage}% Complete</p>
                  </div>

                  {clearanceData.isCompleted ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-medium">Clearance Complete!</span>
                      </div>
                      <button
                        onClick={downloadClearanceSlip}
                        className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Open Clearance Slip
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Continue uploading documents for pending steps
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No clearance request initiated yet</p>
              )}
            </div>

            {/* Process Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Clearance Process</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-green-600">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold">1</span>
                  Submit Request
                </div>
                <div className="flex items-center text-blue-600">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold">2</span>
                  10-Step Approval
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold">3</span>
                  Track Progress
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-xs font-semibold">4</span>
                  Download & Access
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Get approval from HOD, Faculty, Library, Bursary, Student Affairs, Security & Registry
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/student/clearance-workflow')}
                  className="w-full text-left p-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  📋 Office Clearance Workflow
                </button>
                <button
                  onClick={() => router.push('/student/slip')}
                  className="w-full text-left p-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  📄 View/Print Clearance Slip
                </button>
                <button
                  onClick={() => router.push('/student/nysc-info')}
                  className="w-full text-left p-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  📝 Fill NYSC Information
                </button>
                <button
                  onClick={() => router.push('/student/nysc-form')}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  🖨️ View/Print NYSC Form
                </button>
                <button
                  onClick={() => router.push('/student/profile')}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  👤 View Profile
                </button>
                <button
                  onClick={() => router.push('/student/notifications')}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  🔔 View Notifications
                </button>
                <button
                  onClick={() => fetchData()}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  🔄 Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
