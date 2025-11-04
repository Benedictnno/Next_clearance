import React from 'react';

interface DocumentStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

export default function DocumentStatus({ status, comment }: DocumentStatusProps) {
  const statusColors = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: '⏳'
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: '✅'
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: '❌'
    }
  };

  const currentStatus = statusColors[status];

  return (
    <div className={`rounded-md p-3 ${currentStatus.bg} ${currentStatus.border} border mb-4`}>
      <div className="flex items-center">
        <span className="text-xl mr-2">{currentStatus.icon}</span>
        <div>
          <h4 className={`font-medium ${currentStatus.text}`}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </h4>
          {comment && <p className="text-sm mt-1">{comment}</p>}
        </div>
      </div>
    </div>
  );
}