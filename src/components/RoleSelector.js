import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../RoleContext';
import { useWeb3 } from '../Web3Context';
import { X } from 'lucide-react';
import RoleAuthModal from './RoleAuthModal';
import './RoleSelector.css';

const RoleSelector = () => {
  const { showRoleSelector, setShowRoleSelector, setRole, role: currentRole, ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS } = useRole();
  const { userAddress, isAdmin } = useWeb3();
  const navigate = useNavigate();

  const [authModalRole, setAuthModalRole] = useState(null); // 'validator' | 'company' | null

  if (!showRoleSelector || !userAddress) return null;

  const handleSelect = (selectedRole) => {
    if (selectedRole === ROLES.NGO) {
      setRole(selectedRole, userAddress);
      setShowRoleSelector(false);
      navigate('/ngo/verify');
    } else if (selectedRole === ROLES.VALIDATOR) {
      // Require Validator login credentials
      setAuthModalRole('validator');
    } else if (selectedRole === ROLES.COMPANY || selectedRole === 'investor') {
      // Require Corporate Company login credentials
      setAuthModalRole('company');
    }
  };

  const handleAuthSuccess = (authData) => {
    const targetRole = authModalRole === 'validator' ? ROLES.VALIDATOR : ROLES.COMPANY;
    setRole(targetRole, userAddress, authData);
    setAuthModalRole(null);
    setShowRoleSelector(false);
    
    // If already on a relevant page, stay on it; otherwise navigate to primary workspace
    const currentPath = window.location.pathname;
    if (targetRole === ROLES.VALIDATOR) {
      if (currentPath.includes('/governance') || currentPath.includes('/verification') || currentPath.includes('/ai-verification')) {
        // Stay on current page
      } else {
        navigate('/governance');
      }
    } else {
      if (!currentPath.includes('/marketplace')) {
        navigate('/marketplace');
      }
    }
  };

  // If admin, auto-assign
  if (isAdmin) {
    setRole(ROLES.ADMIN, userAddress);
    return null;
  }

  return (
    <div className="role-selector-overlay" onClick={() => currentRole && setShowRoleSelector(false)}>
      <div className="role-selector-modal" onClick={(e) => e.stopPropagation()}>
        {currentRole && (
          <button 
            className="role-selector-close-btn" 
            onClick={() => setShowRoleSelector(false)}
            title="Close role switcher"
          >
            <X size={20} />
          </button>
        )}
        <div className="role-selector-header">
          <h2>Select Ecosystem Role</h2>
          <p>Switch your workspace perspective to access role-specific workflows</p>
        </div>
        <div className="role-cards-grid">
          {[ROLES.NGO, ROLES.VALIDATOR, ROLES.COMPANY].map((r) => {
            const isSelected = currentRole === r;
            return (
              <button
                key={r}
                className={`role-card ${isSelected ? 'role-card--active' : ''}`}
                onClick={() => handleSelect(r)}
              >
                <span className="role-card-icon">{ROLE_ICONS[r]}</span>
                <h3>{ROLE_LABELS[r]}</h3>
                <p>{ROLE_DESCRIPTIONS[r]}</p>
                {isSelected && <span className="role-current-tag">Active Role</span>}
              </button>
            );
          })}
        </div>
      </div>

      {authModalRole && (
        <RoleAuthModal
          isOpen={Boolean(authModalRole)}
          roleToAuth={authModalRole}
          walletAddress={userAddress}
          onClose={() => setAuthModalRole(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default RoleSelector;
