import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Sprout, Calendar } from 'lucide-react';
import apiClient from '../services/api';
import { useWeb3 } from '../Web3Context';
import { formatUnits } from 'ethers';
import './TokenRegistry.css';
import { Link } from 'react-router-dom';
import { getMintStatus } from '../utils/mintStatus';

const SummaryCard = ({ title, value, label }) => (
  <div className="summary-card">
    <div className="card-title">{title}</div>
    <div className="card-value">{value}</div>
    <div className="card-label">{label}</div>
  </div>
);

const RegistryItem = ({ project }) => (
  <div className="registry-item">
    <div className="item-details">
      <h3>
        <Link to={'/project/' + (project._id || project.projectId)}>{project.projectName}</Link>
        {project.status === 'Approved' && <span className="verified-tag">Verified</span>}
        {project.status === 'Pending' && <span className="pending-tag">Pending</span>}
      </h3>
      <p>{project.ngoId}</p>
      <p><strong>{getMintStatus(project).label}</strong></p>
      {project.blockchainTx ? <p><a href={'https://sepolia.etherscan.io/tx/' + project.blockchainTx} target="_blank" rel="noreferrer">View mint transaction ↗</a></p> : <p>No mint transaction recorded</p>}
      <div className="item-meta">
        <span><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.location}</span>
        <span><Sprout size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.plantationType}</span>
        <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <div className="item-credits">
      <div className="bct-tokens">
        {(project.blockchainState === 'confirmed' ? project.totalTokens || 0 : 0).toLocaleString()}
      </div>
      <div className="bct-label">Demo BCT tokens</div>
      <div className="trees-count">
        {(project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()} trees
      </div>
    </div>
  </div>
);

const TokenRegistry = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { totalSupply, bctBalance, userAddress, blockchainConfig, refreshBlockchain } = useWeb3();
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = () => apiClient.get('/projects-for-sale')
      .then(res => { setProjects(res.data); setLoadError(''); })
      .catch(() => setLoadError('Unable to load project issuance records. Please reload.'))
      .finally(() => setLoading(false));
    load();
    refreshBlockchain(userAddress);
    const timer = setInterval(() => { load(); refreshBlockchain(userAddress); }, 15000);
    return () => clearInterval(timer);
  }, [refreshBlockchain, userAddress]);

  const summary = useMemo(() => {
    const approved = projects.filter(p => getMintStatus(p).confirmed);
    const totalTrees = projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0);

    let supplyFormatted = '0';
    try {
      if (totalSupply && totalSupply !== '0') {
        supplyFormatted = parseFloat(formatUnits(totalSupply, 18)).toLocaleString();
      }
    } catch { /* ignore */ }

    return {
      totalCredits: supplyFormatted,
      verifiedProjects: approved.length.toString(),
      treesVerified: totalTrees.toLocaleString(),
    };
  }, [projects, totalSupply]);

  if (loading) return <div className="token-registry-container"><p>Loading registry...</p></div>;

  return (
    <div className="token-registry-container">
      <header className="page-header">
        <h1>Issued tokens</h1>
        <p>Sepolia demo tokens — no monetary value or certified carbon-credit status. Users pay no gas.</p>
      </header>
      {loadError && <p role="alert">{loadError}</p>}
      <p>Approval starts token issuance. Tokens appear here after the transaction is confirmed. To follow a pending project, choose All projects or open it from your workspace.</p>
      <p>Your connected wallet: <strong>{userAddress ? (blockchainConfig ? Number(formatUnits(bctBalance, 18)).toLocaleString() + ' BCT' : 'Balance unavailable') : 'Connect a wallet to see its BCT balance'}</strong></p>

      <section className="summary-grid">
        <SummaryCard title="Contract Token Supply" value={blockchainConfig ? summary.totalCredits : 'Unavailable'} label="All BCT issued by the configured contract" />
        <SummaryCard title="Projects with Minted Tokens" value={summary.verifiedProjects} label="Confirmed mint transactions recorded by this app" />
        <SummaryCard title="Awaiting completion" value={projects.filter(p => !getMintStatus(p).confirmed).length} label="Projects without a confirmed mint receipt" />
      </section>

      <section className="credit-registry">
        <h2>Project receipts</h2>
        <div className="journey-tools">
          <button aria-pressed={!showAll} onClick={() => setShowAll(false)}>Issued tokens</button>
          <button aria-pressed={showAll} onClick={() => setShowAll(true)}>All projects</button>
        </div>
        {!showAll && !projects.some(p => getMintStatus(p).confirmed) && <p>No confirmed token issuances are recorded yet. <Link to="/dashboard">Continue a project from your workspace.</Link></p>}
        <div className="registry-list">
          {projects.filter(p => showAll || getMintStatus(p).confirmed).map((project, index) => (
            <RegistryItem key={project.projectId || index} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TokenRegistry;
