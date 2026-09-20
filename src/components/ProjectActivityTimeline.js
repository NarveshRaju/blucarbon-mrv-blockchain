import React, { useMemo } from 'react';
import {
  Clock,
  MapPin,
  UploadCloud,
  Activity,
  Send,
  CheckCircle2,
  XCircle,
  User,
  Calendar
} from 'lucide-react';
import { getProjectActivity } from '../services/projectService';
import './ProjectActivityTimeline.css';

/**
 * ProjectActivityTimeline Component.
 * Displays the immutable historical event log and verification audit trail for a project.
 *
 * @param {object} props
 * @param {string} props.projectId
 * @param {object} [props.project]
 * @param {number} [props.limit]
 */
const ProjectActivityTimeline = ({ projectId, project = null, limit = null }) => {
  const activities = useMemo(() => {
    const list = getProjectActivity(projectId, project);
    return limit ? list.slice(0, limit) : list;
  }, [projectId, project, limit]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'project_created':
        return <MapPin size={15} />;
      case 'evidence_uploaded':
        return <UploadCloud size={15} />;
      case 'baseline_recorded':
        return <Activity size={15} />;
      case 'submitted_for_review':
        return <Send size={15} />;
      case 'validator_approved':
        return <CheckCircle2 size={15} />;
      case 'validator_rejected':
        return <XCircle size={15} />;
      default:
        return <Clock size={15} />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Recent';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="project-activity-timeline-card">
      <div className="pat-header">
        <div className="pat-title-wrap">
          <Clock size={18} className="text-primary" />
          <h4>Project Verification & Activity Audit Log</h4>
        </div>
        <span className="pat-count-badge">
          {activities.length} Recorded Events
        </span>
      </div>

      <div className="pat-timeline-list">
        {activities.map((act, index) => (
          <div key={act.id || index} className={`pat-timeline-entry ${act.status || 'completed'}`}>
            {/* Timeline track line & icon node */}
            <div className="pat-node-col">
              <div className={`pat-icon-bubble ${act.type}`}>
                {getActivityIcon(act.type)}
              </div>
              {index < activities.length - 1 && <div className="pat-line" />}
            </div>

            {/* Content info */}
            <div className="pat-content">
              <div className="pat-entry-header">
                <strong className="pat-entry-title">{act.title}</strong>
                <span className="pat-entry-time">
                  <Calendar size={12} /> {formatTimestamp(act.timestamp)}
                </span>
              </div>

              <p className="pat-entry-desc">{act.description}</p>

              {act.actor && (
                <span className="pat-entry-actor">
                  <User size={11} /> {act.actor}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectActivityTimeline;
