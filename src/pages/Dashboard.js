import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../RoleContext';
import { useWeb3 } from '../Web3Context';
import { getProjects } from '../services/projectService';
import { getProjectJourney, JOURNEY_STEPS } from '../utils/projectJourney';
import '../components/Journey.css';

export default function Dashboard() {
  const { role, setShowRoleSelector } = useRole();
  const { userAddress, connectWallet } = useWeb3();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active');
  const ngo = role === 'ngo';
  const validator = role === 'validator' || role === 'admin';
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (ngo && !userAddress) { setProjects([]); return; }
      setProjects(await getProjects(ngo ? { walletAddress: userAddress } : {}));
    } catch (err) { setError(err.message || 'Projects could not be loaded. Try again.'); }
    finally { setLoading(false); }
  }, [ngo, userAddress]);
  useEffect(() => { load(); }, [load]);
  const visible = projects.filter(p => filter === 'all' || (filter === 'complete' ? getProjectJourney(p).step === 3 : getProjectJourney(p).step !== 3));
  return <div className="journey-home">
    <header><h1>Your workspace</h1><p>{ngo ? 'Submit a project, follow its review, and see the tokens issued.' : validator ? 'Open a project, review its checks and evidence, then approve or request changes.' : 'Follow projects from submission to confirmed demo tokens.'}</p></header>
    <section className="journey-intro">
      <h2>One project. One place to follow it.</h2>
      <div className="journey-progress"><ol>{JOURNEY_STEPS.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol></div>
      <p>The NGO submits details and evidence. A validator reviews the checks. Approval starts token issuance automatically. A confirmed transaction completes the project.</p>
      {!userAddress ? <button className="journey-primary" onClick={connectWallet}>Connect wallet to get started</button>
        : !role ? <button className="journey-primary" onClick={() => setShowRoleSelector(true)}>Choose your role</button>
        : ngo ? <Link className="journey-primary" to="/ngo/submit">Submit a project</Link>
        : validator ? <Link className="journey-primary" to="/verification">Open review queue</Link>
        : <Link className="journey-primary" to="/token-registry">View issued tokens</Link>}
      <p><small>Demo tokens use Sepolia. You do not pay gas or connect an owner wallet to approve a project. Marketplace purchases are a separate simulation.</small></p>
    </section>
    <h2>{ngo ? 'Your projects' : 'Project progress'}</h2>
    <div className="journey-tools">{[['active','In progress'],['complete','Complete'],['all','All projects']].map(([value,label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}<button onClick={load}>Refresh</button></div>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading projects…</p> : !error && <div className="journey-list">
      {!visible.length && <p>No projects in this view.{ngo && ' Use Submit a project to begin.'}</p>}
      {visible.map(project => {
        const journey = getProjectJourney(project);
        return <article className="journey-row" key={project._id || project.projectId}>
          <div><h3>{project.projectName}</h3><strong>{journey.label}</strong><p>{journey.next}</p><small>Next action: {journey.owner}</small></div>
          <Link className="journey-primary" to={'/project/' + (project._id || project.projectId)}>{journey.step === 3 ? 'View result' : 'Continue project'}</Link>
        </article>;
      })}
    </div>}
  </div>;
}
