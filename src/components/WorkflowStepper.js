import React from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Coins,
  Tag,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { normalizeStatus } from '../utils/projectStatus';
import './WorkflowStepper.css';

export const WORKFLOW_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: <FileText size={14} /> },
  { key: 'under_verification', label: 'Verification', icon: <Search size={14} /> },
  { key: 'approved', label: 'Approved', icon: <CheckCircle2 size={14} /> },
  { key: 'tokens_minted', label: 'Tokens Minted', icon: <Coins size={14} /> },
  { key: 'listed', label: 'Listed for Sale', icon: <Tag size={14} /> },
];

/**
 * Determines exact workflow state for each step index:
 * 'completed' | 'current' | 'upcoming' | 'rejected'
 *
 * Single source of truth guaranteeing "Approved" shows consistent certification state.
 *
 * @param {number} stepIndex - Index 0..4
 * @param {object} project - Project object
 * @returns {'completed'|'current'|'upcoming'|'rejected'}
 */
export const getStepState = (stepIndex, project) => {
  if (!project) return stepIndex === 0 ? 'current' : 'upcoming';

  const norm = normalizeStatus(project);
  const isRejected = norm === 'rejected';
  const hasListed =
    (project.price > 0 && (project.totalTokens > 0 || project.saplingsPlanted > 0)) ||
    (project.costPerToken > 0);
  const hasMinted =
    norm === 'credit_issued' ||
    Boolean(project.blockchainTx) ||
    hasListed;
  const isApproved = norm === 'approved' || hasMinted;

  if (isRejected) {
    if (stepIndex < 1) return 'completed';
    if (stepIndex === 1) return 'rejected';
    return 'upcoming';
  }

  if (hasListed) {
    return 'completed';
  }

  if (hasMinted) {
    if (stepIndex <= 3) return 'completed';
    if (stepIndex === 4) return 'current';
    return 'upcoming';
  }

  if (isApproved) {
    // Submitted, Verification, and Approved milestones are all completed!
    if (stepIndex <= 2) return 'completed';
    if (stepIndex === 3) return 'current';
    return 'upcoming';
  }

  // Pending / Under Verification / Submitted
  if (stepIndex === 0) return 'completed';
  if (stepIndex === 1) return 'current';
  return 'upcoming';
};

const WorkflowStepper = ({ project, compact = false }) => {
  const normStatus = normalizeStatus(project);
  const isRejected = normStatus === 'rejected';

  if (compact) {
    return (
      <div className="workflow-stepper-compact">
        {WORKFLOW_STEPS.map((step, index) => {
          const state = getStepState(index, project);
          let stepClass = 'step-dot';
          if (state === 'rejected') stepClass += ' rejected';
          else if (state === 'completed') stepClass += ' completed';
          else if (state === 'current') stepClass += ' current';

          const isConnectorCompleted =
            state === 'completed' &&
            getStepState(index + 1, project) === 'completed';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass} title={step.label}>
                {state === 'completed' ? <Check size={10} /> : state === 'rejected' ? <X size={10} /> : ''}
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`step-line ${isConnectorCompleted ? 'completed' : ''}`} />
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
          <AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Project was rejected during review
        </div>
      )}
      <div className="stepper-track">
        {WORKFLOW_STEPS.map((step, index) => {
          const state = getStepState(index, project);
          let stepClass = 'stepper-step';
          if (state === 'rejected') stepClass += ' rejected';
          else if (state === 'completed') stepClass += ' completed';
          else if (state === 'current') stepClass += ' current';
          else stepClass += ' upcoming';

          const isConnectorCompleted =
            state === 'completed' &&
            getStepState(index + 1, project) === 'completed';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass}>
                <div className="step-circle">
                  {state === 'completed'
                    ? <Check size={14} />
                    : state === 'rejected'
                    ? <X size={14} />
                    : step.icon}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={`stepper-connector ${
                    isConnectorCompleted ? 'completed' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
