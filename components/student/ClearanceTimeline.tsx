'use client';

interface TimelineStep {
  step: {
    id: string;
    stepNumber: number;
    name: string;
    requiresPayment: boolean;
    paymentAmount?: number;
  };
  progress: {
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    updatedAt: Date;
  };
}

interface ClearanceTimelineProps {
  steps: TimelineStep[];
}

export default function ClearanceTimeline({ steps }: ClearanceTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4" style={{color:'#150E56'}}>Clearance Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        
        {steps.map((step, index) => (
          <div key={step.step.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline Dot */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${getStatusColor(step.progress.status)}`}>
              {getStatusIcon(step.progress.status)}
            </div>
            
            {/* Timeline Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Step {step.step.stepNumber}: {step.step.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.step.requiresPayment && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 mr-2">
                        💰 Payment Required
                      </span>
                    )}
                    Updated: {formatDate(step.progress.updatedAt)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.progress.status)}`}>
                  {step.progress.status.toUpperCase()}
                </span>
              </div>
              
              {step.progress.comment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Officer Comment:</strong> {step.progress.comment}
                  </p>
                </div>
              )}
              
              {step.step.requiresPayment && step.step.paymentAmount && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Payment Amount:</strong> ₦{step.step.paymentAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {steps.filter(s => s.progress.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {steps.filter(s => s.progress.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {steps.filter(s => s.progress.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
