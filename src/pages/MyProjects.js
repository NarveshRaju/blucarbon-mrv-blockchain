import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Sprout,
  Trees,
  Tag,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Inbox,
  Info,
  BrainCircuit
} from 'lucide-react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import apiClient from '../services/api';
import { getMyProjects, getProjectBaseline, getProjectMRVRecords, deriveMRVStatus, getProjectActivity, canListForSale } from '../services/projectService';
import ProjectLifecycle from '../components/ProjectLifecycle';
import { formatProjectId, getStatusConfig, normalizeStatus } from '../utils/projectStatus';
import './MyProjects.css';

const MyProjects = () => {
  const { userAddress } = useWeb3();
  const { role, ROLES } = useRole();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellModal, setSellModal] = useState(null);
  const [sellForm, setSellForm] = useState({ pricePerToken: '', totalTokens: '' });
  const [sellStatus, setSellStatus] = useState('');

  // Fetch only projects belonging to this connected NGO wallet via backend MongoDB query
  const loadProjects = useCallback(async () => {
    if (!userAddress) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getMyProjects(userAddress);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch NGO projects from MongoDB:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Compute stats
  const stats = useMemo(() => {
    const total = projects.length;
    const approved = projects.filter(p => {
      const norm = normalizeStatus(p);
      return norm === 'approved' || norm === 'dao_approved' || norm === 'credit_issued';
    }).length;
    const pending = projects.filter(p => {
      const norm = normalizeStatus(p);
      return norm === 'submitted' || norm === 'ai_pending' || norm === 'validator_pending' || norm === 'under_verification' || norm === 'dao_review';
    }).length;
    const rejected = projects.filter(p => {
      const norm = normalizeStatus(p);
      return norm === 'ai_requires_changes' || norm === 'validator_rejected' || norm === 'dao_rejected';
    }).length;
    const totalTokens = projects
      .filter(p => {
        const norm = normalizeStatus(p);
        return norm === 'approved' || norm === 'credit_issued';
      })
      .reduce((sum, p) => sum + (p.saplingsPlanted || 0), 0);
    const listedForSale = projects.filter(p => (p.costPerToken > 0) || (p.price > 0)).length;

    return { total, approved, pending, rejected, totalTokens, listedForSale };
  }, [projects]);

  const handleListForSale = useCallback(async () => {
    if (!sellModal || !sellForm.pricePerToken || !sellForm.totalTokens) return;
    setSellStatus('loading');

    try {
      await apiClient.post('/token/sell', {
        projectId: sellModal.projectId || sellModal._id,
        pricePerToken: parseFloat(sellForm.pricePerToken),
        totalTokens: parseInt(sellForm.totalTokens),
        sellerAddress: userAddress,
      });

      setSellStatus('success');
      // Refresh list
      const res = await apiClient.get('/projects-for-sale');
      setProjects(res.data);
      setTimeout(() => {
        setSellModal(null);
        setSellStatus('');
      }, 1500);
    } catch (err) {
      console.error('Failed to list for sale:', err);
      setSellStatus('error');
    }
  }, [sellModal, sellForm, userAddress]);

  // Non-NGO banner
  if (role && role !== ROLES.NGO && role !== ROLES.ADMIN) {
    return (
      <div className="my-projects-container">
        <div className="access-info-banner">
          <Info size={16} />
          <p>This page is designed for <strong>NGO Developers</strong>. You're viewing as a <strong>{role}</strong>.
            <Link to="/profile"> Switch role →</Link>
          </p>
        </div>
        <header className="my-projects-header">
          <h1>NGO Project Tracker</h1>
          <p>Track your submitted blue carbon projects through the verification workflow</p>
        </header>
      </div>
    );
  }

  if (loading) return <div className="my-projects-container"><p>Loading your projects...</p></div>;

  return (
    <div className="my-projects-container">
      <header className="my-projects-header">
        <div>
          <h1>My Projects</h1>
          <p>Track your submitted blue carbon projects through the verification workflow</p>
        </div>
        <Link to="/ngo/submit" className="submit-new-btn">+ Submit New Project</Link>
      </header>

      {/* Stats */}
      <section className="ngo-stats-grid">
        <div className="ngo-stat"><span className="ngo-stat-value">{stats.total}</span><span>Submitted</span></div>
        <div className="ngo-stat approved"><span className="ngo-stat-value">{stats.approved}</span><span>Approved</span></div>
        <div className="ngo-stat pending"><span className="ngo-stat-value">{stats.pending}</span><span>Pending</span></div>
        <div className="ngo-stat rejected"><span className="ngo-stat-value">{stats.rejected}</span><span>Rejected</span></div>
        <div className="ngo-stat tokens"><span className="ngo-stat-value">{stats.totalTokens.toLocaleString()}</span><span>BCT Earned</span></div>
        <div className="ngo-stat listed"><span className="ngo-stat-value">{stats.listedForSale}</span><span>Listed</span></div>
      </section>

      {/* Projects */}
      <section className="ngo-projects-list">
        {projects.length > 0 ? projects.map(project => {
          const isListed = (project.costPerToken > 0) || (project.price > 0);
          const pid = project.projectId || project._id;
          const baseline = getProjectBaseline(pid, project);
          const mrvRecords = getProjectMRVRecords(pid, project);
          const mrvStatus = deriveMRVStatus(project, baseline, mrvRecords);
          const hasBaseline = Boolean(baseline && baseline.projectArea);
          const mrvCount = mrvRecords.length;
          const activities = getProjectActivity(pid, project);
          const lastActivity = activities[0];

          return (
            <div key={pid} className="ngo-project-card">
              <div className="ngo-project-header">
                <div>
                  <div className="ngo-title-row">
                    <span className="ngo-pid-badge">{formatProjectId(pid)}</span>
                    <h3>{project.projectName}</h3>
                    <div className="ngo-badge-tags">
                      <span className={`ngo-evidence-badge ${((project.imageBase64s?.length || project.evidence?.length || (project.imageUrl ? 1 : 0)) > 0) ? 'has-evidence' : 'no-evidence'}`}>
                        {((project.imageBase64s?.length || project.evidence?.length || (project.imageUrl ? 1 : 0)) > 0)
                          ? `${(project.imageBase64s?.length || project.evidence?.length || 1)} evidence file${(project.imageBase64s?.length || project.evidence?.length || 1) > 1 ? 's' : ''}`
                          : 'No evidence attached'}
                      </span>
                      <span className={`ngo-mrv-pill ${mrvStatus.color}`}>
                        MRV: {mrvStatus.label}
                      </span>
                      {(() => {
                        const statusConfig = getStatusConfig(project);
                        const aiRes = project.aiVerification && project.aiVerification.status && project.aiVerification.status !== 'ai_pending'
                          ? project.aiVerification
                          : null;
                        if (!aiRes) {
                          if (statusConfig.stageIndex > 1) {
                            return (
                              <span className="ngo-mrv-pill success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e6f4ea', color: '#137333', border: '1px solid #ceead6' }}>
                                <BrainCircuit size={12} /> AI Verified
                              </span>
                            );
                          }
                          return (
                            <span className="ngo-mrv-pill pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                              <BrainCircuit size={12} /> AI Pending
                            </span>
                          );
                        }
                        const rec = aiRes.recommendation || (aiRes.status === 'ai_passed' ? 'PASS' : 'FLAGGED');
                        const isPass = rec === 'PASS';
                        const isFlag = rec === 'FLAGGED';
                        return (
                          <span
                            className={`ngo-mrv-pill ${isPass ? 'success' : isFlag ? 'warning' : 'danger'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <BrainCircuit size={12} /> AI: {isPass ? 'Eligible' : isFlag ? 'Flagged for Scrutiny' : 'Revision Required'}
                            {aiRes.runNumber && ` (Run #${aiRes.runNumber})`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <p className="ngo-project-meta">
                    <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {project.location} • <Sprout size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {project.plantationType} • <Trees size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {(project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()} trees
                  </p>
                  <div className="ngo-mrv-quick-stats">
                    <span className="mrv-qs-item">
                      <strong>Baseline:</strong> {hasBaseline ? `Ready (${baseline.biomass || '42.5'} t/ha)` : 'Pending'}
                    </span>
                    <span className="mrv-qs-item">
                      <strong>MRV Logs:</strong> {mrvCount > 0 ? `${mrvCount} recorded` : 'No logs yet'}
                    </span>
                  </div>
                </div>
                {(() => {
                  const statusConfig = getStatusConfig(project);
                  return (
                    <span
                      className="ngo-status-badge"
                      style={{
                        backgroundColor: statusConfig.bgColor,
                        color: statusConfig.color,
                        borderColor: statusConfig.borderColor
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  );
                })()}
              </div>

              {/* Lifecycle progression (Phase 9) */}
              <div className="ngo-lifecycle-wrap">
                <ProjectLifecycle project={project} compact={true} />
              </div>

              {lastActivity && (
                <div className="ngo-last-activity-bar">
                  <span><strong>Last Activity:</strong> {lastActivity.title}</span>
                  <span className="last-activity-date">{new Date(lastActivity.timestamp).toLocaleDateString()}</span>
                </div>
              )}

              {/* Action buttons based on status */}
              <div className="ngo-project-actions">
                <Link to={`/project/${project.projectId || project._id}`} className="ngo-view-btn">
                  View Project Details →
                </Link>

                {canListForSale(project).eligible && (
                  <button
                    className="ngo-sell-btn"
                    onClick={() => {
                      setSellModal(project);
                      setSellForm({
                        pricePerToken: '',
                        totalTokens: (project.saplingsPlanted || project.noOfPlantations || 0).toString(),
                      });
                    }}
                  >
                    <Tag size={13} style={{ marginRight: 4 }} /> List for Sale
                  </button>
                )}

                {isListed && (
                  <span className="ngo-listed-badge">
                    <CheckCircle2 size={13} style={{ marginRight: 4 }} /> Listed at ₹{Math.round(project.price < 100 ? project.price * 85 : project.price || project.costPerToken || 1250).toLocaleString('en-IN')} / credit (INR)
                  </span>
                )}

                {getStatusConfig(project).isRevision && (
                  <Link to={`/ngo/submit?projectId=${project.projectId || project._id}&step=5`} className="ngo-resubmit-btn">
                    <RotateCcw size={13} style={{ marginRight: 4 }} /> Fix Issues & Resubmit
                  </Link>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="no-projects-card">
            <Inbox size={36} />
            <h3>No projects yet</h3>
            <p>Submit your first blue carbon project to start earning BCT tokens.</p>
            <Link to="/ngo/submit" className="submit-new-btn">+ Submit New Project</Link>
          </div>
        )}
      </section>

      {/* Sell Modal */}
      {sellModal && (
        <div className="modal-overlay" onClick={() => { setSellModal(null); setSellStatus(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>List Tokens for Sale</h2>
            <p className="sell-project-name">{sellModal.projectName}</p>

            {sellStatus === 'success' ? (
              <div className="sell-success">
                <CheckCircle2 size={24} className="text-success" />
                <p>Tokens listed successfully! They're now available on the marketplace.</p>
              </div>
            ) : (
              <div className="modal-form">
                <label>Total BCT Credits to List</label>
                <input
                  type="number"
                  value={sellForm.totalTokens}
                  onChange={e => setSellForm(p => ({ ...p, totalTokens: e.target.value }))}
                  placeholder="Number of BCT credits"
                />

                <label>Price per Credit (₹ INR)</label>
                <input
                  type="number"
                  step="10"
                  value={sellForm.pricePerToken}
                  onChange={e => setSellForm(p => ({ ...p, pricePerToken: e.target.value }))}
                  placeholder="e.g. 1250"
                />

                {sellForm.pricePerToken && sellForm.totalTokens && (
                  <p className="sell-total">
                    Total Value: <strong>₹{(Number(sellForm.totalTokens) * Number(sellForm.pricePerToken)).toLocaleString('en-IN')} INR</strong>
                  </p>
                )}

                {sellStatus === 'error' && (
                  <p className="sell-error"><AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Failed to list. Please try again.</p>
                )}

                <div className="modal-actions">
                  <button className="modal-cancel" onClick={() => { setSellModal(null); setSellStatus(''); }}>
                    Cancel
                  </button>
                  <button
                    className="modal-submit"
                    onClick={handleListForSale}
                    disabled={sellStatus === 'loading' || !sellForm.pricePerToken}
                  >
                    {sellStatus === 'loading' ? 'Listing...' : 'List on Marketplace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
