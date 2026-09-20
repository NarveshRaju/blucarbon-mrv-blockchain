import React, { useEffect, useState } from 'react';
import { Users, Check, X } from 'lucide-react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { formatUnits } from 'ethers';
import apiClient from '../services/api';
import './Profile.css';

const Profile = () => {
  const { userAddress, isAdmin, bctBalance, connectWallet, disconnectWallet } = useWeb3();
  const { role, setShowRoleSelector, ROLE_LABELS } = useRole();
  const [formattedBalance, setFormattedBalance] = useState('0');
  const [votingHistory, setVotingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Format the BCT balance from wei
  useEffect(() => {
    if (bctBalance && bctBalance !== '0') {
      try {
        setFormattedBalance(parseFloat(formatUnits(bctBalance, 18)).toLocaleString());
      } catch {
        setFormattedBalance('0');
      }
    } else {
      setFormattedBalance('0');
    }
  }, [bctBalance]);

  // Fetch past voting records for this validator
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userAddress) return;
      setLoadingHistory(true);
      try {
        const response = await apiClient.get('/projects-for-sale');
        setVotingHistory(response.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch voting history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [userAddress]);

  const delegation = null;

  if (!userAddress) {
    return (
      <div className="profile-container">
        <div className="profile-card not-connected">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your MetaMask wallet to view your profile and manage permissions.</p>
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {userAddress.substring(2, 4).toUpperCase()}
          </div>
          <div className="profile-title">
            <h2>Account Profile</h2>
            <div className="profile-badge-row">
              <span className={`role-badge ${role.toLowerCase()}`}>
                {ROLE_LABELS[role] || role}
              </span>
              {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="wallet-info">
          <p className="wallet-label">Connected Wallet Address</p>
          <p className="wallet-address">{userAddress}</p>
        </div>

        {/* Current Role Card with Switch Option */}
        <div className="profile-role-section">
          <div className="prs-header">
            <div>
              <span className="prs-label">Platform Role</span>
              <h4>{ROLE_LABELS[role] || role}</h4>
            </div>
            <button
              className="switch-role-btn"
              onClick={() => setShowRoleSelector(true)}
            >
              Switch Role
            </button>
          </div>
          <p className="prs-description">
            Your current perspective controls which actions, navigation items, and workflow tools are highlighted across BlueChain.
          </p>
        </div>

        {/* Token Balance */}
        <div className="token-balance-section">
          <h3>Token Balance</h3>
          <div className="balance-display">
            <span className="balance-number">{formattedBalance}</span>
            <span className="balance-symbol">BCT</span>
          </div>
          <p className="balance-note">
            Each token corresponds to one unit of carbon sequestration and one unit of voting power.
          </p>
        </div>

        {/* Delegation Status */}
        {delegation && (
          <div className="wallet-info">
            <h3><Users size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Vote Delegation</h3>
            <div className="delegation-info">
              <p className="wallet-label">Delegated To</p>
              <p className="wallet-address">{delegation}</p>
            </div>
          </div>
        )}

        <div className="profile-actions">
          <button className="disconnect-btn" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* Voting History Card */}
      <div className="profile-sub-card">
        <h3>Recent Project Activity</h3>
        {loadingHistory ? (
          <p style={{ color: '#5f6368' }}>Loading activity...</p>
        ) : votingHistory.length > 0 ? (
          votingHistory.map((project, index) => (
            <div key={project.projectId || index} className="history-item">
              <div className="history-info">
                <span className={`status-icon ${project.status?.toLowerCase() === 'rejected' ? 'rejected' : ''}`}>
                  {project.status === 'Approved' ? <Check size={12} /> : <X size={12} />}
                </span>
                <div>
                  <p className="history-name">{project.projectName || project.ngoName}</p>
                  <p className="history-id">ID: {project.projectId}</p>
                </div>
              </div>
              <div className="history-details">
                <span className={`history-status-tag ${project.status?.toLowerCase()}`}>
                  {project.status}
                </span>
                <span className="history-date">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#5f6368' }}>No concluded projects yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;