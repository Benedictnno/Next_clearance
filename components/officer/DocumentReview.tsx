import React, { useState } from 'react';
import { reviewDocument } from '../../lib/documentReview';

interface DocumentReviewProps {
  documentId: string;
  documentType: string;
  onReviewComplete?: () => void;
}

export default function DocumentReview({ 
  documentId, 
  documentType,
  onReviewComplete 
}: DocumentReviewProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReview = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const result = await reviewDocument(documentId, status, comment);
      
      if (result.success) {
        setMessage(result.message || `Document ${status} successfully`);
        if (onReviewComplete) {
          onReviewComplete();
        }
      } else {
        setError(result.error || 'Failed to process review');
      }
    } catch (err) {
      setError('An error occurred while processing the review');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium mb-3">Review {documentType}</h3>
      
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Add a comment about this document..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => handleReview('approved')}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => handleReview('rejected')}
          disabled={isSubmitting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      
      {message && (
        <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}