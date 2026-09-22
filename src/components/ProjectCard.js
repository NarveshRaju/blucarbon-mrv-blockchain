import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, TreePine, Leaf, Eye } from 'lucide-react';
import { getProjectJourney } from '../utils/projectJourney';
import { normalizeProjectForExplorer } from '../utils/projectExplorerUtils';
import { formatProjectId } from '../utils/projectStatus';
import './ProjectCard.css';

/**
 * Reusable project card for displaying project summaries.
 *
 * Gracefully handles missing fields — renders only what is available.
 * Does NOT invent or default values for fields the backend hasn't provided.
 *
 * @param {object} props
 * @param {object} props.project - Project data object
 * @param {boolean} [props.showViewButton=true]
 * @param {string} [props.linkPrefix='/project'] - Link path prefix
 * @param {string} [props.className]
 * @param {Function} [props.onClick]
 * @param {boolean} [props.isSelectable=false] - Allows comparison selection
 * @param {boolean} [props.isSelected=false]
 * @param {Function} [props.onToggleSelect]
 */
const ProjectCard = ({
  project,
  showViewButton = true,
  linkPrefix = '/project',
  className = '',
  onClick,
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
}) => {
  if (!project) return null;

  const normalized = normalizeProjectForExplorer(project);
  const id = normalized.id;
  const name = normalized.name;
  const saplings = normalized.saplings;
  const imageUrl = normalized.imageUrl;
  const mrvStatus = normalized.mrvStatus;

  return (
    <div className={`project-card ${className}`} onClick={onClick}>
      {/* Image area */}
      <div className="project-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <div className="project-card__image-placeholder">
            <Leaf size={32} />
          </div>
        )}
        {project.status && (
          <div className="project-card__status-overlay">
            <span>{getProjectJourney(project).label}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="project-card__content">
        <div className="project-card__title-row">
          <div>
            <span className="project-card__pid">{formatProjectId(id)}</span>
            <h3 className="project-card__name">{name}</h3>
            <p>{getProjectJourney(project).next}</p>
          </div>
          <div className="project-card__badges">
            <span className={`project-card__evidence-badge ${normalized.evidenceCount > 0 ? 'has-evidence' : 'no-evidence'}`}>
              {normalized.evidenceCount > 0
                ? `${normalized.evidenceCount} evidence file${normalized.evidenceCount > 1 ? 's' : ''}`
                : 'No evidence'}
            </span>
            <span className={`project-card__mrv-pill ${mrvStatus.color}`}>
              {mrvStatus.label}
            </span>
          </div>
        </div>

        <div className="project-card__meta">
          {normalized.location && (
            <span className="project-card__meta-item">
              <MapPin size={14} /> {normalized.location}
            </span>
          )}
          {normalized.plantationType && (
            <span className="project-card__meta-item">
              <Leaf size={14} /> {normalized.plantationType}
            </span>
          )}
          {saplings != null && (
            <span className="project-card__meta-item">
              <TreePine size={14} /> {saplings.toLocaleString()} trees
            </span>
          )}
        </div>

        {/* Extended Environmental Metrics */}
        <div className="project-card__extended">
          <div className="project-card__extended-item">
            <span className="project-card__extended-label">Area</span>
            <span className="project-card__extended-value">{normalized.areaHectares} ha</span>
          </div>
          <div className="project-card__extended-item">
            <span className="project-card__extended-label">Est. Carbon</span>
            <span className="project-card__extended-value">{normalized.carbonStock} tCO₂e</span>
          </div>
          <div className="project-card__extended-item">
            <span className="project-card__extended-label">Biomass</span>
            <span className="project-card__extended-value">{normalized.biomass} t/ha</span>
          </div>
        </div>
      </div>

      {/* Footer with view button and optional compare selection */}
      <div className="project-card__footer">
        {isSelectable && (
          <label className="project-card__compare-toggle" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect && onToggleSelect(project)}
            />
            <span>Compare</span>
          </label>
        )}

        {showViewButton && id && (
          <Link to={`${linkPrefix}/${id}`} className="project-card__view-btn">
            <Eye size={16} /> View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
