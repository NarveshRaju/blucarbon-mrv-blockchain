import React from 'react';
import './TokenRegistry.css';

const summaryData = {
  totalCredits: "2,700",
  verifiedProjects: "2",
  treesVerified: "5,400"
};

const registryProjects = [
  {
    name: 'Mangrove Restoration Initiative',
    organization: 'Ocean Conservation Alliance',
    location: 'Sundarbans, Bangladesh',
    type: 'Mangrove',
    date: '1/15/2024',
    tokens: '1,250',
    trees: '2,500 trees'
  },
  {
    name: 'Seagrass Recovery Program',
    organization: 'Mediterranean Sea Foundation',
    location: 'Balearic Islands, Spain',
    type: 'Seagrass',
    date: '2/5/2024',
    tokens: '1,450',
    trees: '2,900 trees'
  }
];

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
            <h3>{project.name} <span className="verified-tag">Verified</span></h3>
            <p>{project.organization}</p>
            <div className="item-meta">
                <span>📍 {project.location}</span>
                <span>🌿 {project.type}</span>
                <span>🗓️ {project.date}</span>
            </div>
        </div>
        <div className="item-credits">
            <div className="bct-tokens">{project.tokens}</div>
            <div className="bct-label">BCT Tokens</div>
            <div className="trees-count">{project.trees}</div>
        </div>
    </div>
);


const TokenRegistry = () => {
  return (
    <div className="token-registry-container">
        <header className="page-header">
            <h1>Token Registry</h1>
            <p>View verified carbon credits and token allocations</p>
        </header>

        <section className="summary-grid">
            <SummaryCard title="Total Carbon Credits" value={summaryData.totalCredits} label="BCT tokens issued" />
            <SummaryCard title="Verified Projects" value={summaryData.verifiedProjects} label="Projects approved" />
            <SummaryCard title="Trees Verified" value={summaryData.treesVerified} label="Total trees planted" />
        </section>

        <section className="credit-registry">
            <h2>Carbon Credit Registry</h2>
            <p>Verified projects and their associated carbon credits</p>
            <div className="registry-list">
                {registryProjects.map((project, index) => (
                    <RegistryItem key={index} project={project} />
                ))}
            </div>
        </section>
    </div>
  );
};

export default TokenRegistry;