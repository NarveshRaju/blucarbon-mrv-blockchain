import React from 'react';
import {
  FileText,
  Send,
  Search,
  CheckCircle2,
  Vote,
  Coins,
  Clock,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import { getLifecycleStages, getStatusConfig } from '../utils/projectStatus';
import './ProjectLifecycle.css';

/**
 * ProjectLifecycle Component.
 * Displays the end-to-end lifecycle progression from draft to token minting.
 *
 * @param {object} props
 * @param {object|string} props.project - Project object or status string
 * @param {string} [props.className='']
 * @param {boolean} [props.compact=false] - Compact mode for list views
 */
const ProjectLifecycle = ({ project, className = '', compact = false }) => {
  const stages = getLifecycleStages(project);
  const statusConfig = getStatusConfig(project);

  const getStageIcon = (stageId, state) => {
    if (state === 'rejected') return <AlertTriangle size={15} />;
    if (state === 'completed') return <CheckCircle2 size={15} />;

    switch (stageId) {
      case 'draft':
        return <FileText size={15} />;
      case 'submitted':
        return <Send size={15} />;
      case 'ai_pre_verification':
      case 'ai_verification':
        return <BrainCircuit size={15} />;
      case 'validator_review':
      case 'under_verification':
        return <Search size={15} />;
      case 'dao_review':
      case 'approved':
        return <Vote size={15} />;
      case 'credit_issued':
        return <Coins size={15} />;
      default:
        return <Clock size={15} />;
    }
  };

  return (
    <div className={`project-lifecycle-container ${compact ? 'compact' : ''} ${className}`}>
      {/* Current Status Header Pill */}
      {!compact && (
        <div className="lifecycle-header-banner">
          <div className="lh-status-info">
            <span
              className="lh-status-pill"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
                borderColor: statusConfig.borderColor,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {getStageIcon(statusConfig.key, statusConfig.key === 'rejected' ? 'rejected' : statusConfig.key === 'approved' || statusConfig.key === 'credit_issued' ? 'completed' : 'current')}
              <span>{statusConfig.label}</span>
            </span>
            <p className="lh-status-desc">{statusConfig.description}</p>
          </div>
          <span className="lh-next-hint">
            <strong>Next:</strong> {statusConfig.nextAction}
          </span>
        </div>
      )}

      {/* Stepper Track */}
      <div className="lifecycle-track">
        {stages.map((stage, idx) => {
          const isCompleted = stage.state === 'completed';
          const isCurrent = stage.state === 'current';
          const isRejected = stage.state === 'rejected';

          return (
            <div
              key={stage.id}
              className={`lifecycle-step ${stage.state} ${isCurrent ? 'active-pulse' : ''}`}
            >
              {/* Connector Bar before dot */}
              {idx > 0 && (
                <div
                  className={`lifecycle-connector ${
                    isCompleted || isCurrent ? 'connector-filled' : 'connector-empty'
                  } ${isRejected ? 'connector-rejected' : ''}`}
                />
              )}

              {/* Step Node */}
              <div className="lifecycle-node">
                <div className={`lifecycle-circle ${stage.state}`}>
                  {getStageIcon(stage.id, stage.state)}
                </div>
                <div className="lifecycle-labels">
                  <span className="lifecycle-step-title">{stage.label}</span>
                  {!compact && stage.description && (
                    <span className="lifecycle-step-desc">{stage.description}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectLifecycle;
