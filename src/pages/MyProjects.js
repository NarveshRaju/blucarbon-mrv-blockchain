import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import apiClient from '../services/api';
import WorkflowStepper from '../components/WorkflowStepper';
import './MyProjects.css';

const MyProjects = () => {
  const { userAddress } = useWeb3();
  const { role, ROLES } = useRole();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellModal, setSellModal] = useState(null);
  const [sellForm, setSellForm] = useState({ pricePerToken: '', totalTokens: '' });
  const [sellStatus, setSellStatus] = useState('');

  // Fetch projects - In a real app, you'd filter by NGO ID
  // For now, fetch all and allow the user to see ones matching their wallet
  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => {
        // Filter to projects that match the user's wallet address
        const myProjects = userAddress
          ? res.data.filter(p =>
              p.walletAddress?.toLowerCase() === userAddress.toLowerCase()
            )
          : res.data;
        setProjects(myProjects.length > 0 ? myProjects : res.data);
      })
      .catch(err => console.error('Failed to fetch projects:', err))
      .finally(() => setLoading(false));
  }, [userAddress]);

  const stats = useMemo(() => ({
    total: projects.length,
    approved: projects.filter(p => p.status === 'Approved').length,
    pending: projects.filter(p => p.status === 'Pending').length,
    rejected: projects.filter(p => p.status === 'Rejected').length,
    totalTokens: projects.reduce((s, p) => s + (p.totalTokens || p.saplingsPlanted || 0), 0),
    listedForSale: projects.filter(p => (p.costPerToken > 0) || (p.price > 0)).length,
  }), [projects]);

  const handleListForSale = useCallback(async () => {
    if (!sellModal || !sellForm.pricePerToken) return;
    setSellStatus('submitting');

    try {
      const totalTokens = Number(sellForm.totalTokens) || sellModal.saplingsPlanted || sellModal.noOfPlantations || 0;
      const pricePerToken = Number(sellForm.pricePerToken);
      const totalAmount = totalTokens * pricePerToken;

      await apiClient.post('/token/sell', {
        ngoId: sellModal.ngoId,
        projectId: sellModal.projectId || sellModal._id,
        pricePerToken,
        totalTokens,
        totalAmount,
      });

      setSellStatus('success');
      // Update local state
      setProjects(prev => prev.map(p =>
        (p.projectId || p._id) === (sellModal.projectId || sellModal._id)
          ? { ...p, price: pricePerToken, totalTokens, totalCost: totalAmount }
          : p
      ));

      setTimeout(() => {
        setSellModal(null);
        setSellStatus('');
        setSellForm({ pricePerToken: '', totalTokens: '' });
      }, 2000);
    } catch (err) {
      setSellStatus('error');
      console.error('Failed to list for sale:', err);
    }
  }, [sellModal, sellForm]);

  // Soft access check
  if (role && role !== ROLES.NGO && role !== ROLES.ADMIN) {
    return (
      <div className="my-projects-container">
        <div className="access-info-banner">
          <span>ℹ️</span>
          <p>This page is designed for <strong>NGO Developers</strong>. You're viewing as a <strong>{role}</strong>.
            <Link to="/profile"> Switch role →</Link>
          </p>
        </div>
        <header className="my-projects-header">
          <h1>🌱 NGO Project Tracker</h1>
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
          <h1>🌱 My Projects</h1>
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
          const isApproved = project.status === 'Approved';
          const isListed = (project.costPerToken > 0) || (project.price > 0);

          return (
            <div key={project.projectId || project._id} className="ngo-project-card">
              <div className="ngo-project-header">
                <div>
                  <h3>{project.projectName}</h3>
                  <p className="ngo-project-meta">
                    📍 {project.location} • 🌿 {project.plantationType} • 🌳 {(project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()} trees
                  </p>
                </div>
                <span className={`ngo-status-badge ${(project.status || 'Pending').toLowerCase()}`}>
                  {project.status || 'Pending'}
                </span>
              </div>

              {/* Workflow Stepper */}
              <WorkflowStepper project={project} />

              {/* Action buttons based on status */}
              <div className="ngo-project-actions">
                <Link to={`/project/${project.projectId || project._id}`} className="ngo-view-btn">
                  View Details
                </Link>

                {isApproved && !isListed && (
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
                    🏷️ List for Sale
                  </button>
                )}

                {isListed && (
                  <span className="ngo-listed-badge">
                    ✅ Listed at {project.price || project.costPerToken} ETH/token
                  </span>
                )}

                {project.status === 'Rejected' && (
                  <Link to="/ngo/submit" className="ngo-resubmit-btn">
                    🔄 Resubmit
                  </Link>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="no-projects-card">
            <span>📭</span>
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
            <h2>🏷️ List Tokens for Sale</h2>
            <p className="sell-project-name">{sellModal.projectName}</p>

            {sellStatus === 'success' ? (
              <div className="sell-success">
                <span>✅</span>
                <p>Tokens listed successfully! They're now available on the marketplace.</p>
              </div>
            ) : (
              <div className="modal-form">
                <label>Total Tokens to List</label>
                <input
                  type="number"
                  value={sellForm.totalTokens}
                  onChange={e => setSellForm(p => ({ ...p, totalTokens: e.target.value }))}
                  placeholder="Number of BCT tokens"
                />

                <label>Price per Token (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={sellForm.pricePerToken}
                  onChange={e => setSellForm(p => ({ ...p, pricePerToken: e.target.value }))}
                  placeholder="e.g. 0.05"
                />

                {sellForm.pricePerToken && sellForm.totalTokens && (
                  <p className="sell-total">
                    Total Value: <strong>{(Number(sellForm.totalTokens) * Number(sellForm.pricePerToken)).toFixed(4)} ETH</strong>
                  </p>
                )}

                {sellStatus === 'error' && (
                  <p className="sell-error">❌ Failed to list. Please try again.</p>
                )}

                <div className="modal-actions">
                  <button className="modal-cancel" onClick={() => { setSellModal(null); setSellStatus(''); }}>
                    Cancel
                  </button>
                  <button
                    className="modal-submit"
                    onClick={handleListForSale}
                    disabled={sellStatus === 'submitting' || !sellForm.pricePerToken}
                  >
                    {sellStatus === 'submitting' ? 'Listing...' : 'List for Sale'}
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
