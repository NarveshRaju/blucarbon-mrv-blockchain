import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Clock,
  AlertCircle,
  Satellite,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { getRoleAuth } from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import './Governance.css';

// Simulated proposals stored in localStorage for persistence
const PROPOSALS_KEY = 'bcd_governance_proposals_v2';

const getDefaultProposals = () => [
  {
    id: 'prop-001',
    title: 'Approve Mangrove Restoration in Sundarbans',
    description: 'Proposal to approve the Mangrove Restoration Initiative project submitted by Ocean Conservation Alliance. Restores 250 hectares of tidal mangrove forest in the Sundarbans delta.',
    type: 'project_approval',
    proposer: '0x742d...35Cc',
    forVotes: 6,
    againstVotes: 1,
    abstainVotes: 0,
    quorum: 10,
    status: 'passed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {
      '0x742d35cc11111111111111111111111111111111': { vote: 'for', name: '0x742d...35Cc (DAO Steward)' },
      '0x8ba19fe222222222222222222222222222222222': { vote: 'for', name: '0x8ba1...9fE2 (DAO Member)' },
      '0x3ef41ab733333333333333333333333333333333': { vote: 'for', name: '0x3ef4...3333 (Council)' },
      '0x4ab21fc444444444444444444444444444444444': { vote: 'for', name: '0x4ab2...4444 (Lead Auditor)' },
      '0x5cd32ea555555555555555555555555555555555': { vote: 'for', name: '0x5cd3...5555 (Scientific Officer)' },
      '0x6ef43db666666666666666666666666666666666': { vote: 'for', name: '0x6ef4...6666 (Auditor)' },
      '0x7fa54ec777777777777777777777777777777777': { vote: 'against', name: '0x7fa5...7777 (Community Member)' }
    },
  },
  {
    id: 'prop-002',
    title: 'Update Soil Organic Carbon Calculation Baseline',
    description: 'Calibrate default soil carbon stock coefficient to 120 tC/ha for tropical high-salinity coastal mudflats based on new oceanic research.',
    type: 'parameter_change',
    proposer: '0x8ba1...9fE2',
    forVotes: 4,
    againstVotes: 2,
    abstainVotes: 0,
    quorum: 10,
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {
      '0x8ba19fe222222222222222222222222222222222': { vote: 'for', name: '0x8ba1...9fE2 (DAO Member)' },
      '0x3ef41ab733333333333333333333333333333333': { vote: 'for', name: '0x3ef4...3333 (Council)' },
      '0x4ab21fc444444444444444444444444444444444': { vote: 'for', name: '0x4ab2...4444 (Lead Auditor)' },
      '0x5cd32ea555555555555555555555555555555555': { vote: 'for', name: '0x5cd3...5555 (Scientific Officer)' },
      '0x6ef43db666666666666666666666666666666666': { vote: 'against', name: '0x6ef4...6666 (Auditor)' },
      '0x7fa54ec777777777777777777777777777777777': { vote: 'against', name: '0x7fa5...7777 (Community Member)' }
    },
  },
  {
    id: 'prop-003',
    title: 'Allocate 5,000 BCT to Seagrass Nursery Development',
    description: 'Proposal to allocate 5,000 BCT tokens from the DAO ecosystem fund to establish community-run seagrass nurseries in Chilika Lagoon.',
    type: 'fund_allocation',
    proposer: '0x3eF4...1aB7',
    forVotes: 7,
    againstVotes: 1,
    abstainVotes: 0,
    quorum: 10,
    status: 'passed',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {},
    executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getStoredProposals = () => {
  try {
    const stored = localStorage.getItem(PROPOSALS_KEY);
    return stored ? JSON.parse(stored) : getDefaultProposals();
  } catch { return getDefaultProposals(); }
};

const saveProposals = (proposals) => {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
};

const PROPOSAL_TYPES = {
  project_approval: { label: 'Project Approval', color: '#16a34a' },
  parameter_change: { label: 'Parameter Change', color: '#d97706' },
  fund_allocation: { label: 'Fund Allocation', color: '#2563eb' },
};

const Governance = () => {
  const { userAddress } = useWeb3();
  const { role, ROLES, roleAuthData, setShowRoleSelector } = useRole();
  const [proposals, setProposals] = useState(getStoredProposals);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Check if current user is a Company (cannot vote on DAO proposals)
  const isCompany = role === ROLES.COMPANY || role === 'company' || role === 'investor';
  const isValidator = role === ROLES.VALIDATOR || role === 'validator';
  const canVote = userAddress && !isCompany;

  // Active Validator details (e.g. Dr. Ananya Sharma VAL-2024-001)
  const activeValidator = useMemo(() => {
    if (!isValidator) return null;
    return roleAuthData || getRoleAuth('validator', userAddress);
  }, [isValidator, roleAuthData, userAddress]);

  // Unique voter identity key:
  // - If logged in as Validator: key is `validator_${validatorId.toLowerCase()}` (e.g. validator_val-2024-001)
  // - If general DAO member / Admin / NGO: key is `wallet_${userAddress.toLowerCase()}`
  const currentVoterKey = useMemo(() => {
    if (isValidator && activeValidator?.validatorId) {
      return `validator_${activeValidator.validatorId.toLowerCase().trim()}`;
    }
    return userAddress ? `wallet_${userAddress.toLowerCase().trim()}` : null;
  }, [isValidator, activeValidator, userAddress]);

  const currentVoterDisplayName = useMemo(() => {
    if (isValidator && activeValidator) {
      return `${activeValidator.name || activeValidator.validatorId} (${activeValidator.validatorId})`;
    }
    if (userAddress) {
      return `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    }
    return 'DAO Voter';
  }, [isValidator, activeValidator, userAddress]);

  // Helper to extract vote type for the current user/validator on a proposal
  const getVoterVote = useCallback((proposal) => {
    if (!proposal || !proposal.voters) return null;
    
    // 1. Check by specific validator / voter key
    if (currentVoterKey && proposal.voters[currentVoterKey]) {
      const entry = proposal.voters[currentVoterKey];
      return typeof entry === 'object' ? entry.vote : entry;
    }

    // 2. If non-validator or fallback without validator ID, check userAddress
    if (!isValidator && userAddress) {
      const fallbackKey = userAddress.toLowerCase();
      if (proposal.voters[fallbackKey]) {
        const entry = proposal.voters[fallbackKey];
        return typeof entry === 'object' ? entry.vote : entry;
      }
      const walletKey = `wallet_${userAddress.toLowerCase()}`;
      if (proposal.voters[walletKey]) {
        const entry = proposal.voters[walletKey];
        return typeof entry === 'object' ? entry.vote : entry;
      }
    }

    return null;
  }, [currentVoterKey, isValidator, userAddress]);

  // New proposal form with fixed 7-day validity
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'project_approval',
  });

  // Save proposals whenever they change
  useEffect(() => {
    saveProposals(proposals);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (activeTab === 'active') return p.status === 'active';
      if (activeTab === 'passed') return p.status === 'passed';
      if (activeTab === 'failed') return p.status === 'failed';
      if (activeTab === 'executed') return !!p.executedAt;
      return true;
    });
  }, [proposals, activeTab]);

  // Vote handler: 1 member = 1 vote out of 10 max. >50% (>5 votes) = Approved.
  const handleVote = useCallback((proposalId, voteType) => {
    if (!userAddress || isCompany || !currentVoterKey) return;

    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId || p.status !== 'active') return p;
      if (p.voters && p.voters[currentVoterKey]) return p; // This specific validator/voter already voted

      const currentVoters = p.voters || {};
      const newVoterRecord = {
        vote: voteType,
        voterKey: currentVoterKey,
        name: activeValidator?.name || currentVoterDisplayName,
        validatorId: activeValidator?.validatorId || null,
        organization: activeValidator?.organization || null,
        accreditation: activeValidator?.accreditation || null,
        walletAddress: userAddress,
        votedAt: new Date().toISOString()
      };

      const updatedVoters = {
        ...currentVoters,
        [currentVoterKey]: newVoterRecord
      };
      
      let forVotes = p.forVotes || 0;
      let againstVotes = p.againstVotes || 0;
      let abstainVotes = p.abstainVotes || 0;

      if (voteType === 'for') forVotes += 1;
      else if (voteType === 'against') againstVotes += 1;
      else abstainVotes += 1;

      const totalValidVotes = forVotes + againstVotes;
      const totalCast = totalValidVotes + abstainVotes;

      // Status rule: 50% approval threshold. If For > 5 (out of 10) or total reached 10 with > 50% For
      let status = p.status;
      if (forVotes > 5) {
        status = 'passed';
      } else if (againstVotes >= 5 || (totalCast >= 10 && forVotes <= againstVotes)) {
        status = 'failed';
      }

      return {
        ...p,
        voters: updatedVoters,
        forVotes,
        againstVotes,
        abstainVotes,
        status
      };
    }));
  }, [userAddress, isCompany, currentVoterKey, currentVoterDisplayName, activeValidator]);

  const handleCreateProposal = useCallback(() => {
    if (!newProposal.title || !newProposal.description || !userAddress) return;

    const now = new Date();
    const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // strictly 7 days

    const proposerKey = currentVoterKey || `wallet_${userAddress.toLowerCase()}`;
    const initialVoterRecord = {
      vote: 'for',
      voterKey: proposerKey,
      name: currentVoterDisplayName,
      validatorId: activeValidator?.validatorId || null,
      walletAddress: userAddress,
      votedAt: now.toISOString()
    };

    const proposal = {
      id: `prop-${Date.now()}`,
      title: newProposal.title.trim(),
      description: newProposal.description.trim(),
      type: newProposal.type,
      proposer: currentVoterDisplayName,
      forVotes: 1, // proposer automatically casts initial vote
      againstVotes: 0,
      abstainVotes: 0,
      quorum: 10, // 10 votes only
      status: 'active',
      createdAt: now.toISOString(),
      endsAt: ends.toISOString(), // 7 days validity
      voters: { [proposerKey]: initialVoterRecord },
    };

    setProposals(prev => [proposal, ...prev]);
    setShowCreateModal(false);
    setNewProposal({ title: '', description: '', type: 'project_approval' });
  }, [newProposal, userAddress, currentVoterKey, currentVoterDisplayName, activeValidator]);

  const getTimeRemaining = (endsAt) => {
    const diff = new Date(endsAt) - new Date();
    if (diff <= 0) return 'Voting Closed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left (7-day window)`;
  };

  const calculateApproval = (p) => {
    const total = (p.forVotes || 0) + (p.againstVotes || 0);
    if (total === 0) return 0;
    return Math.round(((p.forVotes || 0) / total) * 100);
  };

  return (
    <div className="governance-container">
      {/* Header */}
      <header className="governance-header">
        <div>
          <h1>DAO Governance Consensus</h1>
          <p><strong>These proposal votes are saved in this browser.</strong> Finalize a real project's approval in its Tokens &amp; transaction panel to automatically submit minting. A validator login is required; no owner wallet signature is needed. View receipts in the <a href="/token-registry">Token Registry</a>.</p>
          <p>Democratic, 7-day consensus voting on validated Blue Carbon proposals (10 votes maximum &bull; &gt;50% threshold to pass).</p>
        </div>
        <div className="governance-stats">
          <div className="voting-power-card">
            <span className="vp-label">Consensus Model</span>
            <span className="vp-value">10 Votes &bull; 50% Threshold</span>
          </div>
          {userAddress && canVote && (
            <button className="create-proposal-btn" onClick={() => setShowCreateModal(true)}>
              + Submit Proposal
            </button>
          )}
        </div>
      </header>

      {/* Active Validator Identity Banner */}
      {isValidator && activeValidator && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #86efac',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#059669', color: '#fff', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#065f46' }}>
                Active DAO Validator: {activeValidator.name} ({activeValidator.validatorId})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                {activeValidator.organization} &bull; <em>{activeValidator.accreditation}</em>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowRoleSelector(true)}
            style={{
              background: '#ffffff',
              color: '#065f46',
              border: '1px solid #86efac',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={13} /> Switch Validator Identity
          </button>
        </div>
      )}

      {/* Role Notice if Company */}
      {isCompany && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.85rem',
          color: '#1e40af'
        }}>
          <AlertCircle size={18} />
          <span><strong>Company Role:</strong> You are browsing as a Company. Voting on governance proposals is reserved for DAO stewards and Validators. You can purchase verified credits in the Marketplace.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="governance-tabs">
        {['active', 'passed', 'failed', 'executed'].map(tab => (
          <button
            key={tab}
            className={`gov-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">
              {proposals.filter(p => {
                if (tab === 'executed') return !!p.executedAt;
                return p.status === tab;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="proposals-list">
        <AnimatePresence>
          {filteredProposals.length > 0 ? (
            filteredProposals.map(proposal => {
              const totalCast = (proposal.forVotes || 0) + (proposal.againstVotes || 0) + (proposal.abstainVotes || 0);
              const approvalPct = calculateApproval(proposal);
              const hasVoted = getVoterVote(proposal);
              const isPassed = (proposal.forVotes || 0) > 5;

              return (
                <motion.div
                  key={proposal.id}
                  className={`proposal-card status-${proposal.status}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <div className="proposal-card-header">
                    <span
                      className="proposal-type-badge"
                      style={{ backgroundColor: PROPOSAL_TYPES[proposal.type]?.color || '#64748b' }}
                    >
                      {PROPOSAL_TYPES[proposal.type]?.label || proposal.type}
                    </span>
                    <span className={`proposal-status-badge ${isPassed ? 'passed' : proposal.status}`}>
                      {proposal.executedAt ? 'Executed' : isPassed ? 'Approved (>50%)' : proposal.status}
                    </span>
                  </div>

                  <h3 className="proposal-title">{proposal.title}</h3>
                  <p className="proposal-proposer" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
                    Proposed by {proposal.proposer} &bull; 7-Day Window
                  </p>

                  {proposal.type === 'project_approval' && (
                    <div className="prop-ai-pill" style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 4 }}>
                      <Satellite size={13} /> Sentinel-2 ML Audited &bull; AI Pre-Verified
                    </div>
                  )}

                  {/* Clean 10-Vote Progress Bar */}
                  <div className="proposal-vote-bar">
                    <div className="vote-bar-container" style={{ height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${(proposal.forVotes / 10) * 100}%`,
                          background: '#16a34a',
                          transition: 'width 0.3s ease'
                        }}
                        title={`Yes: ${proposal.forVotes}`}
                      />
                      <div
                        style={{
                          width: `${(proposal.againstVotes / 10) * 100}%`,
                          background: '#dc2626',
                          transition: 'width 0.3s ease'
                        }}
                        title={`No: ${proposal.againstVotes}`}
                      />
                    </div>
                    <div className="vote-bar-labels" style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Yes: {proposal.forVotes || 0} / 10 votes</span>
                      <span style={{ color: '#64748b' }}>Approval: <strong>{approvalPct}%</strong> ({proposal.forVotes > 5 ? 'Threshold Reached' : '50% required'})</span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>No: {proposal.againstVotes || 0}</span>
                    </div>
                  </div>

                  <div className="proposal-footer" style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Total Cast: <strong>{totalCast} / 10</strong></span>
                    <span><Clock size={12} style={{ display: 'inline', marginRight: 3 }} /> {getTimeRemaining(proposal.endsAt)}</span>
                  </div>

                  {/* Vote Buttons (Only for DAO/Validators, not Companies) */}
                  {proposal.status === 'active' && canVote && !hasVoted && (
                    <div className="proposal-vote-actions" onClick={(e) => e.stopPropagation()} style={{ marginTop: 10 }}>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 6, fontWeight: 500 }}>
                        Cast vote as <strong>{currentVoterDisplayName}</strong>:
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="vote-for-btn"
                          onClick={() => handleVote(proposal.id, 'for')}
                          style={{ flex: 1, padding: '7px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <ThumbsUp size={13} /> Vote Yes (FOR)
                        </button>
                        <button
                          className="vote-against-btn"
                          onClick={() => handleVote(proposal.id, 'against')}
                          style={{ flex: 1, padding: '7px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <ThumbsDown size={13} /> Vote No (AGAINST)
                        </button>
                      </div>
                    </div>
                  )}

                  {hasVoted && (
                    <div className="already-voted" style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> You voted: <strong>{hasVoted.toUpperCase()}</strong> ({currentVoterDisplayName})
                      </span>
                      {isValidator && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowRoleSelector(true); }}
                          style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                        >
                          Switch Validator →
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="no-proposals" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p>No {activeTab} proposals found</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2>Create DAO Proposal</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>
              All proposals are active for strictly <strong>7 days</strong> with a <strong>10-vote quorum</strong> and <strong>50% approval threshold</strong>.
            </p>
            <div className="modal-form">
              <label>Proposal Title</label>
              <input
                type="text"
                placeholder="e.g. Approve Mangrove Project in Sundarbans"
                value={newProposal.title}
                onChange={e => setNewProposal(p => ({ ...p, title: e.target.value }))}
              />

              <label>Proposal Type</label>
              <select
                value={newProposal.type}
                onChange={e => setNewProposal(p => ({ ...p, type: e.target.value }))}
              >
                {Object.entries(PROPOSAL_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              <label>Description</label>
              <textarea
                rows="4"
                placeholder="Detailed rationale and project justification..."
                value={newProposal.description}
                onChange={e => setNewProposal(p => ({ ...p, description: e.target.value }))}
              />

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button
                  className="modal-submit"
                  onClick={handleCreateProposal}
                  disabled={!newProposal.title.trim() || !newProposal.description.trim()}
                >
                  Submit (7-Day Voting)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedProposal && (() => {
        const totalCast = (selectedProposal.forVotes || 0) + (selectedProposal.againstVotes || 0) + (selectedProposal.abstainVotes || 0);
        const voterEntries = selectedProposal.voters ? Object.entries(selectedProposal.voters) : [];

        return (
          <div className="modal-overlay" onClick={() => setSelectedProposal(null)}>
            <div className="modal-content proposal-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  className="proposal-type-badge"
                  style={{ backgroundColor: PROPOSAL_TYPES[selectedProposal.type]?.color || '#64748b' }}
                >
                  {PROPOSAL_TYPES[selectedProposal.type]?.label || selectedProposal.type}
                </span>
                <span className={`proposal-status-badge ${selectedProposal.forVotes > 5 ? 'passed' : selectedProposal.status}`}>
                  {selectedProposal.executedAt ? 'Executed' : selectedProposal.forVotes > 5 ? 'Approved (>50%)' : selectedProposal.status}
                </span>
              </div>

              <h2>{selectedProposal.title}</h2>
              <p className="modal-proposer" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>
                Proposed by {selectedProposal.proposer} &bull; 7-Day Validity Window
              </p>

              <p className="modal-description" style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#334155', marginBottom: 16 }}>
                {selectedProposal.description}
              </p>

              <div className="modal-vote-breakdown" style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#1e293b' }}>Consensus Tally ({totalCast} / 10 Max Votes Cast)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Yes Votes (FOR): {selectedProposal.forVotes || 0}</span>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>No Votes (AGAINST): {selectedProposal.againstVotes || 0}</span>
                </div>
                <div className="vote-bar-container" style={{ height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${((selectedProposal.forVotes || 0) / 10) * 100}%`, background: '#16a34a' }} />
                  <div style={{ width: `${((selectedProposal.againstVotes || 0) / 10) * 100}%`, background: '#dc2626' }} />
                </div>
                <p style={{ margin: '8px 0 12px', fontSize: '0.75rem', color: '#64748b' }}>
                  Current Approval: <strong>{calculateApproval(selectedProposal)}%</strong> &bull; Status: <strong>{selectedProposal.forVotes > 5 ? 'Approved (>50% Threshold)' : 'In Progress'}</strong>
                </p>

                {/* List of Cast Votes */}
                {voterEntries.length > 0 && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Recorded Auditor & Validator Votes:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                      {voterEntries.map(([k, val]) => {
                        const vote = typeof val === 'object' ? val.vote : val;
                        const name = typeof val === 'object' ? (val.name || val.validatorId || k) : k;
                        const isYes = vote === 'for';
                        return (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 8px', background: '#fff', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#334155', fontWeight: 500 }}>{name}</span>
                            <span style={{ fontWeight: 700, color: isYes ? '#16a34a' : '#dc2626', background: isYes ? '#dcfce7' : '#fee2e2', padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                              {isYes ? 'YES / FOR' : 'NO / AGAINST'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-meta" style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                <p><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Created: {new Date(selectedProposal.createdAt).toLocaleDateString()}</p>
                <p><Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {getTimeRemaining(selectedProposal.endsAt)}</p>
              </div>

              <button className="modal-close-btn" onClick={() => setSelectedProposal(null)} style={{ width: '100%', padding: '8px', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Governance;
