import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Info, MapPin, Sprout, Trees, Calendar, Eye, BrainCircuit, Satellite } from 'lucide-react';
import { useRole } from '../RoleContext';
import { getProjects } from '../services/projectService';
import { getStatusConfig, normalizeStatus } from '../utils/projectStatus';
import ProjectLifecycle from '../components/ProjectLifecycle';
import './Verification.css';

const Verification = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const { role, ROLES } = useRole();

  const isValidator = role === ROLES.VALIDATOR || role === ROLES.ADMIN;

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects({ role: 'validator' });
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch validator review projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const categorizeStatus = (project) => {
    const norm = normalizeStatus(project);
    if (['validator_pending', 'under_verification', 'ai_passed', 'submitted', 'ai_pending', 'pending'].includes(norm)) {
      return 'pending';
    }
    if (['approved', 'dao_review', 'dao_approved', 'validator_approved', 'credit_issued'].includes(norm)) {
      return 'approved';
    }
    if (['validator_rejected', 'ai_requires_changes', 'dao_rejected', 'rejected'].includes(norm)) {
      return 'rejected';
    }
    return 'pending';
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const category = categorizeStatus(p);
      const matchesStatus = statusFilter === 'all' || category === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        p.projectName?.toLowerCase().includes(term) ||
        p.ngoId?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    pending: projects.filter(p => categorizeStatus(p) === 'pending').length,
    approved: projects.filter(p => categorizeStatus(p) === 'approved').length,
    rejected: projects.filter(p => categorizeStatus(p) === 'rejected').length,
  }), [projects]);

  return (
    <div className="verification-container">
      {/* Role Banner */}
      {isValidator && (
        <div className="validator-banner">
          <Search size={20} />
          <div>
            <strong>Validator Review Mode</strong>
            <p>Audit project coordinates, ground evidence, and baseline MRV data to approve for DAO consensus or request revisions.</p>
          </div>
        </div>
      )}

      {!isValidator && role && (
        <div className="viewer-banner">
          <Info size={18} />
          <p>You're viewing as <strong>{role}</strong>. Only certified Validators can approve or request revisions on projects.
            <Link to="/profile"> Switch role →</Link>
          </p>
        </div>
      )}

      <header className="page-header">
        <div>
          <h1>Validator Verification Queue</h1>
          <p>{stats.pending} projects pending validator audit • {projects.length} total active submissions</p>
        </div>
      </header>

      {/* Quick Stats Tabs */}
      <div className="verify-stats">
        <button
          className={`verify-stat-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <span className="vs-count">{stats.pending}</span>
          <span className="vs-label">Pending Review</span>
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
          <span className="vs-label">Revision Req.</span>
        </button>
        <button
          className={`verify-stat-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <span className="vs-count">{projects.length}</span>
          <span className="vs-label">All Submissions</span>
        </button>
      </div>

      <div className="filter-container">
        <input
          type="search"
          placeholder="Search by project name, NGO ID, or location..."
          className="filter-search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="projects-list">
        {loading ? (
          <p>Loading verification queue from MongoDB...</p>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => {
            const statusConfig = getStatusConfig(project);
            const aiRes = project.aiVerification && project.aiVerification.status && project.aiVerification.status !== 'ai_pending'
              ? project.aiVerification
              : null;

            return (
              <div key={project.projectId || project._id || index} className="verification-card">
                <div className="card-main-info">
                  <div className="vc-header">
                    <h2>{project.projectName}</h2>
                    <span
                      className="status-tag"
                      style={{
                        background: statusConfig.bgColor,
                        color: statusConfig.color,
                        borderColor: statusConfig.borderColor
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="organization">{project.ngoId || 'Verified NGO Developer'}</p>
                  <div className="project-meta">
                    <span><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.location || 'Coordinates Recorded'}</span>
                    <span><Sprout size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.plantationType || 'Mangrove'}</span>
                    <span><Trees size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {(project.saplingsPlanted || 0).toLocaleString()} trees</span>
                    <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  {aiRes && (
                    <div className="vc-ai-score-row" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#475569' }}>
                      <BrainCircuit size={14} style={{ color: '#1a73e8' }} />
                      <span>AI Pre-Screening:</span>
                      <span
                        className="ai-badge"
                        style={{
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: aiRes.recommendation === 'PASS' ? '#e6f4ea' : aiRes.recommendation === 'FLAGGED' ? '#fef7e0' : '#fce8e6',
                          color: aiRes.recommendation === 'PASS' ? '#137333' : aiRes.recommendation === 'FLAGGED' ? '#b06000' : '#c5221f'
                        }}
                      >
                        {aiRes.recommendation === 'PASS' ? 'Eligible for Review' : aiRes.recommendation === 'FLAGGED' ? 'Flagged for Scrutiny' : 'Correction Required'}
                      </span>
                      {aiRes.runNumber && <small className="text-muted">(Run #{aiRes.runNumber})</small>}
                    </div>
                  )}

                  {/* Compact Lifecycle Stepper */}
                  <ProjectLifecycle project={project} compact />
                </div>

                <div className="card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to={`/project/${project.projectId || project._id}`} className="review-button" style={{ background: isValidator ? '#059669' : undefined }}>
                    {isValidator ? (
                      <>
                        <Satellite size={14} style={{ marginRight: 6 }} /> Sentinel-2 ML Audit & Vote
                      </>
                    ) : (
                      <>
                        <Eye size={14} style={{ marginRight: 6 }} /> View Details
                      </>
                    )}
                  </Link>
                  {isValidator && (
                    <Link to="/ai-verification" className="review-button" style={{ background: '#f8fafc', color: '#1a73e8', border: '1px solid #cbd5e1' }}>
                      <BrainCircuit size={14} style={{ marginRight: 6 }} /> AI Pre-Verification
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-results">
            <p>No {statusFilter !== 'all' ? statusFilter : ''} projects found in the verification queue.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;