import React from 'react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import './Header.css';

const Header = () => {
  const { userAddress, isAdmin, connectWallet, disconnectWallet, error } = useWeb3();
  const { role, ROLE_LABELS, ROLE_ICONS, setShowRoleSelector } = useRole();

  const buttonText = userAddress
    ? `Disconnect: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`
    : "Connect Wallet";

  const handleClick = () => {
    if (userAddress) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {userAddress && (
          <button 
            className="header-role-pill" 
            onClick={() => setShowRoleSelector(true)} 
            title={role ? "Click to switch role" : "Click to select role"}
          >
            {role ? (
              <>
                <span className="role-pill-icon">{ROLE_ICONS[role]}</span>
                <span className="role-pill-label">{ROLE_LABELS[role]}</span>
                <span className="role-pill-switch">Switch</span>
              </>
            ) : (
              <>
                <span className="role-pill-icon">✨</span>
                <span className="role-pill-label">Select Workspace Role</span>
                <span className="role-pill-switch">Choose</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="header-actions">
        <span title={error || 'Backend pays gas with free test ETH'}>Sepolia demo{error ? ' · unavailable' : ' · no user gas'}</span>
        {isAdmin && <span className="admin-badge">Admin</span>}
        <button className="connect-button" onClick={handleClick}>
          {buttonText}
        </button>
      </div>
    </header>
  );
};

export default Header;
