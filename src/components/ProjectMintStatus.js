import React from 'react';
import { Link } from 'react-router-dom';
import { getMintStatus } from '../utils/mintStatus';
import './ProjectMintStatus.css';

export default function ProjectMintStatus({ project, config, canApprove, onMint, onRefresh, busy, message, showActions = true }) {
  const state = getMintStatus(project);
  const awaitingFinalApproval = ['dao_review', 'validator_approved'].includes(project.status);
  return <section className="project-mint-status" aria-labelledby="mint-status-heading">
    <h2 id="mint-status-heading">Tokens & transaction</h2>
    <p><strong>{state.label}</strong></p>
    <p>{state.description}</p>
    <dl>
      <div><dt>Confirmed tokens issued</dt><dd>{state.confirmed ? (project.mintedTokens || 0).toLocaleString() : '0'} demo BCT</dd></div>
      {!state.confirmed && <div><dt>Planned demo allocation</dt><dd>{(project.saplingsPlanted || 0).toLocaleString()} BCT</dd></div>}
      <div><dt>Recipient wallet</dt><dd>{project.walletAddress || 'Not set'}</dd></div>
      <div><dt>Transaction</dt><dd>{project.blockchainTx
        ? <a href={'https://sepolia.etherscan.io/tx/' + project.blockchainTx} target="_blank" rel="noreferrer">{project.blockchainTx} ↗</a>
        : 'No transaction recorded'}</dd></div>
      {project.blockchainBlock && <div><dt>Confirmed block</dt><dd>{project.blockchainBlock}</dd></div>}
    </dl>
    {showActions && (state.ready || awaitingFinalApproval) && <p>Final approval automatically submits minting from the backend. No owner wallet connection or wallet signature is needed. {canApprove ? 'Use your validator login to approve and issue tokens.' : 'A signed-in validator must finalize approval.'}</p>}
    <div className="mint-status-actions">
      {showActions && canApprove && !project.blockchainTx && project.blockchainState !== 'preparing' && (state.ready || awaitingFinalApproval || project.blockchainState === 'failed') && <button onClick={onMint} disabled={busy}>{busy ? 'Submitting…' : state.ready || project.blockchainState === 'failed' ? 'Issue approved demo tokens' : 'Approve & issue demo tokens'}</button>}
      {showActions && <button onClick={onRefresh} disabled={busy}>Refresh transaction status</button>}
      <Link to="/token-registry">Open Token Registry</Link>
      {config?.contractAddress && <a href={'https://sepolia.etherscan.io/token/' + config.contractAddress + (project.walletAddress ? '?a=' + project.walletAddress : '')} target="_blank" rel="noreferrer">View recipient’s tokens on Sepolia ↗</a>}
    </div>
    {message && <p role="status">{message}</p>}
    <small>Sepolia test tokens have no monetary value. The backend uses test ETH for gas.</small>
  </section>;
}
