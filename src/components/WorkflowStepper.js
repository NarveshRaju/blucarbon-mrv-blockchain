import React from 'react';
import './WorkflowStepper.css';

const WORKFLOW_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: '📝' },
  { key: 'under_review', label: 'Under Review', icon: '🔍' },
  { key: 'approved', label: 'Approved', icon: '✅' },
  { key: 'tokens_minted', label: 'Tokens Minted', icon: '🪙' },
  { key: 'listed', label: 'Listed for Sale', icon: '🏷️' },
];

/**
 * Determines current step index from project data
 */
const getStepIndex = (project) => {
  if (!project) return 0;

  const status = (project.status || 'Pending').toLowerCase();

  // Rejected is a terminal state — show step 2 with error
  if (status === 'rejected') return -1;

  // Check if listed for sale (has price set)
  if (project.price && project.price > 0 && project.totalTokens > 0) return 4;

  // Check if tokens have been minted (blockchainTx exists)
  if (project.blockchainTx) return 3;

  // Approved
  if (status === 'approved') return 2;

  // Pending = under review (someone has seen it)
  if (status === 'pending') return 1;

  // Default: just submitted
  return 0;
};

const WorkflowStepper = ({ project, compact = false }) => {
  const currentStep = getStepIndex(project);
  const isRejected = currentStep === -1;

  if (compact) {
    return (
      <div className="workflow-stepper-compact">
        {WORKFLOW_STEPS.map((step, index) => {
          let stepClass = 'step-dot';
          if (isRejected && index === 2) stepClass += ' rejected';
          else if (index < currentStep) stepClass += ' completed';
          else if (index === currentStep) stepClass += ' current';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass} title={step.label}>
                {index < currentStep ? '✓' : isRejected && index === 2 ? '✗' : ''}
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`step-line ${index < currentStep ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="workflow-stepper">
      {isRejected && (
        <div className="stepper-rejected-banner">
          ❌ Project was rejected during review
        </div>
      )}
      <div className="stepper-track">
        {WORKFLOW_STEPS.map((step, index) => {
          let stepClass = 'stepper-step';
          if (isRejected && index === 2) stepClass += ' rejected';
          else if (index < currentStep) stepClass += ' completed';
          else if (index === currentStep) stepClass += ' current';
          else stepClass += ' upcoming';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass}>
                <div className="step-circle">
                  {index < currentStep ? '✓' : isRejected && index === 2 ? '✗' : step.icon}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`stepper-connector ${index < currentStep ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
export { getStepIndex, WORKFLOW_STEPS };
