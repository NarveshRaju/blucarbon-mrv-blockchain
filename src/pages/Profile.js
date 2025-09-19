import React from 'react';
import './Profile.css';

const votingHistory = [
    { id: 1, name: 'Mangrove Restoration Initiative', date: '1/16/2024', status: 'Approved' },
    { id: 2, name: 'Seagrass Meadow Protection', date: '1/21/2024', status: 'Approved' },
    { id: 3, name: 'Salt Marsh Rehabilitation', date: '1/26/2024', status: 'Rejected' }
];

const Profile = () => {
    return (
        <div className="profile-container">
            <header className="page-header">
                <h1>DAO Member Profile</h1>
                <p>Manage your validator profile and view voting history</p>
            </header>

            <div className="profile-main-card">
                <div className="profile-info">
                    <div className="avatar">DS</div>
                    <div>
                        <h2>Dr. Sarah Chen</h2>
                        <span className="validator-tag">Validator</span>
                    </div>
                </div>

                <div className="wallet-info">
                    <h3>Wallet Information</h3>
                    <div className="wallet-address-container">
                        <div>
                            <p className="wallet-label">Wallet Address</p>
                            <p className="wallet-address">0x1234567890abcdef1234567890a...</p>
                        </div>
                        <div>
                            <p className="wallet-label">Connection Status</p>
                            <p className="connection-status connected">● Connected</p>
                        </div>
                    </div>
                </div>

                <div className="activity-summary">
                    <h3>Activity Summary</h3>
                    <div className="summary-boxes">
                        <div className="summary-box">
                            <span className="summary-value">15</span>
                            <span className="summary-label">Votes Cast</span>
                        </div>
                        <div className="summary-box">
                            <span className="summary-value">2,500</span>
                            <span className="summary-label">BlueGov Tokens</span>
                        </div>
                        <div className="summary-box">
                            <span className="summary-value">2</span>
                            <span className="summary-label">Projects Approved</span>
                        </div>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="disconnect-btn">Disconnect Wallet</button>
                    <button className="edit-profile-btn">Edit Profile</button>
                </div>
            </div>

            <div className="profile-sub-card">
                <h3>Voting History</h3>
                <p>Your recent voting activity on project submissions</p>
                {votingHistory.map(item => (
                    <div key={item.id} className="history-item">
                        <div className="history-info">
                            <span className={`status-icon ${item.status.toLowerCase()}`}>✓</span>
                            <div>
                                <p className="history-name">{item.name}</p>
                                <p className="history-id">Project ID: {item.id}</p>
                            </div>
                        </div>
                        <div className="history-details">
                             <span className={`history-status-tag ${item.status.toLowerCase()}`}>{item.status}</span>
                             <p className="history-date">{item.date}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="profile-sub-card">
                <h3>Governance Tokens</h3>
                <p>Your BlueGov token balance and voting power</p>
                 <div className="token-balance-container">
                    <div>
                        <p className="balance-label">Current Balance</p>
                        <p className="balance-value">2,500</p>
                    </div>
                    <div>
                        <p className="balance-label">Voting Power</p>
                        <p className="voting-power">2.50%</p>
                    </div>
                </div>
                <p className="token-description">BlueGov tokens represent your voting power in the DAO. Tokens are earned through active participation in project verification and governance activities.</p>
            </div>
        </div>
    );
};

export default Profile;