import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useWeb3 } from '../Web3Context';
import { formatUnits, parseUnits } from 'ethers';
import './ProjectDetail.css';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com",
});

// This helper component uses the context-provided contract
const AdminWalletInfo = () => {
  const { contract, userAddress } = useWeb3();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!contract || !userAddress) return;
        const adminBalance = await contract.balanceOf(userAddress);
        setBalance(formatUnits(adminBalance, 18));
      } catch (err) {
        console.error("Failed to fetch admin balance:", err);
      }
    };
    fetchBalance();
  }, [contract, userAddress]);

  return (
    <div className="admin-wallet-info">
      <h4>Admin Wallet</h4>
      <p>Your BCT Balance: <strong>{parseFloat(balance).toLocaleString()}</strong> BCT</p>
    </div>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { contract, isAdmin } = useWeb3();

  // Local state for this component
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [notification, setNotification] = useState('');

  // Fetch off-chain project data from your API
  const fetchProjectData = useCallback(() => {
    apiClient.get(`/forms/${projectId}`)
      .then(res => setProject(res.data))
      .catch(() => setError("Failed to fetch project details."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Real-time event listener for on-chain approval
  useEffect(() => {
    if (contract && project) {
      const onApproval = (offChainId) => {
        if (offChainId === project._id) {
          setNotification(`✅ This project was just approved on-chain!`);
          fetchProjectData();
        }
      };

      contract.on("ApprovalRecord", onApproval);

      return () => {
        contract.off("ApprovalRecord", onApproval);
      };
    }
  }, [contract, project, fetchProjectData]);

  // Handle voting (off-chain)
  const handleVote = async (voteType) => {
    setIsVoting(true);
    setError(null);
    try {
      const response = await apiClient.patch(`/forms/${projectId}/status`, { action: voteType });
      setProject(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while voting.");
    } finally {
      setIsVoting(false);
    }
  };

  // Handle token minting (on-chain by admin)
  const handleMintTokens = async () => {
    if (!contract || !project) return;

    setIsMinting(true);
    setTxMessage("Preparing transaction...");

    try {
      const recipientAddress = project.walletAddress;
      const tokenAmount = parseUnits(project.saplingsPlanted.toString(), 18);
      const offChainId = project._id;

      setTxMessage("Please confirm the transaction in your wallet...");
      const tx = await contract.mintAndRecordApproval(recipientAddress, tokenAmount, offChainId);

      setTxMessage("Transaction sent! Waiting for confirmation...");
      await tx.wait();

      setTxMessage('');
    } catch (err) {
      console.error("Smart contract minting failed:", err);
      setTxMessage(`❌ Error: ${err.message || "Transaction failed."}`);
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) return <div className="project-detail-container"><p>Loading Project...</p></div>;
  if (error && !project) return <div className="project-detail-container"><h2>Error</h2><p>{error}</p><Link to="/">← Back to Dashboard</Link></div>;
  if (!project) return <div className="project-detail-container"><h2>Project Not Found</h2><Link to="/">← Back to Dashboard</Link></div>;

  const { approveVotes = 0, disapproveVotes = 0, status = 'pending' } = project;
  const totalVotes = approveVotes + disapproveVotes;
  const isApproved = status.toLowerCase() === 'approved';
  const votingConcluded = status.toLowerCase() !== 'pending';

  return (
    <div className="project-detail-container">
      {notification && <div className="realtime-notification">{notification}</div>}
      <Link to="/" className="back-link">← Back to Dashboard</Link>

      <div className="detail-header">
        <h1>{project.projectName}</h1>
        <span className={`detail-status-badge ${project.status?.toLowerCase() || "pending"}`}>
          {project.status || "Pending"}
        </span>
      </div>
      <p className="detail-organization">Submitted by: {project.ngoName}</p>

      <div className="detail-grid">
        <div className="detail-card"><h4>Location</h4><p>📍 {project.location}</p></div>
        <div className="detail-card"><h4>Plantation Type</h4><p>🌿 {project.plantationType}</p></div>
        <div className="detail-card"><h4>Saplings Planted</h4><p>🌳 {project.saplingsPlanted?.toLocaleString()}</p></div>
        <div className="detail-card"><h4>Submitted On</h4><p>🗓️ {new Date(project.createdAt).toLocaleDateString()}</p></div>
      </div>

      <div className="detail-description">
        <h3>Project Overview</h3>
        <p>{project.description}</p>
      </div>

      <div className="detail-image">
        <h3>Uploaded Images</h3>
        {(project.imageBase64s && Array.isArray(project.imageBase64s) && project.imageBase64s.length > 0) ? (
          <div className="image-gallery">
            {project.imageBase64s.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Project visual ${index + 1}`}
              />
            ))}
          </div>
        ) : (
          <div className="image-placeholder">
            <span>No Images Available</span>
          </div>
        )}
      </div>

      <div className="voting-section">
        <h3>Project Voting</h3>
        <div className="vote-counts">
          <p>Approve: <strong>{approveVotes}</strong></p>
          <p>Disapprove: <strong>{disapproveVotes}</strong></p>
        </div>
        <div className="vote-progress">
          <div className="progress-bar" style={{ width: `${Math.min(totalVotes * 10, 100)}%` }}></div>
        </div>
        <p className="vote-summary">{totalVotes} votes cast</p>

        {!votingConcluded ? (
          <div className="vote-actions">
            <button onClick={() => handleVote('approve')} className="approve-btn" disabled={isVoting}>
              {isVoting ? 'Voting...' : 'Approve'}
            </button>
            <button onClick={() => handleVote('disapprove')} className="disapprove-btn" disabled={isVoting}>
              {isVoting ? 'Voting...' : 'Disapprove'}
            </button>
          </div>
        ) : (
          <p className="vote-message">Voting for this project has concluded.</p>
        )}
      </div>

      <hr />

      {isAdmin && (
        <div className="admin-section">
          <h3>Admin Actions</h3>
          <AdminWalletInfo />

          {isApproved ? (
            <div>
              <p>This project has been approved by the DAO.</p>
              <button className="mint-btn" onClick={handleMintTokens} disabled={isMinting}>
                {isMinting ? 'Minting...' : 'Mint & Send Tokens to NGO'}
              </button>
            </div>
          ) : (
            <p>This project is not yet approved.</p>
          )}
          {txMessage && <p className="vote-message blockchain">{txMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
