import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../Web3Context';
import { formatUnits } from 'ethers';
import axios from 'axios';
import './Profile.css';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com",
});

const Profile = () => {
  const { userAddress, isAdmin, bctBalance, connectWallet, disconnectWallet } = useWeb3();
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

  // Fetch projects to show as voting history
  useEffect(() => {
    if (!userAddress) return;
    setLoadingHistory(true);
    apiClient.get('/projects-for-sale')
      .then(res => {
        // Show approved/rejected projects as "voting history"
        const concluded = res.data.filter(p => p.status === 'Approved' || p.status === 'Rejected');
        setVotingHistory(concluded.slice(0, 5));
      })
      .catch(err => console.error("Failed to fetch voting history:", err))
      .finally(() => setLoadingHistory(false));
  }, [userAddress]);

  if (!userAddress) {
    return (
      <div className="profile-container">
        <div className="profile-main-card" style={{ textAlign: 'center', padding: '60px 25px' }}>
          <h2>Connect Your Wallet</h2>
          <p style={{ color: '#5f6368', marginBottom: '20px' }}>
            Please connect your wallet to view your profile and activity.
          </p>
          <button className="disconnect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const shortAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;

  return (
    <div className="profile-container">
      {/* Main Profile Card */}
      <div className="profile-main-card">
        <div className="profile-info">
          <div className="avatar">{userAddress.substring(2, 4).toUpperCase()}</div>
          <div>
            <h2>{shortAddress}</h2>
            {isAdmin && <span className="validator-tag">Admin</span>}
          </div>
        </div>

        <div className="wallet-info">
          <h3>Wallet Information</h3>
          <div className="wallet-address-container">
            <div>
              <p className="wallet-label">Wallet Address</p>
              <p className="wallet-address">{userAddress}</p>
            </div>
            <span className="connection-status connected">● Connected</span>
          </div>
        </div>

        <div className="wallet-info">
          <h3>Token Balance</h3>
          <div className="token-balance-container">
            <div>
              <p className="balance-label">Blue Carbon Token (BCT)</p>
              <p className="balance-value">{formattedBalance}</p>
            </div>
          </div>
          <p className="token-description">
            BCT tokens represent verified carbon credits from approved blue carbon projects.
            Each token corresponds to one unit of carbon sequestration.
          </p>
        </div>

        <div className="profile-actions">
          <button className="disconnect-btn" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
          <button className="edit-profile-btn" onClick={() => navigator.clipboard.writeText(userAddress)}>
            Copy Address
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
                  {project.status === 'Approved' ? '✓' : '✗'}
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