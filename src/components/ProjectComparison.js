import React from 'react';
import { Link } from 'react-router-dom';
import { Modal, StatusBadge } from './ui';
import { normalizeProjectForExplorer } from '../utils/projectExplorerUtils';
import { formatProjectId } from '../utils/projectStatus';
import { X, ExternalLink, Activity, MapPin, CheckCircle2 } from 'lucide-react';
import './ProjectComparison.css';

/**
 * ProjectComparison Component.
 * Side-by-side comparative analysis of up to 3 selected blue carbon projects.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Array<object>} props.projects - Selected projects array
 * @param {Function} props.onRemoveProject
 */
const ProjectComparison = ({
  isOpen,
  onClose,
  projects = [],
  onRemoveProject,
}) => {
  if (!isOpen) return null;

  const normalizedProjects = projects.map(normalizeProjectForExplorer);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Blue Carbon Projects"
      size="xl"
    >
      <div className="project-comparison-modal-content">
        <p className="pcm-intro">
          Evaluating {normalizedProjects.length} selected project{normalizedProjects.length > 1 ? 's' : ''} across ecological, MRV, and verification dimensions:
        </p>

        {normalizedProjects.length === 0 ? (
          <div className="pcm-empty">
            <p>No projects currently selected for comparison. Check the "Compare" box on any project card.</p>
          </div>
        ) : (
          <div className="pcm-table-wrapper">
            <table className="pcm-table">
              <thead>
                <tr>
                  <th className="pcm-metric-col">Metric / Dimension</th>
                  {normalizedProjects.map((p) => {
                    const pid = p.projectId || p._id || p.id;
                    return (
                      <th key={pid} className="pcm-project-col">
                        <div className="pcm-col-header">
                          <div>
                            <span className="pcm-pid">{formatProjectId(pid)}</span>
                            <strong className="pcm-pname">{p.name}</strong>
                          </div>
                          {onRemoveProject && (
                            <button
                              type="button"
                              className="pcm-remove-btn"
                              onClick={() => onRemoveProject(pid)}
                              title="Remove from comparison"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* 1. Status & Lifecycle */}
                <tr>
                  <td className="pcm-metric-title">Verification Status</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}><StatusBadge status={p.rawStatus} /></td>
                  ))}
                </tr>

                {/* 2. MRV Status */}
                <tr>
                  <td className="pcm-metric-title">MRV Maturity</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>
                      <span className={`mrv-lifecycle-pill ${p.mrvStatus.color}`}>
                        <Activity size={12} /> {p.mrvStatus.label}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 3. Location */}
                <tr>
                  <td className="pcm-metric-title">Location</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {p.location}</td>
                  ))}
                </tr>

                {/* 4. Ecosystem */}
                <tr>
                  <td className="pcm-metric-title">Ecosystem Type</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>{p.plantationType}</td>
                  ))}
                </tr>

                {/* 5. Area */}
                <tr>
                  <td className="pcm-metric-title">Project Area</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}><strong>{p.areaHectares} ha</strong></td>
                  ))}
                </tr>

                {/* 6. Saplings */}
                <tr>
                  <td className="pcm-metric-title">Saplings Planted</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>{p.saplings?.toLocaleString()} trees</td>
                  ))}
                </tr>

                {/* 7. Baseline Biomass */}
                <tr>
                  <td className="pcm-metric-title">Baseline Biomass</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>{p.biomass} t/ha</td>
                  ))}
                </tr>

                {/* 8. Carbon Stock */}
                <tr>
                  <td className="pcm-metric-title">Carbon Stock Pool</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}><strong>{p.carbonStock} tCO₂e</strong></td>
                  ))}
                </tr>

                {/* 9. Sequestration Rate */}
                <tr>
                  <td className="pcm-metric-title">Sequestration Rate</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>{p.sequestrationRate} tCO₂e/yr</td>
                  ))}
                </tr>

                {/* 10. Evidence Files */}
                <tr>
                  <td className="pcm-metric-title">Field Evidence</td>
                  {normalizedProjects.map((p) => (
                    <td key={p.id}>
                      {p.evidenceCount > 0 ? (
                        <span className="text-success font-semibold"><CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {p.evidenceCount} File{p.evidenceCount > 1 ? 's' : ''} Attached</span>
                      ) : (
                        <span className="text-muted">No evidence attached</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 11. Actions */}
                <tr className="pcm-actions-row">
                  <td className="pcm-metric-title">Action</td>
                  {normalizedProjects.map((p) => {
                    const pid = p.projectId || p._id || p.id;
                    return (
                      <td key={p.id}>
                        <Link
                          to={`/project/${pid}`}
                          className="bc-btn bc-btn--primary bc-btn--sm"
                          onClick={onClose}
                        >
                          View Project <ExternalLink size={12} />
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProjectComparison;
