"use client";

import { useState } from 'react';

export default function DocumentUploadForm({ stepId, requiresPayment, onSuccess }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/api/student/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred');
    }
  }

  return (
    <div className="mt-4">
      {status === 'success' && (
        <div className="bg-green-50 text-green-800 p-3 rounded mb-3 border border-green-200">
          {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 text-red-800 p-3 rounded mb-3 border border-red-200">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="hidden" name="step_id" value={stepId} />
        <label className="block text-xs text-gray-600 mb-1">
          {requiresPayment ? 'Upload Receipt (PDF/JPG/PNG)' : 'Upload Supporting Doc'}
        </label>
        <input 
          type="file" 
          name="file" 
          className="w-full rounded border p-2 text-sm" 
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp" 
          required 
        />
        <button 
          type="submit" 
          className="mt-3 w-full rounded bg-[#7B113A] text-white py-2 text-sm"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Uploading...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}