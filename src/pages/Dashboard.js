import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { formatUnits } from 'ethers';
import WorkflowStepper from '../components/WorkflowStepper';
import { 
  ClipboardList, Clock, CheckCircle2, Coins, 
  UploadCloud, Sprout, Tag, Search, XCircle, 
  Vote, Landmark, Satellite, Gem, Globe2, 
  Flame, TreePine, ArrowLeftRight, BarChart2, MapPin
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userAddress, bctBalance } = useWeb3();
  const { role, ROLES, ROLE_ICONS } = useRole();

  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => { setProjects(res.data); setLoading(false); })
      .catch(err => { console.error("Error fetching projects:", err); setLoading(false); });
  }, []);

  const balance = useMemo(() => {
    try {
      return bctBalance && bctBalance !== '0' ? parseFloat(formatUnits(bctBalance, 18)) : 0;
    } catch { return 0; }
  }, [bctBalance]);

  const stats = useMemo(() => ({
    total: projects.length,
    approved: projects.filter(p => p.status === "Approved").length,
    pending: projects.filter(p => p.status === "Pending").length,
    rejected: projects.filter(p => p.status === "Rejected").length,
    totalTrees: projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0),
    myProjects: userAddress
      ? projects.filter(p => p.walletAddress?.toLowerCase() === userAddress.toLowerCase()).length
      : 0,
  }), [projects, userAddress]);

  if (loading) return <div className="dashboard-container"><p>Loading dashboard...</p></div>;

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <header className="dashboard-header">
        <div>
          <h1>
            {role ? <span style={{marginRight: '8px', verticalAlign: 'middle'}}>{ROLE_ICONS[role]}</span> : ''}
            {role === ROLES.NGO ? 'NGO Dashboard' :
             role === ROLES.VALIDATOR ? 'Validator Dashboard' :
             role === ROLES.INVESTOR ? 'Investor Dashboard' :
             role === ROLES.ADMIN ? 'Admin Dashboard' :
             'Blue Carbon DAO'}
          </h1>
          <p>
            {role === ROLES.NGO ? 'Submit projects and track your carbon credits' :
             role === ROLES.VALIDATOR ? 'Review projects and participate in governance' :
             role === ROLES.INVESTOR ? 'Trade and retire carbon credits' :
             role === ROLES.ADMIN ? 'Platform overview and administration' :
             'Connect your wallet and select a role to get started'}
          </p>
        </div>
        {userAddress && (
          <div className="balance-pill">
            <span className="bp-label">BCT Balance</span>
            <span className="bp-value">{balance.toLocaleString()}</span>
          </div>
        )}
      </header>

      {/* ===== NGO DASHBOARD ===== */}
      {role === ROLES.NGO && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><ClipboardList size={20} /></span>
              <div><span className="rs-value">{stats.myProjects}</span><span className="rs-label">My Projects</span></div>
            </div>
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><Clock size={20} /></span>
              <div><span className="rs-value">{stats.pending}</span><span className="rs-label">Pending Review</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><CheckCircle2 size={20} /></span>
              <div><span className="rs-value">{stats.approved}</span><span className="rs-label">Approved</span></div>
            </div>
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Coins size={20} /></span>
              <div><span className="rs-value">{balance.toLocaleString()}</span><span className="rs-label">BCT Earned</span></div>
            </div>
          </section>

          <section className="role-actions-grid">
            <Link to="/ngo/submit" className="action-card primary">
              <span className="ac-emoji"><UploadCloud size={24} /></span>
              <div>
                <strong>Submit New Project</strong>
                <p>Start a new blue carbon project submission</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/ngo/projects" className="action-card">
              <span className="ac-emoji"><Sprout size={24} /></span>
              <div>
                <strong>Track My Projects</strong>
                <p>View status and workflow for all your projects</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/marketplace" className="action-card">
              <span className="ac-emoji"><Tag size={24} /></span>
              <div>
                <strong>List Tokens for Sale</strong>
                <p>Sell your approved BCT tokens on the marketplace</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
          </section>

          {/* Recent Projects with stepper */}
          <section className="recent-section">
            <h3>Your Recent Projects</h3>
            {projects
              .filter(p => userAddress && p.walletAddress?.toLowerCase() === userAddress.toLowerCase())
              .slice(0, 3)
              .map(p => (
                <div key={p.projectId} className="recent-project-card">
                  <div className="rp-header">
                    <strong>{p.projectName}</strong>
                    <span className={`mini-badge ${(p.status || 'Pending').toLowerCase()}`}>{p.status}</span>
                  </div>
                  <WorkflowStepper project={p} compact />
                </div>
              ))
            }
            {stats.myProjects === 0 && (
              <p className="empty-hint">No projects yet. <Link to="/ngo/submit">Submit your first →</Link></p>
            )}
          </section>
        </>
      )}

      {/* ===== VALIDATOR DASHBOARD ===== */}
      {role === ROLES.VALIDATOR && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Search size={20} /></span>
              <div><span className="rs-value">{stats.pending}</span><span className="rs-label">Pending Review</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><CheckCircle2 size={20} /></span>
              <div><span className="rs-value">{stats.approved}</span><span className="rs-label">Approved</span></div>
            </div>
            <div className="role-stat-card accent-red">
              <span className="rs-icon"><XCircle size={20} /></span>
              <div><span className="rs-value">{stats.rejected}</span><span className="rs-label">Rejected</span></div>
            </div>
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><Vote size={20} /></span>
              <div><span className="rs-value">{balance.toLocaleString()}</span><span className="rs-label">Voting Power</span></div>
            </div>
          </section>

          <section className="role-actions-grid">
            <Link to="/verification" className="action-card primary">
              <span className="ac-emoji"><Search size={24} /></span>
              <div>
                <strong>Review Queue</strong>
                <p>{stats.pending} projects waiting for your review</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/governance" className="action-card">
              <span className="ac-emoji"><Landmark size={24} /></span>
              <div>
                <strong>Governance Proposals</strong>
                <p>Vote on DAO proposals and parameter changes</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/mrv-map" className="action-card">
              <span className="ac-emoji"><Satellite size={24} /></span>
              <div>
                <strong>MRV Satellite Map</strong>
                <p>Verify projects with geospatial data</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
          </section>

          {/* Pending Projects Preview */}
          <section className="recent-section">
            <h3>Projects Awaiting Review</h3>
            {projects.filter(p => p.status === 'Pending').slice(0, 4).map(p => (
              <Link to={`/project/${p.projectId}`} key={p.projectId} className="pending-review-card">
                <div className="prc-info">
                  <strong>{p.projectName}</strong>
                  <span><span style={{verticalAlign: 'middle'}}><MapPin size={14}/></span> {p.location} • <span style={{verticalAlign: 'middle'}}><TreePine size={14}/></span> {(p.saplingsPlanted || 0).toLocaleString()} trees</span>
                </div>
                <span className="prc-action">Review →</span>
              </Link>
            ))}
            {stats.pending === 0 && <p className="empty-hint">No pending projects to review 🎉</p>}
          </section>
        </>
      )}

      {/* ===== INVESTOR DASHBOARD ===== */}
      {role === ROLES.INVESTOR && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><Gem size={20} /></span>
              <div><span className="rs-value">{balance.toLocaleString()}</span><span className="rs-label">BCT Balance</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><Globe2 size={20} /></span>
              <div><span className="rs-value">{stats.approved}</span><span className="rs-label">Available Credits</span></div>
            </div>
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Flame size={20} /></span>
              <div><span className="rs-value">0</span><span className="rs-label">Credits Retired</span></div>
            </div>
            <div className="role-stat-card">
              <span className="rs-icon"><TreePine size={20} /></span>
              <div><span className="rs-value">{stats.totalTrees.toLocaleString()}</span><span className="rs-label">Trees Funded</span></div>
            </div>
          </section>

          <section className="role-actions-grid">
            <Link to="/marketplace" className="action-card primary">
              <span className="ac-emoji"><ArrowLeftRight size={24} /></span>
              <div>
                <strong>Browse Marketplace</strong>
                <p>Buy carbon credits from verified projects</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/marketplace" className="action-card retire-action">
              <span className="ac-emoji"><Flame size={24} /></span>
              <div>
                <strong>Retire Credits</strong>
                <p>Permanently offset your carbon footprint</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/governance" className="action-card">
              <span className="ac-emoji"><Vote size={24} /></span>
              <div>
                <strong>Vote on Proposals</strong>
                <p>Use your BCT to influence DAO decisions</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
          </section>
        </>
      )}

      {/* ===== ADMIN / NO ROLE DASHBOARD ===== */}
      {(role === ROLES.ADMIN || !role) && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card">
              <span className="rs-icon"><ClipboardList size={20} /></span>
              <div><span className="rs-value">{stats.total}</span><span className="rs-label">Total Projects</span></div>
            </div>
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Clock size={20} /></span>
              <div><span className="rs-value">{stats.pending}</span><span className="rs-label">Pending</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><CheckCircle2 size={20} /></span>
              <div><span className="rs-value">{stats.approved}</span><span className="rs-label">Approved</span></div>
            </div>
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><TreePine size={20} /></span>
              <div><span className="rs-value">{stats.totalTrees.toLocaleString()}</span><span className="rs-label">Trees Planted</span></div>
            </div>
          </section>

          {!role && !userAddress && (
            <section className="connect-prompt">
              <h2>Welcome to Blue Carbon DAO</h2>
              <p>Connect your wallet and select a role to access your personalized dashboard.</p>
              <div className="workflow-overview">
                <div className="wo-step">
                  <span><Sprout size={24} /></span><strong>NGO</strong><p>Submit projects</p>
                </div>
                <div className="wo-arrow">→</div>
                <div className="wo-step">
                  <span><Search size={24} /></span><strong>Validator</strong><p>Review & vote</p>
                </div>
                <div className="wo-arrow">→</div>
                <div className="wo-step">
                  <span><Coins size={24} /></span><strong>Admin</strong><p>Mint tokens</p>
                </div>
                <div className="wo-arrow">→</div>
                <div className="wo-step">
                  <span><Gem size={24} /></span><strong>Investor</strong><p>Buy & retire</p>
                </div>
              </div>
            </section>
          )}

          <section className="role-actions-grid">
            <Link to="/verification" className="action-card">
              <span className="ac-emoji"><Search size={24} /></span>
              <div><strong>Review Queue</strong><p>{stats.pending} pending</p></div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/governance" className="action-card">
              <span className="ac-emoji"><Landmark size={24} /></span>
              <div><strong>Governance</strong><p>DAO proposals</p></div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/marketplace" className="action-card">
              <span className="ac-emoji"><ArrowLeftRight size={24} /></span>
              <div><strong>Marketplace</strong><p>Trade credits</p></div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/analytics" className="action-card">
              <span className="ac-emoji"><BarChart2 size={24} /></span>
              <div><strong>Analytics</strong><p>Impact insights</p></div>
              <span className="ac-arrow">→</span>
            </Link>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
