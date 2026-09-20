import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Sprout, Calendar } from 'lucide-react';
import apiClient from '../services/api';
import { useWeb3 } from '../Web3Context';
import { formatUnits } from 'ethers';
import './TokenRegistry.css';

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
        {project.projectName}
        {project.status === 'Approved' && <span className="verified-tag">Verified</span>}
        {project.status === 'Pending' && <span className="pending-tag">Pending</span>}
      </h3>
      <p>{project.ngoId}</p>
      <div className="item-meta">
        <span><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.location}</span>
        <span><Sprout size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.plantationType}</span>
        <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <div className="item-credits">
      <div className="bct-tokens">
        {(project.totalTokens || project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()}
      </div>
      <div className="bct-label">BCT Tokens</div>
      <div className="trees-count">
        {(project.saplingsPlanted || project.noOfPlantations || 0).toLocaleString()} trees
      </div>
    </div>
  </div>
);

const TokenRegistry = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { totalSupply } = useWeb3();

  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to fetch registry data:', err))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const approved = projects.filter(p => p.status === 'Approved');
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
        <h1>Token Registry</h1>
        <p>View verified carbon credits and token allocations</p>
      </header>

      <section className="summary-grid">
        <SummaryCard title="Total Carbon Credits" value={summary.totalCredits} label="BCT tokens issued (on-chain)" />
        <SummaryCard title="Verified Projects" value={summary.verifiedProjects} label="Projects approved" />
        <SummaryCard title="Trees Verified" value={summary.treesVerified} label="Total trees planted" />
      </section>

      <section className="credit-registry">
        <h2>Carbon Credit Registry</h2>
        <p>All projects and their associated carbon credits — {projects.length} total</p>
        <div className="registry-list">
          {projects.map((project, index) => (
            <RegistryItem key={project.projectId || index} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TokenRegistry;