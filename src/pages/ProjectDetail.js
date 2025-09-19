import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProjectDetail.css';

// In a real app, you would fetch this data based on the ID.
// For now, we'll create a larger dataset to pull from.
const allProjects = [
  { id: 1, name: 'Mangrove Restoration Initiative', organization: 'Ocean Conservation Alliance', status: 'Approved', location: 'Sundarbans, Bangladesh', ecosystem: 'Mangrove', trees: 2500, submitted: '1/15/2024', description: 'This initiative focuses on restoring 500 hectares of mangrove forests in the Sundarbans, a critical habitat for biodiversity and a natural barrier against coastal erosion.' },
  { id: 2, name: 'Seagrass Meadow Protection', organization: 'Marine Biodiversity Foundation', status: 'Pending', location: 'Great Barrier Reef, Australia', ecosystem: 'Seagrass', trees: 1800, submitted: '1/20/2024', description: 'A project aimed at protecting and rehabilitating seagrass meadows which are vital for carbon sequestration and serve as nurseries for marine life.' },
  { id: 3, name: 'Salt Marsh Rehabilitation', organization: 'Coastal Restoration Society', status: 'Rejected', location: 'San Francisco Bay, USA', ecosystem: 'Salt Marsh', trees: 3200, submitted: '1/25/2024', description: 'This project proposal for salt marsh rehabilitation did not meet the required criteria for carbon sequestration verification and has been rejected.' },
  // ... add other projects if needed
];


const ProjectDetail = () => {
    // Get the project ID from the URL
    const { projectId } = useParams();
    const project = allProjects.find(p => p.id === parseInt(projectId));

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
                <h1>{project.name}</h1>
                <span className={`detail-status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
            </div>
            <p className="detail-organization">{project.organization}</p>

            <div className="detail-grid">
                <div className="detail-card">
                    <h4>Location</h4>
                    <p>📍 {project.location}</p>
                </div>
                <div className="detail-card">
                    <h4>Ecosystem</h4>
                    <p>🌿 {project.ecosystem}</p>
                </div>
                <div className="detail-card">
                    <h4>Scale</h4>
                    <p>🌳 {project.trees.toLocaleString()} trees</p>
                </div>
                <div className="detail-card">
                    <h4>Submitted On</h4>
                    <p>🗓️ {project.submitted}</p>
                </div>
            </div>

            <div className="detail-description">
                <h3>Project Overview</h3>
                <p>{project.description}</p>
            </div>
        </div>
    );
};

export default ProjectDetail;