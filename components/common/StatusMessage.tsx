import React from 'react';
import { XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type: StatusType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  onDismiss,
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'rounded-md p-4 flex items-start space-x-3';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-[#8FD6E1]/20 text-[#150E56] border border-[#8FD6E1]`;
      case 'error':
        return `${baseStyles} bg-[#7B113A]/10 text-[#7B113A] border border-[#7B113A]/30`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-800 border border-yellow-200`;
      case 'info':
        return `${baseStyles} bg-[#1597BB]/10 text-[#1597BB] border border-[#1597BB]/30`;
    }
  };

  return (
    <div className={`${getStyles()} ${className}`} role="alert">
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default StatusMessage;