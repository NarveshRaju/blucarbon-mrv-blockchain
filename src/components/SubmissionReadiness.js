import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { getSubmissionReadiness } from '../services/projectService';
import './SubmissionReadiness.css';

/**
 * SubmissionReadiness component.
 * Displays a real-time checklist and progress assessment before final submission.
 *
 * @param {object} props
 * @param {object} props.formData - Form data state
 * @param {Function} [props.onJumpToStep] - Handler to jump directly to a wizard step
 */
const SubmissionReadiness = ({ formData, onJumpToStep }) => {
  const readiness = getSubmissionReadiness(formData);

  return (
    <div className="submission-readiness-card">
      {/* Header & Score */}
      <div className="sr-header">
        <div className="sr-header-left">
          <div className={`sr-icon-circle ${readiness.isReady ? 'ready' : 'incomplete'}`}>
            {readiness.isReady ? <ShieldCheck size={22} /> : <FileCheck2 size={22} />}
          </div>
          <div>
            <h4>Project Submission Readiness</h4>
            <p>
              {readiness.isReady
                ? 'All mandatory MRV criteria have been fulfilled. Your project is ready for submission.'
                : `${readiness.totalCompleted} of ${readiness.totalCount} verification requirements completed.`}
            </p>
          </div>
        </div>

        <div className="sr-score-badge">
          <span className="sr-percent">{readiness.percentage}%</span>
          <span className="sr-score-label">Readiness</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="sr-progress-track">
        <div
          className={`sr-progress-fill ${readiness.isReady ? 'ready' : 'progress'}`}
          style={{ width: `${readiness.percentage}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="sr-checklist-grid">
        {readiness.checks.map((item) => (
          <div
            key={item.id}
            className={`sr-check-item ${item.isComplete ? 'complete' : item.isRequired ? 'missing-required' : 'missing-optional'}`}
            onClick={() => onJumpToStep && onJumpToStep(item.stepIndex)}
            role="button"
            tabIndex={0}
            title={`Click to edit: Step ${item.stepIndex + 1}`}
          >
            <div className="sr-check-status-icon">
              {item.isComplete ? (
                <CheckCircle2 size={18} className="text-success" />
              ) : item.isRequired ? (
                <AlertCircle size={18} className="text-danger" />
              ) : (
                <AlertTriangle size={18} className="text-warning" />
              )}
            </div>

            <div className="sr-check-content">
              <div className="sr-check-title-row">
                <strong>{item.title}</strong>
                {!item.isRequired && !item.isComplete && (
                  <span className="sr-optional-pill">Recommended</span>
                )}
                {item.isRequired && !item.isComplete && (
                  <span className="sr-required-pill">Required</span>
                )}
              </div>
              <p>{item.description}</p>
            </div>

            {onJumpToStep && (
              <span className="sr-jump-arrow">
                <ChevronRight size={16} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Summary Alert Notice */}
      {!readiness.isReady && (
        <div className="sr-warning-banner">
          <AlertCircle size={18} />
          <div>
            <strong>Action Required Before Submission:</strong>
            <p>
              Please complete the required sections highlighted above before submitting to the DAO verification queue.
            </p>
          </div>
        </div>
      )}

      {readiness.isReady && readiness.missingRequired.length === 0 && (
        <div className="sr-success-banner">
          <CheckCircle2 size={18} />
          <div>
            <strong>Verification Ready:</strong>
            <p>
              Your restoration coordinates, sapling counts, and baseline MRV values are validated and ready for DAO review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionReadiness;
