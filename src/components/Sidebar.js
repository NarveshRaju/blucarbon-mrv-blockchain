import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useRole } from '../RoleContext';
import { LayoutDashboard, UploadCloud, Search, ScrollText, Globe, UserCircle, Satellite, TrendingUp, Landmark, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import './Sidebar.css';
import './Journey.css';
export default function Sidebar() {
  const { role, ROLE_LABELS, setShowRoleSelector } = useRole();
  const item = (to, label, Icon) => <NavLink to={to} className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}><Icon size={18} />{label}</NavLink>;
  return <aside className="sidebar">
    <Link to="/dashboard" className="logo-container logo-link"><span className="logo-main-text">Blue Carbon MRV</span></Link>
    <button className="sidebar-role-badge" onClick={() => setShowRoleSelector(true)}>{ROLE_LABELS[role] || 'Choose role'} · Switch</button>
    <nav className="nav-menu" aria-label="Main navigation">
      <div className="nav-section-label">Your workflow</div>
      {item('/dashboard', 'Workspace', LayoutDashboard)}
      {role === 'ngo' && item('/ngo/submit', 'Submit a project', UploadCloud)}
      {role === 'ngo' ? item('/ngo/projects', 'My projects', Globe) : item('/explore', 'Projects', Globe)}
      {(role === 'validator' || role === 'admin') && item('/verification', 'Review projects', Search)}
      {item('/token-registry', 'Issued tokens', ScrollText)}
      <details className="secondary-nav"><summary>More tools & demos</summary>
        {item('/mrv-map', 'Monitoring map', Satellite)}
        {item('/analytics', 'Analytics', TrendingUp)}
        {item('/governance', 'Voting demo', Landmark)}
        {item('/marketplace', 'Marketplace demo', ArrowLeftRight)}
        {role === 'ngo' && item('/demo/project-listings', 'Listing demo', ScrollText)}
        {role === 'ngo' && item('/ngo/verify', 'Verify organisation', ShieldCheck)}
        {role === 'ngo' && item('/ngo/onboarding', 'Organisation profile', UserCircle)}
      </details>
      {item('/profile', 'Account', UserCircle)}
    </nav>
  </aside>;
}
