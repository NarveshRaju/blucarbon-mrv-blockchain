// Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

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
      <h3 className="project-name">{project.ngoName}</h3>
      <span className={`status-badge ${project.status?.toLowerCase() || "pending"}`}>
        {project.status || "Pending"}
      </span>
    </div>
    <p className="project-type">{project.plantationType}</p>
    <div className="project-details">
      <p>📍 {project.location}</p>
      <p>🌳 {project.saplingsPlanted?.toLocaleString()} trees</p>
      <p>🗓️ Submitted {new Date(project.createdAt).toLocaleDateString()}</p>
    </div>
    <Link to={`/project/${project._id}`} className="details-button">
      View Details
    </Link>
  </div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com";
    axios.get(`${API}/forms`)
      .then(res => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching forms:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading projects...</p>;

  // Calculate stats dynamically
  const total = projects.length;
  const approved = projects.filter(p => p.status === "Approved").length;
  const pending = projects.filter(p => p.status === "Pending").length;
  const rejected = projects.filter(p => p.status === "Rejected").length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Blue Carbon DAO Dashboard</h1>
        <p>Monitor and verify blue carbon projects worldwide</p>
        <button className="profile-button">Profile</button>
      </header>

      <section className="stats-grid">
        <StatCard title="Total Projects" value={total} label="Active submissions" />
        <StatCard title="Pending Approvals" value={pending} label="Awaiting verification" />
        <StatCard title="Approved" value={approved} label="Verified projects" />
        <StatCard title="Rejected" value={rejected} label="Failed verification" />
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
        {projects.map(project => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
