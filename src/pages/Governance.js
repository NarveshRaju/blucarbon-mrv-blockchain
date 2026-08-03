import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeb3 } from '../Web3Context';
import { formatUnits } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import './Governance.css';

// Simulated proposals stored in localStorage for persistence
const PROPOSALS_KEY = 'bcd_governance_proposals';

const getStoredProposals = () => {
  try {
    const stored = localStorage.getItem(PROPOSALS_KEY);
    return stored ? JSON.parse(stored) : getDefaultProposals();
  } catch { return getDefaultProposals(); }
};

const saveProposals = (proposals) => {
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
};

const getDefaultProposals = () => [
  {
    id: 'prop-001',
    title: 'Approve Mangrove Restoration in Sundarbans',
    description: 'Proposal to approve the Mangrove Restoration Initiative project submitted by Ocean Conservation Alliance. The project aims to restore 500 hectares of mangrove forest in the Sundarbans delta, sequestering an estimated 2,500 tonnes of CO₂ annually.',
    type: 'project_approval',
    proposer: '0x742d...35Cc',
    forVotes: 1250,
    againstVotes: 340,
    abstainVotes: 85,
    quorum: 1000,
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {},
  },
  {
    id: 'prop-002',
    title: 'Increase Validator Staking Requirement to 500 BCT',
    description: 'This proposal suggests increasing the minimum staking requirement for validators from 100 BCT to 500 BCT. This change aims to ensure only serious participants act as validators, improving the quality of project verification.',
    type: 'parameter_change',
    proposer: '0x8ba1...9fE2',
    forVotes: 890,
    againstVotes: 1100,
    abstainVotes: 210,
    quorum: 1000,
    status: 'failed',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {},
  },
  {
    id: 'prop-003',
    title: 'Allocate 10,000 BCT to Seagrass Research Fund',
    description: 'Proposal to allocate 10,000 BCT tokens from the DAO treasury to fund seagrass meadow research across Southeast Asian coastlines. The funds will be distributed across 5 research institutions over 2 years.',
    type: 'fund_allocation',
    proposer: '0x3eF4...1aB7',
    forVotes: 2100,
    againstVotes: 150,
    abstainVotes: 50,
    quorum: 1000,
    status: 'passed',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    voters: {},
    executedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const PROPOSAL_TYPES = {
  project_approval: { label: 'Project Approval', color: '#34a853' },
  parameter_change: { label: 'Parameter Change', color: '#fbbc05' },
  fund_allocation: { label: 'Fund Allocation', color: '#1a73e8' },
};

const Governance = () => {
  const { userAddress, bctBalance } = useWeb3();
  const [proposals, setProposals] = useState(getStoredProposals);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegationStatus, setDelegationStatus] = useState('');

  // New proposal form
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'project_approval',
    duration: 7,
  });

  const votingPower = useMemo(() => {
    try {
      return bctBalance && bctBalance !== '0'
        ? parseFloat(formatUnits(bctBalance, 18))
        : 0;
    } catch { return 0; }
  }, [bctBalance]);

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

  const handleVote = useCallback((proposalId, voteType) => {
    if (!userAddress || votingPower <= 0) return;

    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId || p.status !== 'active') return p;
      if (p.voters[userAddress]) return p; // Already voted

      const updated = { ...p, voters: { ...p.voters, [userAddress]: voteType } };
      if (voteType === 'for') updated.forVotes += votingPower;
      else if (voteType === 'against') updated.againstVotes += votingPower;
      else updated.abstainVotes += votingPower;

      return updated;
    }));
  }, [userAddress, votingPower]);

  const handleCreateProposal = useCallback(() => {
    if (!newProposal.title || !newProposal.description || !userAddress) return;

    const proposal = {
      id: `prop-${Date.now()}`,
      ...newProposal,
      proposer: `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      quorum: 1000,
      status: 'active',
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + newProposal.duration * 24 * 60 * 60 * 1000).toISOString(),
      voters: {},
    };

    setProposals(prev => [proposal, ...prev]);
    setShowCreateModal(false);
    setNewProposal({ title: '', description: '', type: 'project_approval', duration: 7 });
  }, [newProposal, userAddress]);

  const handleDelegate = () => {
    if (!delegateAddress || delegateAddress.length < 10) return;
    localStorage.setItem(`bcd_delegate_${userAddress?.toLowerCase()}`, delegateAddress);
    setDelegationStatus(`Delegated to ${delegateAddress.substring(0, 6)}...${delegateAddress.substring(delegateAddress.length - 4)}`);
    setTimeout(() => setDelegationStatus(''), 3000);
  };

  const getTimeRemaining = (endsAt) => {
    const diff = new Date(endsAt) - new Date();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  const getQuorumPercent = (p) => {
    const total = p.forVotes + p.againstVotes + p.abstainVotes;
    return Math.min((total / p.quorum) * 100, 100);
  };

  return (
    <div className="governance-container">
      <header className="governance-header">
        <div>
          <h1>DAO Governance</h1>
          <p>Create proposals, vote, and shape the future of Blue Carbon</p>
        </div>
        <div className="governance-stats">
          <div className="voting-power-card">
            <span className="vp-label">Your Voting Power</span>
            <span className="vp-value">{votingPower.toLocaleString()} BCT</span>
          </div>
          {userAddress && (
            <button className="create-proposal-btn" onClick={() => setShowCreateModal(true)}>
              + New Proposal
            </button>
          )}
        </div>
      </header>

      {/* Delegation Section */}
      <section className="delegation-section">
        <h3>🤝 Vote Delegation</h3>
        <p>Delegate your voting power to a trusted validator or community member</p>
        <div className="delegation-form">
          <input
            type="text"
            placeholder="Enter delegate wallet address (0x...)"
            value={delegateAddress}
            onChange={(e) => setDelegateAddress(e.target.value)}
            className="delegate-input"
          />
          <button className="delegate-btn" onClick={handleDelegate} disabled={!userAddress}>
            Delegate
          </button>
        </div>
        {delegationStatus && <p className="delegation-status">✅ {delegationStatus}</p>}
      </section>

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
            filteredProposals.map(proposal => (
              <motion.div
                key={proposal.id}
                className={`proposal-card status-${proposal.status}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="proposal-card-header">
                  <span
                    className="proposal-type-badge"
                    style={{ backgroundColor: PROPOSAL_TYPES[proposal.type]?.color || '#666' }}
                  >
                    {PROPOSAL_TYPES[proposal.type]?.label || proposal.type}
                  </span>
                  <span className={`proposal-status-badge ${proposal.status}`}>
                    {proposal.executedAt ? 'Executed' : proposal.status}
                  </span>
                </div>

                <h3 className="proposal-title">{proposal.title}</h3>
                <p className="proposal-proposer">Proposed by {proposal.proposer}</p>

                <div className="proposal-vote-bar">
                  <div className="vote-bar-container">
                    <div
                      className="vote-bar-for"
                      style={{ width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes || 1)) * 100}%` }}
                    />
                    <div
                      className="vote-bar-against"
                      style={{ width: `${(proposal.againstVotes / (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="vote-bar-labels">
                    <span className="for-label">For: {proposal.forVotes.toLocaleString()}</span>
                    <span className="against-label">Against: {proposal.againstVotes.toLocaleString()}</span>
                  </div>
                </div>

                <div className="proposal-footer">
                  <span className="quorum-info">
                    Quorum: {getQuorumPercent(proposal).toFixed(0)}%
                  </span>
                  <span className="time-remaining">
                    {getTimeRemaining(proposal.endsAt)}
                  </span>
                </div>

                {proposal.status === 'active' && userAddress && !proposal.voters[userAddress] && (
                  <div className="proposal-vote-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="vote-for-btn" onClick={() => handleVote(proposal.id, 'for')}>
                      👍 For
                    </button>
                    <button className="vote-against-btn" onClick={() => handleVote(proposal.id, 'against')}>
                      👎 Against
                    </button>
                    <button className="vote-abstain-btn" onClick={() => handleVote(proposal.id, 'abstain')}>
                      ➖ Abstain
                    </button>
                  </div>
                )}

                {proposal.voters[userAddress] && (
                  <p className="already-voted">✅ You voted: {proposal.voters[userAddress]}</p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="no-proposals">
              <p>No {activeTab} proposals found</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Proposal</h2>
            <div className="modal-form">
              <label>Proposal Title</label>
              <input
                type="text"
                placeholder="Enter a clear, descriptive title..."
                value={newProposal.title}
                onChange={e => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
              />

              <label>Description</label>
              <textarea
                placeholder="Describe the proposal in detail..."
                rows={5}
                value={newProposal.description}
                onChange={e => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
              />

              <label>Proposal Type</label>
              <select
                value={newProposal.type}
                onChange={e => setNewProposal(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="project_approval">Project Approval</option>
                <option value="parameter_change">Parameter Change</option>
                <option value="fund_allocation">Fund Allocation</option>
              </select>

              <label>Voting Duration (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newProposal.duration}
                onChange={e => setNewProposal(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
              />

              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="modal-submit" onClick={handleCreateProposal}>
                  Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <div className="modal-overlay" onClick={() => setSelectedProposal(null)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <span
              className="proposal-type-badge"
              style={{ backgroundColor: PROPOSAL_TYPES[selectedProposal.type]?.color }}
            >
              {PROPOSAL_TYPES[selectedProposal.type]?.label}
            </span>
            <h2>{selectedProposal.title}</h2>
            <p className="modal-proposer">Proposed by {selectedProposal.proposer}</p>
            <p className="modal-description">{selectedProposal.description}</p>

            <div className="modal-vote-detail">
              <div className="vote-detail-row">
                <span>For</span>
                <div className="vote-detail-bar">
                  <div className="vd-fill for" style={{ width: `${(selectedProposal.forVotes / (selectedProposal.forVotes + selectedProposal.againstVotes + selectedProposal.abstainVotes || 1)) * 100}%` }} />
                </div>
                <span className="vote-detail-count">{selectedProposal.forVotes.toLocaleString()}</span>
              </div>
              <div className="vote-detail-row">
                <span>Against</span>
                <div className="vote-detail-bar">
                  <div className="vd-fill against" style={{ width: `${(selectedProposal.againstVotes / (selectedProposal.forVotes + selectedProposal.againstVotes + selectedProposal.abstainVotes || 1)) * 100}%` }} />
                </div>
                <span className="vote-detail-count">{selectedProposal.againstVotes.toLocaleString()}</span>
              </div>
              <div className="vote-detail-row">
                <span>Abstain</span>
                <div className="vote-detail-bar">
                  <div className="vd-fill abstain" style={{ width: `${(selectedProposal.abstainVotes / (selectedProposal.forVotes + selectedProposal.againstVotes + selectedProposal.abstainVotes || 1)) * 100}%` }} />
                </div>
                <span className="vote-detail-count">{selectedProposal.abstainVotes.toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-meta">
              <p>📅 Created: {new Date(selectedProposal.createdAt).toLocaleDateString()}</p>
              <p>⏰ {getTimeRemaining(selectedProposal.endsAt)}</p>
              <p>📊 Quorum: {getQuorumPercent(selectedProposal).toFixed(0)}% reached</p>
              {selectedProposal.executedAt && (
                <p>✅ Executed: {new Date(selectedProposal.executedAt).toLocaleDateString()}</p>
              )}
            </div>

            <button className="modal-close-btn" onClick={() => setSelectedProposal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Governance;
