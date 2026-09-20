import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { formatUnits } from 'ethers';
import { getProjects, getProjectBaseline, getProjectMRVRecords, canListForSale } from '../services/projectService';
import { isNGOOnboarded, getNGOProfile } from '../services/ngoService';
import ProjectCard from '../components/ProjectCard';
import { normalizeStatus } from '../utils/projectStatus';
import {
  StatCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  LoadingSpinner
} from '../components/ui';
import { 
  ClipboardList, Clock, CheckCircle2, Coins, 
  UploadCloud, Sprout, Search, XCircle, 
  Vote, Landmark, Satellite, Gem, Globe2, 
  Flame, TreePine, ArrowLeftRight, BarChart2, MapPin,
  Building2, ShieldCheck, ArrowRight, Activity, Layers, FileText, BrainCircuit
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userAddress, bctBalance } = useWeb3();
  const { role, ROLES, ROLE_ICONS, ROLE_LABELS, ROLE_DESCRIPTIONS, setRole } = useRole();
  const navigate = useNavigate();

  const ngoOnboarded = useMemo(() => isNGOOnboarded(userAddress), [userAddress]);
  const ngoProfile = useMemo(() => getNGOProfile(userAddress), [userAddress]);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (role === ROLES.NGO && userAddress) {
        params.walletAddress = userAddress.toLowerCase().trim();
      } else if (role) {
        params.role = role;
      }
      const data = await getProjects(params);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching projects from MongoDB:", err);
      setError("Unable to load project data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [role, userAddress, ROLES.NGO]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const balance = useMemo(() => {
    try {
      return bctBalance && bctBalance !== '0' ? parseFloat(formatUnits(bctBalance, 18)) : 0;
    } catch { return 0; }
  }, [bctBalance]);

  // Filter projects belonging to the connected NGO wallet
  const myNGOProjects = useMemo(() => {
    if (!userAddress || !projects.length) return [];
    return projects.filter(
      p => p.walletAddress && p.walletAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }, [projects, userAddress]);

  // NGO Specific Calculated Statistics
  const ngoStats = useMemo(() => {
    const total = myNGOProjects.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let saplings = 0;

    myNGOProjects.forEach(p => {
      const norm = normalizeStatus(p);
      if (norm === 'approved' || norm === 'dao_approved' || norm === 'credit_issued') {
        approved += 1;
      } else if (norm === 'ai_requires_changes' || norm === 'validator_rejected' || norm === 'dao_rejected') {
        rejected += 1;
      } else {
        pending += 1;
      }
      saplings += (p.saplingsPlanted || 0);
    });

    let withBaseline = 0;
    let withMRV = 0;
    myNGOProjects.forEach(p => {
      const pid = p.projectId || p._id;
      const bl = getProjectBaseline(pid, p);
      const mrv = getProjectMRVRecords(pid, p);
      if (bl && bl.projectArea) withBaseline += 1;
      if (mrv && mrv.length > 0) withMRV += 1;
    });

    return {
      total,
      pending,
      approved,
      rejected,
      saplings,
      withBaseline,
      withMRV,
    };
  }, [myNGOProjects]);

  // Workflow Lifecycle Breakdown (Phase 9)
  const workflowBreakdown = useMemo(() => {
    let draft = 0;
    try {
      if (userAddress && localStorage.getItem(`bluechain_project_draft_${userAddress.toLowerCase()}`)) {
        draft = 1;
      }
    } catch {}

    let submitted = 0;
    let underVerification = 0;
    let approved = 0;
    let rejected = 0;
    let creditIssued = 0;

    myNGOProjects.forEach((p) => {
      const norm = normalizeStatus(p);
      if (norm === 'credit_issued') creditIssued += 1;
      else if (norm === 'approved') approved += 1;
      else if (norm === 'under_verification') underVerification += 1;
      else if (norm === 'rejected') rejected += 1;
      else submitted += 1;
    });

    return {
      draft,
      submitted,
      underVerification,
      approved,
      rejected,
      creditIssued,
    };
  }, [myNGOProjects, userAddress]);

  // Next Action Required Suggestions (Phase 9)
  const nextActions = useMemo(() => {
    const items = [];
    if (!ngoOnboarded) {
      items.push({
        id: 'action-onboard',
        type: 'warning',
        icon: <Building2 size={16} />,
        title: 'Complete NGO Identity Onboarding',
        desc: 'Submit your NGO registration certificate and legal details to unlock full project steward rights.',
        link: '/ngo/onboarding',
        actionLabel: 'Complete Profile',
      });
    }

    myNGOProjects.forEach((p) => {
      const pid = p.projectId || p._id;
      const evidenceCount = p.imageBase64s?.length || p.evidence?.length || 0;
      const norm = normalizeStatus(p);

      if (evidenceCount === 0 && norm !== 'approved' && norm !== 'rejected') {
        items.push({
          id: `act-ev-${pid}`,
          type: 'warning',
          icon: <UploadCloud size={16} />,
          title: `Attach Supporting Evidence for "${p.projectName}"`,
          desc: 'Adding ground photos and permission letters speeds up DAO validator sign-off.',
          link: `/project/${pid}`,
          actionLabel: 'Upload Evidence',
        });
      } else if (norm === 'submitted' || norm === 'pending') {
        items.push({
          id: `act-sub-${pid}`,
          type: 'info',
          icon: <Clock size={16} />,
          title: `"${p.projectName}" in Validator Queue`,
          desc: 'Independent DAO auditors are evaluating your submitted baseline metrics.',
          link: `/project/${pid}`,
          actionLabel: 'Track Status',
        });
      } else if (norm === 'approved' && canListForSale(p).eligible) {
        items.push({
          id: `act-app-${pid}`,
          type: 'success',
          icon: <Coins size={16} />,
          title: `"${p.projectName}" Approved — Ready for Token Listing`,
          desc: 'MRV verification passed. List your verified BCT credits on the decentralized marketplace.',
          link: `/ngo/projects`,
          actionLabel: 'List Tokens',
        });
      } else if (norm === 'rejected') {
        items.push({
          id: `act-rej-${pid}`,
          type: 'danger',
          icon: <XCircle size={16} />,
          title: `Revision Needed for "${p.projectName}"`,
          desc: 'Validator feedback requires coordinate or evidence updates before resubmission.',
          link: `/project/${pid}`,
          actionLabel: 'Review Feedback',
        });
      }
    });

    if (items.length === 0 && myNGOProjects.length === 0) {
      items.push({
        id: 'action-first-proj',
        type: 'primary',
        icon: <Sprout size={16} />,
        title: 'Register Your First Blue Carbon Project',
        desc: 'Geotag your mangrove plot and establish baseline MRV metrics for credit verification.',
        link: '/ngo/submit',
        actionLabel: 'Start Wizard',
      });
    }

    return items.slice(0, 4);
  }, [myNGOProjects, ngoOnboarded]);

  // Overall system statistics for validator / investor / admin
  const globalStats = useMemo(() => ({
    total: projects.length,
    approved: projects.filter(p => p.status === "Approved").length,
    pending: projects.filter(p => p.status === "Pending").length,
    rejected: projects.filter(p => p.status === "Rejected").length,
    totalTrees: projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0),
  }), [projects]);

  // Recent activity generated from real NGO project history
  const recentActivities = useMemo(() => {
    if (!myNGOProjects.length) return [];
    
    const activities = [];
    myNGOProjects.forEach(p => {
      if (p.createdAt) {
        activities.push({
          id: `sub-${p.projectId || p._id}`,
          type: 'submitted',
          title: `Project Registered: ${p.projectName || 'Untitled'}`,
          desc: `${p.plantationType || 'Mangrove'} • ${(p.saplingsPlanted || 0).toLocaleString()} saplings at ${p.location || 'Location'}`,
          date: new Date(p.createdAt),
          status: p.status || 'Pending'
        });
      }
      if (p.status === 'Approved') {
        activities.push({
          id: `app-${p.projectId || p._id}`,
          type: 'approved',
          title: `Project Approved: ${p.projectName || 'Untitled'}`,
          desc: 'Validator verification complete. Carbon credits eligible for issuance.',
          date: new Date(p.updatedAt || p.createdAt),
          status: 'Approved'
        });
      } else if (p.status === 'Rejected') {
        activities.push({
          id: `rej-${p.projectId || p._id}`,
          type: 'rejected',
          title: `Review Concluded: ${p.projectName || 'Untitled'}`,
          desc: 'Project did not meet current validation criteria.',
          date: new Date(p.updatedAt || p.createdAt),
          status: 'Rejected'
        });
      }
    });

    return activities.sort((a, b) => b.date - a.date).slice(0, 5);
  }, [myNGOProjects]);

  // Latest project for the MRV tracker
  const latestProject = myNGOProjects[0] || null;

  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner text="Loading BlueChain dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <ErrorState
          title="Dashboard Error"
          message={error}
          onRetry={fetchProjectData}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <header className="dashboard-header">
        <div>
          <h1>
            {role ? <span style={{marginRight: '8px', verticalAlign: 'middle'}}>{ROLE_ICONS[role]}</span> : ''}
            {role === ROLES.NGO
              ? `Welcome back, ${ngoProfile?.organizationName || 'NGO Partner'}`
              : role === ROLES.VALIDATOR ? 'Validator Dashboard'
              : role === ROLES.INVESTOR ? 'Investor Dashboard'
              : role === ROLES.ADMIN ? 'Admin Dashboard'
              : 'Blue Carbon DAO'}
          </h1>
          <p>
            {role === ROLES.NGO
              ? 'Monitor your mangrove projects, track verification progress and manage your carbon credit journey.'
              : role === ROLES.VALIDATOR ? 'Review projects and participate in governance'
              : role === ROLES.INVESTOR ? 'Trade and retire carbon credits'
              : role === ROLES.ADMIN ? 'Platform overview and administration'
              : 'Connect your wallet and select a role to get started'}
          </p>
        </div>
        {userAddress && (
          <div className="balance-pill">
            <span className="bp-label">BCT Balance</span>
            <span className="bp-value">{balance.toLocaleString()}</span>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* ===== ENHANCED NGO DASHBOARD ===== */}
      {/* ============================================================ */}
      {role === ROLES.NGO && (
        <div className="ngo-dashboard-layout">
          {/* 1. NGO Profile Status Card */}
          {!ngoOnboarded ? (
            <div className="ngo-profile-alert-card">
              <div className="np-alert-left">
                <div className="np-icon-badge warning">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3>Complete Your NGO Profile</h3>
                  <p>Complete your organization profile before registering a project to establish your verification identity.</p>
                </div>
              </div>
              <Link to="/ngo/onboarding" className="bc-btn bc-btn--primary">
                Complete Onboarding <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="ngo-profile-summary-card">
              <div className="nps-info-group">
                <div className="nps-avatar">
                  <Building2 size={26} />
                </div>
                <div className="nps-meta">
                  <div className="nps-header-line">
                    <h3>{ngoProfile.organizationName}</h3>
                    <StatusBadge status="verified" className="nps-status-pill" />
                  </div>
                  <div className="nps-details-row">
                    <span><strong>Reg:</strong> {ngoProfile.registrationNumber || 'N/A'}</span>
                    <span>•</span>
                    <span><strong>Location:</strong> {ngoProfile.district ? `${ngoProfile.district}, ${ngoProfile.state}` : (ngoProfile.state || 'Registered')}</span>
                    <span>•</span>
                    <span className="nps-wallet">
                      <strong>Wallet:</strong> {userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 'Connected'}
                    </span>
                  </div>
                </div>
              </div>
              <Link to="/ngo/onboarding" className="bc-btn bc-btn--secondary bc-btn--sm">
                View / Edit Profile
              </Link>
            </div>
          )}

          {/* 2. Real Project Statistics Cards */}
          <section className="dashboard-stats-grid">
            <StatCard
              icon={<ClipboardList size={22} />}
              value={ngoStats.total}
              label="Total Projects"
              accent="primary"
            />
            <StatCard
              icon={<Clock size={22} />}
              value={ngoStats.pending}
              label="Pending Review"
              accent="warning"
            />
            <StatCard
              icon={<CheckCircle2 size={22} />}
              value={ngoStats.approved}
              label="Approved Projects"
              accent="success"
            />
            <StatCard
              icon={<TreePine size={22} />}
              value={ngoStats.saplings.toLocaleString()}
              label="Saplings Planted"
              accent="secondary"
            />
            <StatCard
              icon={<Coins size={22} />}
              value={balance > 0 ? `${balance.toLocaleString()} BCT` : (ngoStats.approved > 0 ? `${ngoStats.saplings.toLocaleString()} BCT` : 'Pending MRV')}
              label="Carbon Credits (BCT)"
              accent="info"
            />
          </section>

          {/* 3. Quick Actions */}
          <section className="ngo-quick-actions-section">
            <h3 className="section-title-sm">Quick Actions</h3>
            <div className="quick-actions-grid">
              <Link to="/ngo/submit" className="quick-action-card highlight">
                <div className="qa-icon-circle primary">
                  <UploadCloud size={22} />
                </div>
                <div>
                  <strong>Register New Project</strong>
                  <p>Submit location, saplings, and evidence</p>
                </div>
                <ArrowRight size={16} className="qa-arrow" />
              </Link>

              <Link to="/ngo/projects" className="quick-action-card">
                <div className="qa-icon-circle success">
                  <Sprout size={22} />
                </div>
                <div>
                  <strong>My Projects</strong>
                  <p>Track statuses and list tokens for sale</p>
                </div>
                <ArrowRight size={16} className="qa-arrow" />
              </Link>

              <Link to="/ngo/onboarding" className="quick-action-card">
                <div className="qa-icon-circle secondary">
                  <Building2 size={22} />
                </div>
                <div>
                  <strong>NGO Profile</strong>
                  <p>Update organization details & identity</p>
                </div>
                <ArrowRight size={16} className="qa-arrow" />
              </Link>

              <Link to="/mrv-map" className="quick-action-card">
                <div className="qa-icon-circle info">
                  <Satellite size={22} />
                </div>
                <div>
                  <strong>MRV Satellite Map</strong>
                  <p>Explore geospatial analysis & vegetation</p>
                </div>
                <ArrowRight size={16} className="qa-arrow" />
              </Link>
            </div>
          </section>

          {/* Next Actions Required (Phase 9) */}
          {nextActions.length > 0 && (
            <section className="ngo-next-actions-section">
              <h3 className="section-title-sm">Next Action Required</h3>
              <div className="next-actions-grid">
                {nextActions.map((act) => (
                  <Link key={act.id} to={act.link} className={`next-action-card ${act.type}`}>
                    <div className={`nac-icon ${act.type}`}>
                      {act.icon}
                    </div>
                    <div className="nac-info">
                      <strong>{act.title}</strong>
                      <p>{act.desc}</p>
                    </div>
                    <span className="nac-btn-label">
                      {act.actionLabel} →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 4. Two-Column Dashboard Content (Projects + MRV / Activity) */}
          <div className="ngo-content-grid">
            {/* Left Column: Recent Projects */}
            <div className="ngo-main-column">
              <div className="column-header-row">
                <h3>Your Registered Projects</h3>
                {myNGOProjects.length > 0 && (
                  <Link to="/ngo/projects" className="view-all-link">
                    View All ({myNGOProjects.length}) →
                  </Link>
                )}
              </div>

              {myNGOProjects.length > 0 ? (
                <div className="ngo-projects-cards-list">
                  {myNGOProjects.slice(0, 3).map((project, idx) => (
                    <ProjectCard
                      key={project.projectId || project._id || idx}
                      project={project}
                      showViewButton={true}
                      linkPrefix="/project"
                    />
                  ))}
                </div>
              ) : (
                <div className="ngo-empty-projects-container">
                  <EmptyState
                    icon={<Sprout size={36} />}
                    title="No projects registered yet"
                    description="Start your first mangrove or coastal wetland restoration project to begin the MRV verification pipeline."
                    action={
                      <Link to="/ngo/submit" className="bc-btn bc-btn--primary">
                        <UploadCloud size={16} /> Register First Project
                      </Link>
                    }
                  />
                </div>
              )}
            </div>

            {/* Right Column: MRV Tracker & Recent Activity */}
            <div className="ngo-side-column">
              {/* Project Workflow Overview (Phase 9) */}
              <div className="dashboard-sub-card">
                <div className="dsc-header">
                  <h4><Layers size={18} /> Project Workflow Overview</h4>
                  <span className="dsc-count-pill">{ngoStats.total} Total</span>
                </div>
                <div className="status-breakdown-list">
                  <div className="status-breakdown-row">
                    <span className="sb-label"><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Draft Projects</span>
                    <span className="sb-value">{workflowBreakdown.draft}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><StatusBadge status="Pending" /> Submitted</span>
                    <span className="sb-value">{workflowBreakdown.submitted}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><Search size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Under Verification</span>
                    <span className="sb-value">{workflowBreakdown.underVerification}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><StatusBadge status="Approved" /> Approved</span>
                    <span className="sb-value">{workflowBreakdown.approved}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><Coins size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Credits Issued / Listed</span>
                    <span className="sb-value">{workflowBreakdown.creditIssued}</span>
                  </div>
                  {workflowBreakdown.rejected > 0 && (
                    <div className="status-breakdown-row">
                      <span className="sb-label"><StatusBadge status="Rejected" /> Revision Required</span>
                      <span className="sb-value">{workflowBreakdown.rejected}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MRV Environmental Monitoring Status (Phase 8) */}
              <div className="dashboard-sub-card">
                <div className="dsc-header">
                  <h4><Activity size={18} /> MRV Monitoring Status</h4>
                  <span className="dsc-badge-subtle">Environmental Data</span>
                </div>
                <div className="status-breakdown-list">
                  <div className="status-breakdown-row">
                    <span className="sb-label"><Sprout size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Baseline Registered</span>
                    <span className="sb-value">{ngoStats.withBaseline} / {ngoStats.total}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><Satellite size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Active MRV Logs</span>
                    <span className="sb-value">{ngoStats.withMRV} / {ngoStats.total}</span>
                  </div>
                  <div className="status-breakdown-row">
                    <span className="sb-label"><Search size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Verification Queue</span>
                    <span className="sb-value">{ngoStats.pending}</span>
                  </div>
                </div>
              </div>

              {/* Conceptual MRV Verification Lifecycle */}
              <div className="dashboard-sub-card">
                <div className="dsc-header">
                  <h4><ShieldCheck size={18} /> MRV Lifecycle Progression</h4>
                  <span className="dsc-badge-subtle">
                    {latestProject ? (latestProject.status || 'Pending') : 'Overview'}
                  </span>
                </div>
                <p className="dsc-helper-text">
                  {latestProject
                    ? `Tracking verification pipeline for "${latestProject.projectName || 'Latest Project'}":`
                    : 'Standard verification stages for submitted restoration projects:'}
                </p>

                <div className="mrv-stage-tracker">
                  <div className="mrv-stage completed">
                    <div className="mrv-stage-dot"><CheckCircle2 size={14} /></div>
                    <div className="mrv-stage-info">
                      <strong>1. Project Registration</strong>
                      <span>{latestProject ? 'Details & boundary submitted' : 'Basic project information'}</span>
                    </div>
                  </div>

                  <div className={`mrv-stage ${latestProject ? 'completed' : 'pending'}`}>
                    <div className="mrv-stage-dot">
                      {latestProject ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="mrv-stage-info">
                      <strong>2. Location & Field Evidence</strong>
                      <span>{latestProject ? 'Geotagged data on record' : 'Field photos and boundaries'}</span>
                    </div>
                  </div>

                  <div className={`mrv-stage ${latestProject?.status === 'Approved' ? 'completed' : 'in-progress'}`}>
                    <div className="mrv-stage-dot">
                      {latestProject?.status === 'Approved' ? <CheckCircle2 size={14} /> : <Activity size={14} />}
                    </div>
                    <div className="mrv-stage-info">
                      <strong>3. Satellite MRV Analysis</strong>
                      <span>{latestProject?.status === 'Approved' ? 'Vegetation index verified' : 'NDVI & biomass assessment'}</span>
                    </div>
                  </div>

                  <div className={`mrv-stage ${latestProject?.status === 'Approved' ? 'completed' : latestProject?.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                    <div className="mrv-stage-dot">
                      {latestProject?.status === 'Approved' ? <CheckCircle2 size={14} /> : latestProject?.status === 'Rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="mrv-stage-info">
                      <strong>4. DAO Validator Review</strong>
                      <span>{latestProject?.status === 'Approved' ? 'Approved by DAO consensus' : latestProject?.status === 'Rejected' ? 'Review concluded' : 'Pending validator vote'}</span>
                    </div>
                  </div>

                  <div className={`mrv-stage ${latestProject?.status === 'Approved' ? 'completed' : 'pending'}`}>
                    <div className="mrv-stage-dot">
                      {latestProject?.status === 'Approved' ? <CheckCircle2 size={14} /> : <Coins size={14} />}
                    </div>
                    <div className="mrv-stage-info">
                      <strong>5. BCT Credit Issuance</strong>
                      <span>{latestProject?.status === 'Approved' ? 'Tokens minted on Sepolia' : 'On-chain credit minting'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="dashboard-sub-card">
                <div className="dsc-header">
                  <h4><Activity size={18} /> Recent Activity</h4>
                </div>

                {recentActivities.length > 0 ? (
                  <div className="activity-timeline-list">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="activity-item">
                        <div className={`activity-bullet ${act.type}`} />
                        <div className="activity-details">
                          <strong>{act.title}</strong>
                          <p>{act.desc}</p>
                          <span className="activity-time">{act.date.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-activity-text">
                    No recent activity recorded. Activity events will appear after you submit a project.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== PRESERVED VALIDATOR DASHBOARD ===== */}
      {/* ============================================================ */}
      {role === ROLES.VALIDATOR && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Search size={20} /></span>
              <div><span className="rs-value">{globalStats.pending}</span><span className="rs-label">Pending Review</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><CheckCircle2 size={20} /></span>
              <div><span className="rs-value">{globalStats.approved}</span><span className="rs-label">Approved</span></div>
            </div>
            <div className="role-stat-card accent-red">
              <span className="rs-icon"><XCircle size={20} /></span>
              <div><span className="rs-value">{globalStats.rejected}</span><span className="rs-label">Rejected</span></div>
            </div>
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><Vote size={20} /></span>
              <div><span className="rs-value">{balance.toLocaleString()}</span><span className="rs-label">Voting Power</span></div>
            </div>
          </section>

          <section className="role-actions-grid">
            <Link to="/ai-verification" className="action-card primary">
              <span className="ac-emoji"><BrainCircuit size={24} /></span>
              <div>
                <strong>AI Pre-Verification Agent</strong>
                <p>Run intelligent pre-screening & risk scoring</p>
              </div>
              <span className="ac-arrow">→</span>
            </Link>
            <Link to="/verification" className="action-card">
              <span className="ac-emoji"><Search size={24} /></span>
              <div>
                <strong>Review Queue</strong>
                <p>{globalStats.pending} projects waiting for your review</p>
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
              <Link to={`/project/${p.projectId || p._id}`} key={p.projectId || p._id} className="pending-review-card">
                <div className="prc-info">
                  <strong>{p.projectName}</strong>
                  <span><span style={{verticalAlign: 'middle'}}><MapPin size={14}/></span> {p.location} • <span style={{verticalAlign: 'middle'}}><TreePine size={14}/></span> {(p.saplingsPlanted || 0).toLocaleString()} trees</span>
                </div>
                <span className="prc-action">Review →</span>
              </Link>
            ))}
            {globalStats.pending === 0 && <p className="empty-hint">No pending projects to review.</p>}
          </section>
        </>
      )}

      {/* ============================================================ */}
      {/* ===== PRESERVED INVESTOR DASHBOARD ===== */}
      {/* ============================================================ */}
      {role === ROLES.INVESTOR && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><Gem size={20} /></span>
              <div><span className="rs-value">{balance.toLocaleString()}</span><span className="rs-label">BCT Balance</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><Globe2 size={20} /></span>
              <div><span className="rs-value">{globalStats.approved}</span><span className="rs-label">Available Credits</span></div>
            </div>
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Flame size={20} /></span>
              <div><span className="rs-value">0</span><span className="rs-label">Credits Retired</span></div>
            </div>
            <div className="role-stat-card">
              <span className="rs-icon"><TreePine size={20} /></span>
              <div><span className="rs-value">{globalStats.totalTrees.toLocaleString()}</span><span className="rs-label">Trees Funded</span></div>
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

      {/* ============================================================ */}
      {/* ===== PRESERVED ADMIN / NO ROLE DASHBOARD ===== */}
      {/* ============================================================ */}
      {(role === ROLES.ADMIN || !role) && (
        <>
          <section className="role-stats-grid">
            <div className="role-stat-card">
              <span className="rs-icon"><ClipboardList size={20} /></span>
              <div><span className="rs-value">{globalStats.total}</span><span className="rs-label">Total Projects</span></div>
            </div>
            <div className="role-stat-card accent-orange">
              <span className="rs-icon"><Clock size={20} /></span>
              <div><span className="rs-value">{globalStats.pending}</span><span className="rs-label">Pending</span></div>
            </div>
            <div className="role-stat-card accent-green">
              <span className="rs-icon"><CheckCircle2 size={20} /></span>
              <div><span className="rs-value">{globalStats.approved}</span><span className="rs-label">Approved</span></div>
            </div>
            <div className="role-stat-card accent-blue">
              <span className="rs-icon"><TreePine size={20} /></span>
              <div><span className="rs-value">{globalStats.totalTrees.toLocaleString()}</span><span className="rs-label">Trees Planted</span></div>
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

          {!role && userAddress && (
            <section className="connect-prompt" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <h2>Select Your Ecosystem Role</h2>
              <p style={{ maxWidth: '600px', margin: '0 auto 24px auto', color: '#5f6368' }}>
                Please select how you participate in the Blue Carbon MRV network to personalize your workspace.
              </p>
              <div className="role-cards-grid" style={{ maxWidth: '850px', margin: '0 auto' }}>
                {[ROLES.NGO, ROLES.VALIDATOR, ROLES.INVESTOR].map((r) => (
                  <button
                    key={r}
                    className="role-card"
                    onClick={() => {
                      setRole(r, userAddress);
                      if (r === ROLES.NGO) {
                        if (!ngoOnboarded) navigate('/ngo/onboarding');
                      } else if (r === ROLES.VALIDATOR) {
                        navigate('/verification');
                      } else if (r === ROLES.INVESTOR) {
                        navigate('/marketplace');
                      }
                    }}
                  >
                    <span className="role-card-icon">{ROLE_ICONS[r]}</span>
                    <h3>{ROLE_LABELS[r]}</h3>
                    <p>{ROLE_DESCRIPTIONS[r]}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="role-actions-grid">
            <Link to="/verification" className="action-card">
              <span className="ac-emoji"><Search size={24} /></span>
              <div><strong>Review Queue</strong><p>{globalStats.pending} pending</p></div>
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
