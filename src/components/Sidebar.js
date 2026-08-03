import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../RoleContext';
import { useWeb3 } from '../Web3Context';
import { 
  LayoutDashboard, UploadCloud, Sprout, Search, Landmark, 
  ArrowLeftRight, Satellite, TrendingUp, ScrollText, UserCircle 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { role, ROLES, ROLE_LABELS, ROLE_ICONS } = useRole();
  const { userAddress } = useWeb3();

  // Determine which nav items are visible based on role
  const isNGO = role === ROLES.NGO;
  const isValidator = role === ROLES.VALIDATOR;
  const isInvestor = role === ROLES.INVESTOR;
  const isAdmin = role === ROLES.ADMIN;
  const noRole = !role;

  return (
    <div className="sidebar">
      <div className="logo-container">
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
          <span className="logo-byline">BY CODESANCTUM</span>
        </div>
      </div>

      {/* Role Badge */}
      {userAddress && role && (
        <div className="role-badge-container">
          <span className="sidebar-role-badge">
            {ROLE_ICONS[role]} {ROLE_LABELS[role]}
          </span>
        </div>
      )}

      <nav className="nav-menu">
        {/* ===== Overview — Everyone ===== */}
        <div className="nav-section-label">Overview</div>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        {/* ===== NGO Section — NGO + Admin ===== */}
        {(isNGO || isAdmin || noRole) && (
          <>
            <div className="nav-section-label">NGO</div>
            <NavLink to="/ngo/submit" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <UploadCloud size={18} /> Submit Project
            </NavLink>
            <NavLink to="/ngo/projects" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Sprout size={18} /> My Projects
            </NavLink>
          </>
        )}

        {/* ===== DAO Section — Validator + Admin ===== */}
        {(isValidator || isAdmin || noRole) && (
          <>
            <div className="nav-section-label">DAO Verification</div>
            <NavLink to="/verification" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Search size={18} /> Review Queue
            </NavLink>
            <NavLink to="/governance" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Landmark size={18} /> Governance
            </NavLink>
          </>
        )}

        {/* ===== Investor Section ===== */}
        {(isInvestor || isAdmin || noRole) && (
          <>
            <div className="nav-section-label">Trading</div>
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