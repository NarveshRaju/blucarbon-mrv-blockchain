import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { useRole } from '../RoleContext';
import WorkflowStepper from '../components/WorkflowStepper';
import './Verification.css';

const Verification = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const { role, ROLES } = useRole();

  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to fetch projects:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        p.projectName?.toLowerCase().includes(term) ||
        p.ngoId?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    pending: projects.filter(p => p.status === 'Pending').length,
    approved: projects.filter(p => p.status === 'Approved').length,
    rejected: projects.filter(p => p.status === 'Rejected').length,
  }), [projects]);

  const isValidator = role === ROLES.VALIDATOR || role === ROLES.ADMIN;

  return (
    <div className="verification-container">
      {/* Role Banner */}
      {isValidator && (
        <div className="validator-banner">
          <span>🔍</span>
          <div>
            <strong>Validator Review Mode</strong>
            <p>Review project submissions, verify data, and vote to approve or reject.</p>
          </div>
        </div>
      )}

      {!isValidator && role && (
        <div className="viewer-banner">
          <span>ℹ️</span>
          <p>You're viewing as <strong>{role}</strong>. Only Validators can approve/reject projects.
            <Link to="/profile"> Switch role →</Link>
          </p>
        </div>
      )}

      <header className="page-header">
        <div>
          <h1>Verification Queue</h1>
          <p>{stats.pending} projects pending review • {projects.length} total submissions</p>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="verify-stats">
        <button
          className={`verify-stat-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <span className="vs-count">{stats.pending}</span>
          <span className="vs-label">Pending</span>
        </button>
        <button
          className={`verify-stat-btn ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          <span className="vs-count">{stats.approved}</span>
          <span className="vs-label">Approved</span>
        </button>
        <button
          className={`verify-stat-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          <span className="vs-count">{stats.rejected}</span>
          <span className="vs-label">Rejected</span>
        </button>
        <button
          className={`verify-stat-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <span className="vs-count">{projects.length}</span>
          <span className="vs-label">All</span>
        </button>
      </div>

      <div className="filter-container">
        <input
          type="search"
          placeholder="Search by project name, NGO, or location..."
          className="filter-search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="projects-list">
        {loading ? (
          <p>Loading projects...</p>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => (
            <div key={project.projectId || index} className="verification-card">
              <div className="card-main-info">
                <div className="vc-header">
                  <h2>{project.projectName}</h2>
                  <span className={`status-tag ${(project.status || 'Pending').toLowerCase()}`}>
                    {project.status || 'Pending'}
                  </span>
                </div>
                <p className="organization">{project.ngoId}</p>
                <div className="project-meta">
                  <span>📍 {project.location}</span>
                  <span>🌿 {project.plantationType}</span>
                  <span>🌲 {(project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()} trees</span>
                  <span>🗓️ {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>

                {/* Workflow Stepper */}
                <WorkflowStepper project={project} compact />
              </div>

              <div className="card-actions">
                <Link to={`/project/${project.projectId || project._id}`} className="review-button">
                  {isValidator && project.status === 'Pending' ? '🔍 Review & Vote' : '👁️ View Details'}
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No {statusFilter !== 'all' ? statusFilter : ''} projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;