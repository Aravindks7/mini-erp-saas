import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface DocumentStepperProps {
  steps: Step[];
  currentStepId: string;
  className?: string;
}

/**
 * Premium Document Lifecycle Stepper.
 * Provides visual context for the "Digital Thread" (Industry Standard).
 */
export function DocumentStepper({ steps, currentStepId, className }: DocumentStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={cn('w-full py-4 px-2', className)}>
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <li
                key={step.id}
                className={cn('relative flex flex-1 items-center', !isLast && 'w-full')}
              >
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-8 right-0 top-4 h-0.5 transition-colors duration-500',
                      isCompleted ? 'bg-primary' : 'bg-muted',
                    )}
                    aria-hidden="true"
                  />
                )}

                <div className="group relative flex flex-col items-center">
                  <span className="flex h-8 items-center" aria-hidden="true">
                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                        isCompleted
                          ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]'
                          : isCurrent
                            ? 'bg-background border-primary'
                            : 'bg-background border-muted group-hover:border-muted-foreground',
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-primary-foreground animate-in zoom-in-50 duration-300" />
                      ) : (
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full transition-all duration-300',
                            isCurrent ? 'bg-primary' : 'bg-transparent',
                          )}
                        />
                      )}
                    </span>
                  </span>
                  <div className="absolute top-10 flex flex-col items-center min-w-[100px] text-center">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider transition-colors duration-300',
                        isCurrent || isCompleted ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-[9px] text-muted-foreground hidden sm:block whitespace-nowrap">
                        {step.description}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
