import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import { getProjectJourney } from '../utils/projectJourney';
import ProjectLifecycle from '../components/ProjectLifecycle';
import '../components/Journey.css';

export default function Verification() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('action');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProjects(await getProjects()); }
    catch { setError('The review queue could not be loaded. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const visible = projects.filter(p => {
    const journey = getProjectJourney(p);
    return (!search || p.projectName?.toLowerCase().includes(search.toLowerCase())) && (filter === 'all' || ['check', 'approve'].includes(journey.action));
  });
  return <div className="journey-home">
    <h1>Review projects</h1>
    <p>Open a project, read its checks and evidence, then approve and issue tokens or request changes. All actions stay on the project page.</p>
    <div className="journey-tools">
      <label>Find a project <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Project name" /></label>
      <button aria-pressed={filter === 'action'} onClick={() => setFilter('action')}>Needs attention</button>
      <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All projects</button>
      <button onClick={load}>Refresh</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading projects…</p> : !error && <div className="journey-list">
      {!visible.length && <p>No projects need attention in this view.</p>}
      {visible.map(project => {
        const journey = getProjectJourney(project);
        return <article className="journey-row" key={project._id || project.projectId}>
          <div><h2>{project.projectName}</h2><strong>{journey.label}</strong><p>{journey.next}</p><ProjectLifecycle project={project} compact /></div>
          <Link className="journey-primary" to={'/project/' + (project._id || project.projectId)}>Open project</Link>
        </article>;
      })}
    </div>}
  </div>;
}
