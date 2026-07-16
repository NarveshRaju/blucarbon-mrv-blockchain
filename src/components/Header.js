import React from 'react';
import { useWeb3 } from '../Web3Context';
import './Header.css';

const Header = () => {
  // Get the state and functions from our global context
  const { userAddress, isAdmin, connectWallet, disconnectWallet } = useWeb3();

  // Determine the button text based on whether a user is connected
  const buttonText = userAddress
    ? `Disconnect: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`
    : "Connect Wallet";

  // A single, clear handler for the button click
  const handleClick = () => {
    if (userAddress) {
      // If a user is connected, this button's only job is to disconnect.
      disconnectWallet();
    } else {
      // If no user is connected, this button's only job is to connect.
      connectWallet();
    }
  };

  return (
    <header className="app-header">
      <div className="header-title">
        <button
          className="connect-button"
          onClick={handleClick}
        >
          {buttonText}
        </button>
      </div>
      <div className="header-actions">
        {isAdmin && <span className="admin-badge">Admin View</span>}
      
      </div>
    </header>
  );
};

export default Header;