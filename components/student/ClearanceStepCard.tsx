'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/upload';

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

interface ClearanceStepCardProps {
  step: ClearanceStep;
  progress?: StepProgress;
  isCurrentStep: boolean;
  onDocumentSubmit: (stepId: string, documents: any[], comment?: string) => Promise<void>;
}

export default function ClearanceStepCard({
  step,
  progress,
  isCurrentStep,
  onDocumentSubmit
}: ClearanceStepCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload files
      const uploads = await Promise.all(
        files.map(file => uploadFile(file))
      );

      // Submit to API
      await onDocumentSubmit(
        step.id,
        uploads.map(upload => ({
          name: upload.originalName,
          type: upload.type || 'OTHER',
          url: upload.url
        })),
        comment
      );

      // Reset form
      setFiles([]);
      setComment('');
      setShowUploadSection(false);
    } catch (error) {
      console.error('Error submitting documents:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border-2 p-6 transition-all duration-200 ${
      isCurrentStep ? 'border-blue-500 shadow-lg' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            progress?.status === 'APPROVED' ? 'bg-green-100' :
            progress?.status === 'REJECTED' ? 'bg-red-100' :
            progress?.status === 'PENDING' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {progress?.status ? getStatusIcon(progress.status) : (
              <span className="text-sm font-semibold text-gray-600">{step.stepNumber}</span>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Step {step.stepNumber}: {step.name}
            </h3>
            {step.description && (
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            )}
            
            {/* Payment Info */}
            {step.requiresPayment && (
              <div className="mt-2 text-sm text-orange-600">
                💰 Payment Required: ₦{step.paymentAmount?.toLocaleString() || 'TBD'}
              </div>
            )}
            
            {/* Last Updated */}
            {progress?.actionedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(progress.actionedAt).toLocaleString()}
              </p>
            )}
            
            {/* Document Requirements */}
            <div className="mt-3 space-y-2">
              {step.requiresReceipt && (
                <div className="text-sm text-gray-700">
                  📄 <strong>Requires receipt:</strong> {step.receiptDescription || 'Payment receipt required'}
                </div>
              )}
              {step.supportingDocsDescription && (
                <div className="text-sm text-gray-700">
                  📎 <strong>Supporting docs:</strong> {step.supportingDocsDescription}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        {progress?.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(progress.status)}`}>
            {progress.status}
          </span>
        )}
      </div>

      {/* Comment from Officer */}
      {progress?.comment && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-700 mb-1">Officer Comment:</p>
          <p className="text-sm text-gray-600 italic">&ldquo;{progress.comment}&rdquo;</p>
        </div>
      )}

      {/* Uploaded Documents */}
      {progress?.documents && progress.documents.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
          <div className="space-y-2">
            {progress.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm text-gray-700">{doc.name}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {(isCurrentStep || progress?.status === 'REJECTED') && progress?.status !== 'APPROVED' && (
        <div>
          {!showUploadSection ? (
            <button
              onClick={() => setShowUploadSection(true)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {progress?.documents?.length ? 'Upload Additional Documents' : 'Upload Supporting Documents'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Supporting Documents
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {step.requiresReceipt && (
                  <p className="mt-1 text-xs text-orange-600">
                    📄 Please include your payment receipt
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information for the officer..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSubmit}
                  disabled={files.length === 0 || uploading}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Submitting...' : 'Submit for Review'}
                </button>
                <button
                  onClick={() => setShowUploadSection(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
