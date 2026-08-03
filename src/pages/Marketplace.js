import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3 } from '../Web3Context';
import { formatUnits } from 'ethers';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../services/api';
import './Marketplace.css';

const LISTINGS_KEY = 'bcd_marketplace_listings';
const RETIREMENTS_KEY = 'bcd_retirements';

// We no longer use dummy local listings.

const getStoredRetirements = () => {
  try {
    const stored = localStorage.getItem(RETIREMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const getDefaultListings = () => [
  { id: 'lst-001', seller: '0x742d...35Cc', amount: 500, pricePerToken: 0.05, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), active: true },
  { id: 'lst-002', seller: '0x8ba1...9fE2', amount: 1200, pricePerToken: 0.048, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), active: true },
  { id: 'lst-003', seller: '0x3eF4...1aB7', amount: 300, pricePerToken: 0.055, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), active: true },
];

const priceHistoryData = [
  { date: 'Jan', price: 0.032 }, { date: 'Feb', price: 0.038 },
  { date: 'Mar', price: 0.035 }, { date: 'Apr', price: 0.042 },
  { date: 'May', price: 0.045 }, { date: 'Jun', price: 0.048 },
  { date: 'Jul', price: 0.052 }, { date: 'Aug', price: 0.05 },
];

const Marketplace = () => {
  const { userAddress, bctBalance } = useWeb3();
  
  // Real listings from backend
  const [dbProjects, setDbProjects] = useState([]);
  
  // Local state for UI
  const [retirements, setRetirements] = useState(getStoredRetirements);
  const [activeTab, setActiveTab] = useState('browse');
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireAmount, setRetireAmount] = useState('');
  const [retireCertificate, setRetireCertificate] = useState(null);

  const balance = useMemo(() => {
    try {
      return bctBalance && bctBalance !== '0' ? parseFloat(formatUnits(bctBalance, 18)) : 0;
    } catch { return 0; }
  }, [bctBalance]);

  // Fetch real listings from backend
  const fetchListings = useCallback(async () => {
    try {
      // Use the generic projects-for-sale endpoint
      const res = await fetch(`${API_BASE_URL}/projects-for-sale`);
      const data = await res.json();
      setDbProjects(data);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => { localStorage.setItem(RETIREMENTS_KEY, JSON.stringify(retirements)); }, [retirements]);

  const totalRetired = useMemo(() => retirements.reduce((sum, r) => sum + r.amount, 0), [retirements]);

  const leaderboard = useMemo(() => {
    const map = {};
    retirements.forEach(r => {
      if (!map[r.address]) map[r.address] = { address: r.address, total: 0, count: 0 };
      map[r.address].total += r.amount;
      map[r.address].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [retirements]);

  // Map db projects to marketplace listings format
  const listings = useMemo(() => {
    return dbProjects
      .filter(p => (p.costPerToken > 0) || (p.price > 0)) // Must have a price to be listed
      .map(p => ({
        id: p.projectId || p._id,
        seller: p.ngoId,
        sellerFull: p.walletAddress,
        amount: p.totalTokens || p.saplingsPlanted,
        pricePerToken: p.price || p.costPerToken,
        createdAt: p.createdAt || new Date().toISOString(),
        active: (p.status || '').toLowerCase() === 'approved', // Active if approved and not yet bought
        projectName: p.projectName
      }));
  }, [dbProjects]);

  const handleBuy = useCallback(async (listingId) => {
    if (!userAddress) return;
    
    // In a fully developed Web3 app, this would trigger a smart contract transaction.
    // For now, we simulate the transaction and alert the user.
    setTimeout(() => {
      alert(`Simulation: You have initiated a purchase for listing ${listingId}. In production, this would open MetaMask to send ETH.`);
    }, 1000);
  }, [userAddress]);

  const handleRetire = useCallback(() => {
    const amount = parseFloat(retireAmount);
    if (!amount || amount <= 0 || !userAddress) return;

    const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    const retirement = {
      id: `ret-${Date.now()}`,
      address: shortAddr,
      addressFull: userAddress,
      amount,
      timestamp: new Date().toISOString(),
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };

    setRetirements(prev => [retirement, ...prev]);

    // Generate certificate
    setRetireCertificate({
      ...retirement,
      certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
    });

    setRetireAmount('');
    setShowRetireModal(false);
  }, [retireAmount, userAddress]);

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div>
          <h1>Carbon Credit Marketplace</h1>
          <p>Trade BCT tokens and retire carbon credits for verified offsets</p>
        </div>
        <div className="marketplace-actions">
          <button className="retire-btn" onClick={() => setShowRetireModal(true)}>
            🔥 Retire Credits
          </button>
        </div>
      </header>

      {/* Market Stats */}
      <section className="market-stats-grid">
        <div className="market-stat-card">
          <span className="ms-label">Your BCT Balance</span>
          <span className="ms-value">{balance.toLocaleString()}</span>
        </div>
        <div className="market-stat-card">
          <span className="ms-label">Active Listings</span>
          <span className="ms-value">{listings.filter(l => l.active).length}</span>
        </div>
        <div className="market-stat-card retire-card">
          <span className="ms-label">Total BCT Retired</span>
          <span className="ms-value">{totalRetired.toLocaleString()}</span>
        </div>
        <div className="market-stat-card">
          <span className="ms-label">Floor Price</span>
          <span className="ms-value">0.048 ETH</span>
        </div>
      </section>

      {/* Price Chart */}
      <section className="price-chart-section">
        <h3>BCT Price History</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={priceHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis dataKey="date" stroke="#5f6368" />
            <YAxis stroke="#5f6368" tickFormatter={(v) => `${v} ETH`} />
            <Tooltip formatter={(v) => [`${v} ETH`, 'Price']} />
            <Line type="monotone" dataKey="price" stroke="#1a73e8" strokeWidth={3} dot={{ fill: '#1a73e8', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Tabs */}
      <div className="market-tabs">
        {['browse', 'my-listings', 'retirements', 'leaderboard'].map(tab => (
          <button
            key={tab}
            className={`market-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'my-listings' ? 'My Listings' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Browse Listings */}
      {activeTab === 'browse' && (
        <div className="listings-grid">
          {listings.filter(l => l.active).map(listing => (
            <motion.div key={listing.id} className="listing-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="listing-seller">🏷️ {listing.seller}</div>
              <div className="listing-amount">{listing.amount.toLocaleString()} <span>BCT</span></div>
              <div className="listing-price">{listing.pricePerToken} ETH <span>per token</span></div>
              <div className="listing-total">Total: {(listing.amount * listing.pricePerToken).toFixed(4)} ETH</div>
              <button className="buy-btn" onClick={() => handleBuy(listing.id)} disabled={!userAddress}>
                Buy Now
              </button>
            </motion.div>
          ))}
          {listings.filter(l => l.active).length === 0 && (
            <div className="no-listings">No active listings. Be the first to list!</div>
          )}
        </div>
      )}

      {/* My Listings */}
      {activeTab === 'my-listings' && (
        <div className="listings-grid">
          {listings.filter(l => l.sellerFull === userAddress).map(listing => (
            <div key={listing.id} className={`listing-card ${!listing.active ? 'sold' : ''}`}>
              <div className="listing-amount">{listing.amount.toLocaleString()} <span>BCT</span></div>
              <div className="listing-price">{listing.pricePerToken} ETH <span>per token</span></div>
              <span className={`listing-status-badge ${listing.active ? 'active' : 'sold'}`}>
                {listing.active ? 'Active' : 'Sold'}
              </span>
            </div>
          ))}
          {listings.filter(l => l.sellerFull === userAddress).length === 0 && (
            <div className="no-listings">You haven't listed any tokens yet.</div>
          )}
        </div>
      )}

      {/* Retirements */}
      {activeTab === 'retirements' && (
        <div className="retirements-list">
          {retirements.length > 0 ? retirements.map(r => (
            <div key={r.id} className="retirement-row">
              <span className="ret-icon">🔥</span>
              <div className="ret-info">
                <strong>{r.amount.toLocaleString()} BCT retired</strong>
                <span className="ret-address">{r.address}</span>
              </div>
              <div className="ret-meta">
                <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                <span className="ret-tx">{r.txHash.substring(0, 10)}...</span>
              </div>
            </div>
          )) : (
            <div className="no-listings">No retirements yet. Be the first to offset!</div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-table">
          <div className="lb-header">
            <span>Rank</span><span>Address</span><span>Total Retired</span><span>Retirements</span>
          </div>
          {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
            <div key={entry.address} className="lb-row">
              <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <span className="lb-address">{entry.address}</span>
              <span className="lb-total">{entry.total.toLocaleString()} BCT</span>
              <span className="lb-count">{entry.count}</span>
            </div>
          )) : (
            <div className="no-listings">No retirements recorded yet.</div>
          )}
        </div>
      )}

      {/* Create Listing Modal has been moved to MyProjects.js for NGOs */}
      {/* Retire Modal */}
      {showRetireModal && (
        <div className="modal-overlay" onClick={() => setShowRetireModal(false)}>
          <div className="modal-content retire-modal" onClick={e => e.stopPropagation()}>
            <h2>🔥 Retire Carbon Credits</h2>
            <p className="retire-description">
              Permanently burn BCT tokens to claim verified carbon offsets. This action is irreversible and generates a retirement certificate.
            </p>
            <div className="modal-form">
              <label>Amount to Retire (BCT)</label>
              <input type="number" placeholder="e.g. 50" value={retireAmount}
                onChange={e => setRetireAmount(e.target.value)} />
              <p className="retire-balance">Available: {balance.toLocaleString()} BCT</p>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowRetireModal(false)}>Cancel</button>
                <button className="retire-confirm-btn" onClick={handleRetire}
                  disabled={!retireAmount || parseFloat(retireAmount) <= 0}>
                  🔥 Confirm Retirement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retirement Certificate */}
      {retireCertificate && (
        <div className="modal-overlay" onClick={() => setRetireCertificate(null)}>
          <div className="certificate-card" onClick={e => e.stopPropagation()}>
            <div className="cert-header">
              <span className="cert-badge">CARBON OFFSET CERTIFICATE</span>
              <h2>🌿 Blue Carbon DAO</h2>
            </div>
            <div className="cert-body">
              <p className="cert-amount">{retireCertificate.amount.toLocaleString()} BCT</p>
              <p className="cert-label">Carbon Credits Permanently Retired</p>
              <div className="cert-details">
                <div><span>Certificate ID</span><strong>{retireCertificate.certificateId}</strong></div>
                <div><span>Retired By</span><strong>{retireCertificate.address}</strong></div>
                <div><span>Date</span><strong>{new Date(retireCertificate.timestamp).toLocaleDateString()}</strong></div>
                <div><span>Transaction</span><strong>{retireCertificate.txHash.substring(0, 16)}...</strong></div>
              </div>
            </div>
            <div className="cert-footer">
              <p>This certificate verifies the permanent retirement of carbon credits on the blockchain.</p>
              <button className="cert-close" onClick={() => setRetireCertificate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
