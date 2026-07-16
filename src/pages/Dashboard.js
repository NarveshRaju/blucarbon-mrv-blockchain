import React, { useEffect, useState, useMemo } from 'react';
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
      {/* The main heading is now the project's name */}
      <h3 className="project-name">{project.projectName}</h3>
      <span className={`status-badge ${project.status?.toLowerCase() || "pending"}`}>
        {project.status || "Pending"}
      </span>
    </div>
    {/* Added a new line to display the NGO name */}
 
    <p className="project-type">{project.plantationType}</p>
    <div className="project-details">
      <p>📍 {project.location}</p>
      <p>🌳 {project.saplingsPlanted?.toLocaleString()} trees</p>
      <p>🗓️ Submitted {new Date(project.createdAt).toLocaleDateString()}</p>
    </div>
    <Link to={`/project/${project.projectId}`} className="details-button">
      View Details
    </Link>
  </div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com";
    axios.get(`${API}/projects-for-sale`)
      .then(res => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching projects:", err);
        setLoading(false);
      });
  }, []);

  const filteredProjects = useMemo(() => {
    return projects
      // Use projectId for the filter key, as it's what the API provides
      .filter(p => p && p.projectId)
      .filter(project => {
        if (statusFilter === 'all') return true;
        return project.status?.toLowerCase() === statusFilter;
      })
      .filter(project => {
        const term = searchTerm.toLowerCase();

        // If search term is empty, show all projects
        if (!term) {
          return true;
        }

        // Only search if there is a term
        return (
          project.projectName?.toLowerCase().includes(term) ||
          project.ngoName?.toLowerCase().includes(term) ||
          project.location?.toLowerCase().includes(term)
        );
      });
  }, [projects, searchTerm, statusFilter]);

  if (loading) return <div className="dashboard-container"><p>Loading projects...</p></div>;

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
        <input
          type="search"
          placeholder="Search projects, NGOs, or locations..."
          className="search-bar"
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="status-dropdown"
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </section>

      <section className="projects-grid">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <ProjectCard key={project.projectId} project={project} />
          ))
        ) : (
          <p>No projects match your current filters.</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

