import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './Dashboard.css';

// Data can be fetched from an API in a real application
// Added 'id' to each project for unique routing
const projects = [
  { id: 1, name: 'Mangrove Restoration Initiative', type: 'Ocean Conservation Alliance', status: 'Approved', location: 'Sundarbans, Bangladesh', trees: 2500, submitted: '1/15/2024' },
  { id: 2, name: 'Seagrass Meadow Protection', type: 'Marine Biodiversity Foundation', status: 'Pending', location: 'Great Barrier Reef, Australia', trees: 1800, submitted: '1/20/2024' },
  { id: 3, name: 'Salt Marsh Rehabilitation', type: 'Coastal Restoration Society', status: 'Rejected', location: 'San Francisco Bay, USA', trees: 3200, submitted: '1/25/2024' },
  { id: 4, name: 'Coastal Mangrove Expansion', type: 'Blue Planet Initiative', status: 'Pending', location: 'Coastal Area, Kenya', trees: 4000, submitted: '2/01/2024' },
  { id: 5, name: 'Seagrass Recovery Program', type: 'Mediterranean Sea Foundation', status: 'Approved', location: 'Balearic Islands, Spain', trees: 2900, submitted: '2/05/2024' },
];
    
const StatCard = ({ title, value, label }) => (
  <div className="stat-card">
    <p className="stat-title">{title}</p>
    <p className="stat-value">{value}</p>
    <p className="stat-label">{label}</p>
  </div>
);

const ProjectCard = ({ project }) => (
  <div className="project-card">
    <div className="project-header">
      <h3 className="project-name">{project.name}</h3>
      <span className={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
    </div>
    <p className="project-type">{project.type}</p>
    <div className="project-details">
      <p>📍 {project.location}</p>
      <p>🌳 {project.trees.toLocaleString()} trees</p>
      <p>🗓️ Submitted {project.submitted}</p>
    </div>
    {/* Replaced the button with a Link component */}
    <Link to={`/project/${project.id}`} className="details-button">
        View Details
    </Link>
  </div>
);

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Blue Carbon DAO Dashboard</h1>
        <p>Monitor and verify blue carbon projects worldwide</p>
        <button className="profile-button">Profile</button>
      </header>

      <section className="stats-grid">
        <StatCard title="Total Projects" value="5" label="Active submissions" />
        <StatCard title="Pending Approvals" value="2" label="Awaiting verification" />
        <StatCard title="Approved" value="2" label="Verified projects" />
        <StatCard title="Rejected" value="1" label="Failed verification" />
      </section>

      <section className="project-filters">
        <input type="search" placeholder="Search projects, NGOs, or locations..." className="search-bar" />
        <select className="status-dropdown">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </section>

      <section className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
