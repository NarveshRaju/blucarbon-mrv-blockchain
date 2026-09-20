import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useRole } from '../RoleContext';
import { useWeb3 } from '../Web3Context';
import { 
  LayoutDashboard, UploadCloud, Sprout, Search, Landmark, 
  ArrowLeftRight, Satellite, TrendingUp, ScrollText, UserCircle,
  Building2, Globe, BrainCircuit, ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { role, ROLES, ROLE_LABELS, ROLE_ICONS, setShowRoleSelector } = useRole();
  const { userAddress } = useWeb3();

  // Determine which nav items are visible based on role
  const isNGO = role === ROLES.NGO;
  const isValidator = role === ROLES.VALIDATOR;
  const isCompany = role === ROLES.COMPANY || role === 'company' || role === 'investor';
  const isAdmin = role === ROLES.ADMIN;

  return (
    <div className="sidebar">
      <Link to="/" className="logo-container logo-link" title="Go to Main Dashboard">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-icon"
        >
          <path d="M7 20h10" />
          <path d="M10 20v-2a2 2 0 1 1 4 0v2" />
          <path d="M12 18a4 4 0 0 1 4-4h2a2 2 0 1 1 0 4h-2a4 4 0 0 1-4-4z" />
          <path d="M12 14a4 4 0 0 0-4-4H6a2 2 0 1 0 0 4h2a4 4 0 0 0 4-4z" />
        </svg>
        <div className="logo-text">
          <span className="logo-main-text">Blue Carbon MRV</span>
        </div>
      </Link>

      {/* Role Badge */}
      {userAddress && (
        <div className="role-badge-container">
          <button 
            type="button"
            className="sidebar-role-badge"
            onClick={() => setShowRoleSelector(true)}
            style={{ 
              cursor: 'pointer', 
              border: 'none', 
              width: '100%', 
              justifyContent: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Click to switch role"
          >
            {role ? (
              <>
                {ROLE_ICONS[role]} {ROLE_LABELS[role]} <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 2 }}>↻</span>
              </>
            ) : (
              <span>✨ Select Workspace Role</span>
            )}
          </button>
        </div>
      )}

      <nav className="nav-menu">
        {/* ===== Overview — Everyone ===== */}
        <div className="nav-section-label">Overview</div>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Globe size={18} /> Project Explorer
        </NavLink>

        {/* ===== NGO Section — NGO + Admin ===== */}
        {(isNGO || isAdmin) && (
          <>
            <div className="nav-section-label">NGO</div>
            <NavLink to="/ngo/verify" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <ShieldCheck size={18} /> Verify DARPAN ID
            </NavLink>
            <NavLink to="/ngo/onboarding" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Building2 size={18} /> NGO Profile
            </NavLink>
            <NavLink to="/ngo/submit" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <UploadCloud size={18} /> Submit Project
            </NavLink>
            <NavLink to="/ngo/projects" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Sprout size={18} /> My Projects
            </NavLink>
          </>
        )}

        {/* ===== DAO Section — Validator + Admin ===== */}
        {(isValidator || isAdmin) && (
          <>
            <div className="nav-section-label">DAO Verification</div>
            <NavLink to="/ai-verification" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <BrainCircuit size={18} /> AI Pre-Verification
            </NavLink>
            <NavLink to="/verification" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Search size={18} /> Review Queue
            </NavLink>
            <NavLink to="/governance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Landmark size={18} /> Governance
            </NavLink>
          </>
        )}

        {/* ===== Company Section ===== */}
        {(isCompany || isAdmin) && (
          <>
            <div className="nav-section-label">Company</div>
            <NavLink to="/marketplace" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <ArrowLeftRight size={18} /> Marketplace
            </NavLink>
          </>
        )}

        {/* ===== Shared — Everyone ===== */}
        <div className="nav-section-label">Insights</div>
        <NavLink to="/mrv-map" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <Satellite size={18} /> MRV Map
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <TrendingUp size={18} /> Analytics
        </NavLink>
        <NavLink to="/token-registry" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <ScrollText size={18} /> Token Registry
        </NavLink>

        <div className="nav-section-label">Account</div>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <UserCircle size={18} /> Profile
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;