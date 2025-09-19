import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const API = process.env.REACT_APP_API_URL || "https://blockchain-blue-carbon-mrv.onrender.com";

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // The hasVoted state is no longer needed for this functionality.

  useEffect(() => {
    axios.get(`${API}/forms`)
      .then(res => {
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

  const handleVote = (voteType) => {
    const approveVotes = project.approveVotes || 0;
    const disapproveVotes = project.disapproveVotes || 0;
    
    // The check for hasVoted has been removed.
    if ((approveVotes + disapproveVotes) >= 10 || (project.status && project.status.toLowerCase() !== 'pending')) {
      return;
    }

    let newApproveVotes = approveVotes;
    let newDisapproveVotes = disapproveVotes;
    let newStatus = 'Pending';

    if (voteType === 'approve') {
      newApproveVotes++;
    } else {
      newDisapproveVotes++;
    }

    const totalVotes = newApproveVotes + newDisapproveVotes;

    if (newApproveVotes >= 6) {
      newStatus = 'Approved';
    } else if (newDisapproveVotes >= 5 || totalVotes >= 10) {
      newStatus = 'Rejected';
    }

    setProject({
      ...project,
      approveVotes: newApproveVotes,
      disapproveVotes: newDisapproveVotes,
      status: newStatus,
    });
    // The setHasVoted call is also removed.
  };


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
  
  const approveVotes = project.approveVotes || 0;
  const disapproveVotes = project.disapproveVotes || 0;
  const totalVotes = approveVotes + disapproveVotes;
  const isPending = !project.status || project.status.toLowerCase() === 'pending';

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

      {/* --- Voting Section --- */}
      <div className="voting-section">
        <h3>Project Voting</h3>
        <div className="vote-counts">
          <p>Approve: <strong>{approveVotes}</strong></p>
          <p>Disapprove: <strong>{disapproveVotes}</strong></p>
        </div>
        <div className="vote-progress">
          <div className="progress-bar" style={{ width: `${totalVotes * 10}%` }}></div>
        </div>
        <p className="vote-summary">{totalVotes} out of 10 votes cast</p>
        
        {isPending ? (
          <div className="vote-actions">
            <button
              onClick={() => handleVote('approve')}
              disabled={totalVotes >= 10} // Button is only disabled when voting is complete
              className="approve-btn"
            >
              Approve
            </button>
            <button
              onClick={() => handleVote('disapprove')}
              disabled={totalVotes >= 10} // Button is only disabled when voting is complete
              className="disapprove-btn"
            >
              Disapprove
            </button>
          </div>
        ) : (
          <p className="vote-message">Voting for this project has concluded.</p>
        )}
        {/* The message for a successful vote has been removed to avoid confusion with multiple votes */}
      </div>
    </div>
  );
};

export default ProjectDetail;

