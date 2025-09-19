import React from 'react';
import './Verification.css';

const projectsToVerify = [
  {
    name: 'Mangrove Restoration Initiative',
    organization: 'Ocean Conservation Alliance',
    location: 'Sundarbans, Bangladesh',
    type: 'Mangrove',
    trees: '2,500 trees',
    date: '1/15/2024',
    status: 'Approved',
    votes: '8 / 1'
  },
  {
    name: 'Seagrass Meadow Protection',
    organization: 'Marine Biodiversity Foundation',
    location: 'Great Barrier Reef, Australia',
    type: 'Seagrass',
    trees: '1,800 trees',
    date: '1/20/2024',
    status: 'Pending'
    // votes property is omitted for Pending status as in the UI
  }
];

const VerificationCard = ({ project }) => (
  <div className="verification-card">
    <div className="card-main-info">
      <h2>{project.name}</h2>
      <p className="organization">{project.organization}</p>
      <div className="project-meta">
        <span>📍 {project.location}</span>
        <span> Mangrove</span> {/* Placeholder icon */}
        <span>🌲 {project.trees}</span>
      </div>
      <p className="submission-date">🗓️ {project.date}</p>
    </div>
    <div className="card-actions">
        <span className={`status-tag ${project.status.toLowerCase()}`}>{project.status}</span>
        {project.votes && <div className="votes">Votes: <strong>{project.votes}</strong></div>}
        <button className="review-button">👁️ Review</button>
    </div>
  </div>
);


const Verification = () => {
  return (
    <div className="verification-container">
      <header className="page-header">
        <h1>Project Verification</h1>
        <p>Review and verify blue carbon projects</p>
      </header>

      <div className="filter-container">
        <input type="search" placeholder="Search projects, NGOs, or locations..." className="filter-search" />
        <select className="filter-status">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="projects-list">
        {projectsToVerify.map((project, index) => (
          <VerificationCard key={index} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Verification;    