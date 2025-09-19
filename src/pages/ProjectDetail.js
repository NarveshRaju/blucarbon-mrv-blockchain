import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams(); // this comes from /project/:projectId
  const API = process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com";

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/forms`)
      .then(res => {
        // Find project by _id
        const found = res.data.find(p => p._id === projectId);
        setProject(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching project:", err);
        setError("Failed to fetch project details");
        setLoading(false);
      });
  }, [API, projectId]);

  if (loading) return <div className="project-detail-container"><p>Loading...</p></div>;
  if (error) return <div className="project-detail-container"><p>{error}</p></div>;
  if (!project) {
    return (
      <div className="project-detail-container">
        <h2>Project Not Found</h2>
        <Link to="/">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <Link to="/" className="back-link">← Back to Dashboard</Link>
      
      <div className="detail-header">
        <h1>{project.ngoName}</h1>
        <span className={`detail-status-badge ${project.status?.toLowerCase() || "pending"}`}>
          {project.status || "Pending"}
        </span>
      </div>
      <p className="detail-organization">{project.username}</p>

      <div className="detail-grid">
        <div className="detail-card">
          <h4>Location</h4>
          <p>📍 {project.location}</p>
        </div>
        <div className="detail-card">
          <h4>Plantation Type</h4>
          <p>🌿 {project.plantationType}</p>
        </div>
        <div className="detail-card">
          <h4>Saplings Planted</h4>
          <p>🌳 {project.saplingsPlanted?.toLocaleString()}</p>
        </div>
        <div className="detail-card">
          <h4>Submitted On</h4>
          <p>🗓️ {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="detail-description">
        <h3>Project Overview</h3>
        <p>{project.description}</p>
      </div>

      {project.imageUrl && (
        <div className="detail-image">
          <h3>Uploaded Image</h3>
          <img src={project.imageUrl} alt="Project visual" />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
