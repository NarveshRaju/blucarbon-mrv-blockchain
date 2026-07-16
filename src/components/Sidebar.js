import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// You can find an icon library like 'react-icons' to add icons
// npm install react-icons

const Sidebar = () => {
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
      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Dashboard
        </NavLink>
        <NavLink to="/verification" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Verification
        </NavLink>
        <NavLink to="/token-registry" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Token Registry
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Profile
        </NavLink>

      </nav>
    </div>
  );
};

export default Sidebar;