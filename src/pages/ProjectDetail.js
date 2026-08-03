import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import apiClient from '../services/api';
import WorkflowStepper from '../components/WorkflowStepper';
import { formatUnits, parseUnits } from 'ethers';
import './ProjectDetail.css';

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
  const { contract, isAdmin, userAddress } = useWeb3();
  const { role, ROLES } = useRole();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [notification, setNotification] = useState('');

  const isValidator = role === ROLES.VALIDATOR || role === ROLES.ADMIN;
  const isNGO = role === ROLES.NGO;
  const isInvestor = role === ROLES.INVESTOR;
  const isProjectOwner = project && userAddress &&
    project.walletAddress?.toLowerCase() === userAddress.toLowerCase();

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
      return () => { contract.off("ApprovalRecord", onApproval); };
    }
  }, [contract, project, fetchProjectData]);

  // Handle voting (off-chain)
  const handleVote = async (voteType) => {
    setIsVoting(true);
    setError(null);
    try {
      const newStatus = voteType === 'approve' ? 'Approved' : 'Rejected';
      const response = await apiClient.patch(`/forms/${projectId}/status`, { status: newStatus });
      setProject(response.data.form || response.data);
      setNotification(voteType === 'approve'
        ? '✅ Project approved! Tokens can now be minted.'
        : '❌ Project rejected.');
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while voting.");
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
      setNotification('✅ Tokens minted successfully!');
      fetchProjectData();
    } catch (err) {
      console.error("Smart contract minting failed:", err);
      setTxMessage(`❌ Error: ${err.message || "Transaction failed."}`);
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) return <div className="project-detail-container"><p>Loading Project...</p></div>;
  if (error && !project) return <div className="project-detail-container"><h2>Error</h2><p>{error}</p><Link to="/">← Back</Link></div>;
  if (!project) return <div className="project-detail-container"><h2>Project Not Found</h2><Link to="/">← Back</Link></div>;

  const status = (project.status || 'Pending').toLowerCase();
  const isApproved = status === 'approved';
  const isPending = status === 'pending';

  return (
    <div className="project-detail-container">
      {notification && <div className="realtime-notification">{notification}</div>}

      <Link to={isValidator ? "/verification" : isNGO ? "/ngo/projects" : "/"} className="back-link">
        ← Back to {isValidator ? "Review Queue" : isNGO ? "My Projects" : "Dashboard"}
      </Link>

      {/* Workflow Stepper */}
      <WorkflowStepper project={project} />

      <div className="detail-header">
        <h1>{project.projectName}</h1>
        <span className={`detail-status-badge ${status}`}>
          {project.status || "Pending"}
        </span>
      </div>
      <p className="detail-organization">Submitted by: {project.ngoId || project.ngoName}</p>

      <div className="detail-grid">
        <div className="detail-card"><h4>Location</h4><p>📍 {project.location}</p></div>
        <div className="detail-card"><h4>Plantation Type</h4><p>🌿 {project.plantationType}</p></div>
        <div className="detail-card"><h4>Saplings Planted</h4><p>🌳 {project.saplingsPlanted?.toLocaleString()}</p></div>
        <div className="detail-card"><h4>Submitted On</h4><p>🗓️ {new Date(project.createdAt).toLocaleDateString()}</p></div>
      </div>

      <div className="detail-description">
        <h3>Project Overview</h3>
        <p>{project.description || 'No description provided.'}</p>
      </div>

      {/* Images */}
      <div className="detail-image">
        <h3>Uploaded Images</h3>
        {(project.imageBase64s && Array.isArray(project.imageBase64s) && project.imageBase64s.length > 0) ? (
          <div className="image-gallery">
            {project.imageBase64s.map((src, index) => (
              <img key={index} src={src} alt={`Project visual ${index + 1}`} />
            ))}
          </div>
        ) : (
          <div className="image-placeholder"><span>No Images Available</span></div>
        )}
      </div>

      {/* ===== ROLE-SPECIFIC ACTIONS ===== */}

      {/* Validator: Vote Section */}
      {(isValidator || !role) && (
        <div className="voting-section">
          <h3>🔍 Project Verification</h3>
          {isPending ? (
            <>
              <p className="vote-prompt">As a validator, review the project data above and cast your vote:</p>
              <div className="vote-actions">
                <button onClick={() => handleVote('approve')} className="approve-btn" disabled={isVoting}>
                  {isVoting ? 'Processing...' : '✅ Approve Project'}
                </button>
                <button onClick={() => handleVote('disapprove')} className="disapprove-btn" disabled={isVoting}>
                  {isVoting ? 'Processing...' : '❌ Reject Project'}
                </button>
              </div>
            </>
          ) : (
            <p className="vote-message">
              Verification for this project has concluded — Status: <strong>{project.status}</strong>
            </p>
          )}
          {error && <p className="vote-error">{error}</p>}
        </div>
      )}

      {/* Admin: Mint Section */}
      {isAdmin && (
        <div className="admin-section">
          <h3>🛡️ Admin Actions</h3>
          <AdminWalletInfo />

          {isApproved ? (
            <div>
              <p>This project has been approved. Mint BCT tokens to the NGO's wallet:</p>
              <p className="mint-info">
                Recipient: <code>{project.walletAddress}</code><br />
                Amount: <strong>{project.saplingsPlanted?.toLocaleString()} BCT</strong>
              </p>
              <button className="mint-btn" onClick={handleMintTokens} disabled={isMinting}>
                {isMinting ? 'Minting...' : '🪙 Mint & Send Tokens to NGO'}
              </button>
            </div>
          ) : (
            <p>Project must be approved before tokens can be minted.</p>
          )}
          {txMessage && <p className="vote-message blockchain">{txMessage}</p>}
        </div>
      )}

      {/* NGO Owner: List for Sale */}
      {isNGO && isProjectOwner && isApproved && (
        <div className="ngo-action-section">
          <h3>🏷️ List Tokens for Sale</h3>
          <p>Your project has been approved! You can now list your BCT tokens on the marketplace.</p>
          <Link to="/ngo/projects" className="list-tokens-link">
            Go to My Projects to List →
          </Link>
        </div>
      )}

      {/* Investor: Buy Link */}
      {isInvestor && project.price && project.price > 0 && (
        <div className="investor-action-section">
          <h3>💱 Available on Marketplace</h3>
          <p>This project's tokens are listed at <strong>{project.price} ETH/token</strong>.</p>
          <Link to="/marketplace" className="marketplace-link">
            Buy on Marketplace →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
