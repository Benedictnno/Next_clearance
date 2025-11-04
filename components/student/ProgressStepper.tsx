'use client';

interface ProgressStep {
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

interface ProgressStepperProps {
  steps: ProgressStep[];
  currentStep?: number;
}

export default function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  const getStepStatus = (step: ProgressStep, index: number) => {
    if (step.progress.status === 'approved') return 'completed';
    if (step.progress.status === 'rejected') return 'rejected';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: ProgressStep, index: number) => {
    const status = getStepStatus(step, index);
    
    switch (status) {
      case 'completed':
        return '✓';
      case 'rejected':
        return '✗';
      case 'current':
        return index + 1;
      default:
        return index + 1;
    }
  };

  const getStepColor = (step: ProgressStep, index: number) => {
    const status = getStepStatus(step, index);
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'current':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.step.id} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium ${getStepColor(step, index)}`}>
              {getStepIcon(step, index)}
            </div>
            
            {/* Step Info */}
            <div className="mt-2 text-center max-w-32">
              <p className="text-xs font-medium text-gray-900 truncate">
                {step.step.name}
              </p>
              <p className="text-xs text-gray-500">
                Step {step.step.stepNumber}
                {step.step.requiresPayment && ' • Payment'}
              </p>
              {step.progress.status === 'rejected' && step.progress.comment && (
                <p className="text-xs text-red-600 mt-1 truncate" title={step.progress.comment}>
                  {step.progress.comment}
                </p>
              )}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                getStepStatus(step, index) === 'completed' ? 'bg-green-300' : 'bg-gray-300'
              }`} style={{ transform: 'translateX(50%)' }} />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {steps.filter(s => s.progress.status === 'approved').length} / {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.round((steps.filter(s => s.progress.status === 'approved').length / steps.length) * 100)}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
