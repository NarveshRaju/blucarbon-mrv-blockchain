import React from 'react';
import { useRole } from '../RoleContext';
import { useWeb3 } from '../Web3Context';
import './RoleSelector.css';

const RoleSelector = () => {
  const { showRoleSelector, setRole, ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, setShowRoleSelector } = useRole();
  const { userAddress, isAdmin } = useWeb3();

  if (!showRoleSelector || !userAddress) return null;

  const handleSelect = (selectedRole) => {
    setRole(selectedRole, userAddress);
  };

  // If admin, auto-assign
  if (isAdmin) {
    setRole(ROLES.ADMIN, userAddress);
    return null;
  }

  return (
    <div className="role-selector-overlay">
      <div className="role-selector-modal">
        <div className="role-selector-header">
          <h2>Welcome to Blue Carbon DAO</h2>
          <p>Select your role to customize your dashboard experience</p>
        </div>
        <div className="role-cards-grid">
          {[ROLES.NGO, ROLES.VALIDATOR, ROLES.INVESTOR].map((r) => (
            <button
              key={r}
              className="role-card"
              onClick={() => handleSelect(r)}
            >
              <span className="role-card-icon">{ROLE_ICONS[r]}</span>
              <h3>{ROLE_LABELS[r]}</h3>
              <p>{ROLE_DESCRIPTIONS[r]}</p>
            </button>
          ))}
        </div>
        <button className="role-skip-btn" onClick={() => setShowRoleSelector(false)}>
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;
