import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from 'lib/utils';
import { InterviewStage, useInterviewFlow } from 'hooks/use-interview-flow';

interface BreadcrumbStep {
  id: InterviewStage;
  label: string;
  number: number;
}

const steps: BreadcrumbStep[] = [
  { id: 'details', label: 'Interview Details', number: 1 },
  { id: 'interview', label: 'Interview', number: 2 },
  { id: 'feedback', label: 'Feedback', number: 3 },
];

interface InterviewBreadcrumbsProps {
  currentStage: InterviewStage;
  showBackArrow?: boolean;
  className?: string;
}

export const InterviewBreadcrumbs: React.FC<InterviewBreadcrumbsProps> = ({
  currentStage,
  showBackArrow = false,
  className,
}) => {
  const navigate = useNavigate();
  const { resetFlow } = useInterviewFlow();

  const currentIndex = steps.findIndex(s => s.id === currentStage);

  const handleBackToDashboard = () => {
    resetFlow();
    navigate('/app/b2c/dashboard');
  };

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-center gap-2 md:gap-2 mb-6">
        {/* Back Arrow Button - Left of breadcrumbs */}
        {showBackArrow && (
          <button
            onClick={handleBackToDashboard}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 transition-colors mr-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumbs - Centered */}
        <nav aria-label="Interview Progress" className="flex-1">
          <ol className="flex items-center justify-center gap-2 sm:gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isLast = index === steps.length - 1;

              return (
                <li key={step.id} className="flex items-center">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                        status === 'completed' && 'bg-purple-600 text-white',
                        status === 'current' && 'bg-purple-600 text-white ring-4 ring-purple-100',
                        status === 'upcoming' && 'bg-zinc-200 text-zinc-500'
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium hidden sm:inline',
                        status === 'current' && 'text-purple-600',
                        status === 'completed' && 'text-zinc-700',
                        status === 'upcoming' && 'text-zinc-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="mx-2 sm:mx-4">
                      <ChevronRight
                        className={cn(
                          'w-5 h-5',
                          status === 'completed' || status === 'current'
                            ? 'text-purple-600'
                            : 'text-zinc-300'
                        )}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Spacer for symmetry when arrow is shown */}
        {showBackArrow && <div className="w-10" />}
      </div>

      {/* Mobile step label */}
      <div className="sm:hidden text-center mb-4">
        <span className="text-sm font-medium text-purple-600">
          Step {currentIndex + 1}: {steps[currentIndex]?.label}
        </span>
      </div>
    </div>
  );
};

export default InterviewBreadcrumbs;
