import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// You can find an icon library like 'react-icons' to add icons
// npm install react-icons

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo-container">
        {/* You can use an SVG or an img tag for your logo */}
        🌊 Blue Carbon DAO
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
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          Settings
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;