import React from 'react';
import { Check } from 'lucide-react';
import './StepWizard.css';

/**
 * Generic multi-step wizard component.
 * Contains NO project-specific logic — purely handles step navigation and display.
 *
 * @param {object} props
 * @param {Array<{key: string, label: string, icon?: React.ReactNode}>} props.steps - Step definitions
 * @param {number} props.activeStep - Current active step index (0-based)
 * @param {Function} props.onNext - Called when Next button is clicked
 * @param {Function} props.onPrev - Called when Previous button is clicked
 * @param {Function} [props.onSubmit] - Called when Submit button is clicked (on final step)
 * @param {boolean} [props.canProceed=true] - Whether the Next/Submit button is enabled
 * @param {boolean} [props.isSubmitting=false] - Shows loading state on submit button
 * @param {string} [props.submitLabel='Submit'] - Label for the final step button
 * @param {string} [props.nextLabel='Next'] - Label for the next button
 * @param {string} [props.prevLabel='Back'] - Label for the previous button
 * @param {React.ReactNode} props.children - Content for the active step
 * @param {string} [props.className]
 */
const StepWizard = ({
  steps,
  activeStep,
  onNext,
  onPrev,
  onSubmit,
  canProceed = true,
  isSubmitting = false,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  prevLabel = 'Back',
  children,
  className = '',
}) => {
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className={`step-wizard ${className}`}>
      {/* Step indicator bar */}
      <div className="step-wizard__header">
        {steps.map((step, index) => {
          let stepClass = 'step-wizard__step';
          if (index < activeStep) stepClass += ' step-wizard__step--completed';
          else if (index === activeStep) stepClass += ' step-wizard__step--active';
          else stepClass += ' step-wizard__step--upcoming';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass}>
                <div className="step-wizard__step-circle">
                  {index < activeStep ? (
                    <Check size={16} />
                  ) : (
                    step.icon || <span>{index + 1}</span>
                  )}
                </div>
                <span className="step-wizard__step-label">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`step-wizard__connector ${
                    index < activeStep ? 'step-wizard__connector--completed' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="step-wizard__content">
        {children}
      </div>

      {/* Navigation buttons */}
      <div className="step-wizard__footer">
        <button
          type="button"
          className="bc-btn bc-btn--secondary"
          onClick={onPrev}
          disabled={isFirstStep}
          style={isFirstStep ? { visibility: 'hidden' } : undefined}
        >
          {prevLabel}
        </button>

        {isLastStep ? (
          <button
            type="button"
            className="bc-btn bc-btn--primary"
            onClick={onSubmit}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            className="bc-btn bc-btn--primary"
            onClick={onNext}
            disabled={!canProceed}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepWizard;
