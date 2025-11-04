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

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export default function ClearanceWorkflow() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ClearanceStatus | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
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
      // Fetch offices list
      const officesRes = await fetch('/api/student/clearance-workflow/offices');
      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData.data || []);
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
        throw new Error(data.error || data.details || 'Upload failed');
      }

      // Handle both single and multiple file uploads
      const uploadedData = Array.isArray(data.files) ? data.files : (data.data ? [data.data] : []);
      
      if (uploadedData.length === 0) {
        throw new Error('No files were uploaded');
      }
      
      const newFiles: UploadedFile[] = uploadedData.map((file: any) => ({
        fileName: file.fileName || file.originalName || file.name,
        fileUrl: file.url || file.fileUrl,
        fileType: file.mimeType || file.type || 'application/octet-stream',
      }));

      setUploadedFiles([...uploadedFiles, ...newFiles]);
      setSuccess(`Successfully uploaded ${newFiles.length} file(s)`);
      
      // Reset the file input
      e.target.value = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
      // Reset the file input even on error
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officeId: selectedOffice,
          documents: uploadedFiles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess('Documents submitted successfully!');
      setUploadedFiles([]);
      setSelectedOffice(null);
      
      // Refresh status
      await fetchData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error submitting documents:', err);
      setError(err.message || 'Failed to submit documents');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '✗';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clearance workflow...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Clearance Workflow</h1>
              <p className="text-gray-600 text-sm">Submit documents to all 7 offices for approval</p>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-green-700">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Office List */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOffice && (
              <div className="bg-white rounded-lg shadow-md p-6 lg:hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Submit Documents to{' '}
                  {status?.offices.find((o) => o.officeId === selectedOffice)?.officeName}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload-mobile"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor="file-upload-mobile"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg
                          className="w-12 h-12 text-gray-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {uploading ? 'Uploading...' : 'Tap to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <svg
                                className="w-5 h-5 text-indigo-600"
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
                              <span className="text-sm text-gray-900">{file.fileName}</span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || uploadedFiles.length === 0}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submitting ? 'Submitting...' : 'Submit Documents'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ten Clearance Offices</h2>
              
              <div className="space-y-4">
                {status?.offices.map((office) => (
                  <div
                    key={office.officeId}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      getStatusColor(office.status)
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getStatusIcon(office.status)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {office.stepNumber}. {office.officeName}
                            </h3>
                            <p className="text-sm mt-1 capitalize">
                              Status: <span className="font-medium">{office.status.replace('_', ' ')}</span>
                            </p>
                          </div>
                        </div>

                        {office.comment && (
                          <div className="mt-3 bg-white bg-opacity-50 rounded p-3">
                            <p className="text-xs font-medium text-gray-700">Officer&apos;s Comment:</p>
                            <p className="text-sm text-gray-900">{office.comment}</p>
                          </div>
                        )}

                        {office.submittedAt && (
                          <p className="text-xs text-gray-600 mt-2">
                            Submitted: {new Date(office.submittedAt).toLocaleString()}
                          </p>
                        )}

                        {office.reviewedAt && (
                          <p className="text-xs text-gray-600">
                            Reviewed: {new Date(office.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div>
                        {office.status === 'not_started' || office.status === 'rejected' ? (
                          <button
                            onClick={() => setSelectedOffice(office.officeId)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                          >
                            {office.status === 'rejected' ? 'Resubmit' : 'Submit'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            {selectedOffice && (
              <div className="bg-white rounded-lg shadow-md p-6 hidden lg:block">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Submit Documents to{' '}
                  {status?.offices.find((o) => o.officeId === selectedOffice)?.officeName}
                </h3>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg
                          className="w-12 h-12 text-gray-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG, DOC up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-3">
                              <svg
                                className="w-5 h-5 text-indigo-600"
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
                              <span className="text-sm text-gray-900">{file.fileName}</span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedOffice(null);
                        setUploadedFiles([]);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || uploadedFiles.length === 0}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submitting ? 'Submitting...' : 'Submit Documents'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${status?.overallProgress || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center font-medium">
                  {status?.overallProgress || 0}% Complete
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">
                    {status?.offices.filter((o) => o.status === 'approved').length || 0} / 10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">
                    {status?.offices.filter((o) => o.status === 'pending').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Started:</span>
                  <span className="font-semibold text-gray-600">
                    {status?.offices.filter((o) => o.status === 'not_started').length || 0}
                  </span>
                </div>
              </div>

              {status?.isCompleted && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-green-800 font-semibold">All Approved!</span>
                  </div>
                  <button
                    onClick={() => router.push('/student/slip')}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Download Clearance Forms
                  </button>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3">📌 Important Notes</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Upload clear, legible documents</li>
                <li>• Ensure all required receipts are included</li>
                <li>• You can resubmit if rejected</li>
                <li>• All 10 offices must approve to access final forms</li>
                <li>• Check notifications for updates</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/student/slip')}
                  className="w-full text-left p-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                >
                  📄 View/Print Clearance Slip
                </button>
                <button
                  onClick={() => router.push('/student/nysc-info')}
                  className="w-full text-left p-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                >
                  📝 Fill NYSC Information
                </button>
                <button
                  onClick={() => router.push('/student/nysc-form')}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  🖨️ View/Print NYSC Form
                </button>
                <button
                  onClick={() => fetchData()}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  🔄 Refresh Status
                </button>
                <button
                  onClick={() => router.push('/student/notifications')}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  🔔 View Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
