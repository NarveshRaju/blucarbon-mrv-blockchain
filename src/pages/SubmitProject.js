import React, { useState } from 'react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import WorkflowStepper from '../components/WorkflowStepper';
import './SubmitProject.css';

const SubmitProject = () => {
  const { userAddress } = useWeb3();
  const { role, ROLES } = useRole();

  const [form, setForm] = useState({
    ngoId: '',
    projectName: '',
    description: '',
    location: '',
    plantationType: 'Mangrove',
    saplingsPlanted: '',
    walletAddress: userAddress || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  // Auto-fill wallet when it connects
  React.useEffect(() => {
    if (userAddress && !form.walletAddress) {
      setForm(prev => ({ ...prev, walletAddress: userAddress }));
    }
  }, [userAddress, form.walletAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'saplingsPlanted' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.projectName || !form.location || !form.saplingsPlanted || !form.walletAddress) {
      setError('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/form', {
        ...form,
        saplingsPlanted: Number(form.saplingsPlanted),
      });

      setSuccess({
        projectId: res.data.projectId,
        projectName: form.projectName,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Access check
  if (role && role !== ROLES.NGO && role !== ROLES.ADMIN) {
    return (
      <div className="submit-container">
        <div className="access-blocked">
          <span className="blocked-icon">🚫</span>
          <h2>NGO Access Required</h2>
          <p>Only NGO developers can submit new projects. You're currently signed in as a <strong>{role}</strong>.</p>
          <Link to="/profile" className="switch-role-link">Switch Role in Profile →</Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="submit-container">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h2>Project Submitted Successfully!</h2>
          <p className="success-project-name">{success.projectName}</p>
          <p className="success-id">Project ID: <code>{success.projectId}</code></p>

          <div className="success-workflow">
            <h4>What happens next?</h4>
            <WorkflowStepper project={{ status: 'Pending' }} />
            <p className="workflow-explanation">
              Your project is now <strong>Under Review</strong>. DAO validators will review your submission
              and vote to approve or reject it. Once approved, BCT tokens will be minted to your wallet.
            </p>
          </div>

          <div className="success-actions">
            <Link to="/ngo/projects" className="view-projects-btn">View My Projects</Link>
            <button className="submit-another-btn" onClick={() => {
              setSuccess(null);
              setForm({
                ngoId: form.ngoId,
                projectName: '',
                description: '',
                location: '',
                plantationType: 'Mangrove',
                saplingsPlanted: '',
                walletAddress: userAddress || '',
              });
            }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-container">
      <header className="submit-header">
        <h1>🌱 Submit New Blue Carbon Project</h1>
        <p>Fill in the details of your blue carbon conservation or restoration project</p>
      </header>

      {/* Workflow Preview */}
      <div className="workflow-preview">
        <h4>Project Lifecycle</h4>
        <WorkflowStepper project={{ status: 'new' }} />
        <p>Your project will go through this verification workflow after submission.</p>
      </div>

      <form className="submit-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="ngoId">NGO / Organization ID *</label>
            <input
              id="ngoId"
              name="ngoId"
              type="text"
              placeholder="e.g. NGO-OCEAN-ALLIANCE"
              value={form.ngoId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectName">Project Name *</label>
            <input
              id="projectName"
              name="projectName"
              type="text"
              placeholder="e.g. Mangrove Restoration Initiative"
              value={form.projectName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Project Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe your project's goals, methodology, expected carbon sequestration impact..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Sundarbans, Bangladesh"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plantationType">Plantation / Ecosystem Type *</label>
            <select
              id="plantationType"
              name="plantationType"
              value={form.plantationType}
              onChange={handleChange}
            >
              <option value="Mangrove">🌿 Mangrove</option>
              <option value="Seagrass">🌊 Seagrass</option>
              <option value="Salt Marsh">🏝️ Salt Marsh</option>
              <option value="Tidal Wetland">💧 Tidal Wetland</option>
              <option value="Kelp Forest">🌱 Kelp Forest</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="saplingsPlanted">Saplings / Units Planted *</label>
            <input
              id="saplingsPlanted"
              name="saplingsPlanted"
              type="number"
              min="1"
              placeholder="e.g. 2500"
              value={form.saplingsPlanted}
              onChange={handleChange}
              required
            />
            <span className="form-hint">This determines the number of BCT tokens minted if approved</span>
          </div>

          <div className="form-group">
            <label htmlFor="walletAddress">Receiving Wallet Address *</label>
            <input
              id="walletAddress"
              name="walletAddress"
              type="text"
              placeholder="0x..."
              value={form.walletAddress}
              onChange={handleChange}
              required
              className="mono-input"
            />
            <span className="form-hint">BCT tokens will be sent to this address after approval</span>
          </div>
        </div>

        <div className="form-submit-section">
          <button type="submit" className="submit-btn" disabled={submitting || !userAddress}>
            {submitting ? 'Submitting...' : '📤 Submit Project for Review'}
          </button>
          {!userAddress && (
            <p className="wallet-warning">⚠️ Please connect your wallet first</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SubmitProject;
