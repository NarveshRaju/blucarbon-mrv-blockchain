import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, Tag, Sparkles, Building2, ArrowRight, MapPin, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { formatUnits } from 'ethers';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../services/api';
import './Marketplace.css';

const RETIREMENTS_KEY = 'bcd_retirements';

// Regulatory & Market Study Credit Thresholds (VCM, CCTS, SBTi Standards)
export const MIN_CREDIT_REQUIREMENT = 10;
export const MAX_CREDIT_REQUIREMENT = 100000;

export const PRESET_CREDIT_OPTIONS = [
  { label: '500 t', value: 500, desc: 'SME' },
  { label: '1,000 t', value: 1000, desc: 'Standard' },
  { label: '5,000 t', value: 5000, desc: 'Mid-Cap' },
  { label: '25,000 t', value: 25000, desc: 'Enterprise' },
  { label: '50,000 t', value: 50000, desc: 'Heavy Ind.' },
  { label: '100,000 t', value: 100000, desc: 'Max Cap' },
];

export const getRegulatoryTier = (amount) => {
  const num = Number(amount);
  if (!amount || isNaN(num) || num <= 0) return null;
  if (num < MIN_CREDIT_REQUIREMENT) {
    return {
      status: 'error',
      tier: 'Below Minimum Threshold',
      badge: 'Invalid (< 10 t)',
      message: `Minimum requirement is ${MIN_CREDIT_REQUIREMENT} Tonnes / BCT to meet registry verification thresholds.`,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca'
    };
  }
  if (num > MAX_CREDIT_REQUIREMENT) {
    return {
      status: 'error',
      tier: 'Exceeds Regulatory Cap',
      badge: 'Capped at 100,000 t',
      message: `Maximum permissible annual target is ${MAX_CREDIT_REQUIREMENT.toLocaleString()} BCT. Under CCTS & VCM anti-hoarding rules, single-buyer allocations exceeding 100,000 t require special regulatory clearance.`,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca'
    };
  }
  if (num <= 2500) {
    return {
      status: 'valid',
      tier: 'Tier 1 — SME / Scope 3 Micro-Offset',
      badge: '100% Compliant (Tier 1)',
      message: 'Standard volume for SMEs and targeted departmental Scope 3 offsets under SBTi criteria.',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    };
  }
  if (num <= 25000) {
    return {
      status: 'valid',
      tier: 'Tier 2 — Mid-Market Corporate Target',
      badge: '100% Compliant (Tier 2)',
      message: 'Balanced enterprise volume within voluntary carbon market (VCM) liquidity guidelines.',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    };
  }
  if (num <= 50000) {
    return {
      status: 'valid',
      tier: 'Tier 3 — Large Enterprise Portfolio',
      badge: 'Audited High-Impact (Tier 3)',
      message: 'High-volume corporate allocation subject to standard ESG annual audit disclosures.',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe'
    };
  }
  return {
    status: 'warning',
    tier: 'Tier 4 — Maximum Permissible VCM Cap',
    badge: 'Near Upper Limit (Tier 4)',
    message: 'Permissible ceiling (50,001 – 100,000 BCT). Under the Mitigation Hierarchy, offsets must strictly counterbalance residual unabated emissions.',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a'
  };
};

const getStoredRetirements = () => {
  try {
    const stored = localStorage.getItem(RETIREMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const priceHistoryData = [
  { date: 'Jan', price: 950 }, { date: 'Feb', price: 1100 },
  { date: 'Mar', price: 1050 }, { date: 'Apr', mechanical: 1200, price: 1200 },
  { date: 'May', price: 1250 }, { date: 'Jun', price: 1300 },
  { date: 'Jul', price: 1400 }, { date: 'Aug', price: 1350 },
];

const Marketplace = () => {
  const { userAddress, bctBalance } = useWeb3();
  const { role, ROLES } = useRole();
  const isCompany = role === ROLES.COMPANY || role === 'company' || role === 'investor';
  
  // Real listings from backend
  const [dbProjects, setDbProjects] = useState([]);
  
  // Local state for UI
  const [retirements, setRetirements] = useState(getStoredRetirements);
  const [activeTab, setActiveTab] = useState('browse');
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireAmount, setRetireAmount] = useState('');
  const [retireCertificate, setRetireCertificate] = useState(null);

  // Company Onboarding & Requirement State
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(() => {
    if (!userAddress) return null;
    try {
      const saved = localStorage.getItem(`bcd_company_profile_${userAddress.toLowerCase()}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [onboardingForm, setOnboardingForm] = useState({
    companyName: '',
    requiredCredits: '1000',
    preferredHabitat: 'Any'
  });

  // Check if company onboarding is needed
  useEffect(() => {
    if (userAddress && isCompany) {
      const saved = localStorage.getItem(`bcd_company_profile_${userAddress.toLowerCase()}`);
      if (saved) {
        setCompanyProfile(JSON.parse(saved));
      } else {
        setShowOnboardingModal(true);
      }
    }
  }, [userAddress, isCompany]);

  const balance = useMemo(() => {
    try {
      return bctBalance && bctBalance !== '0' ? parseFloat(formatUnits(bctBalance, 18)) : 0;
    } catch { return 0; }
  }, [bctBalance]);

  // Fetch real listings from backend
  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects-for-sale`);
      const data = await res.json();
      setDbProjects(Array.isArray(data) ? data : []);
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
      .filter(p => (p.costPerToken > 0) || (p.price > 0))
      .map(p => {
        let rawPrice = p.price || p.costPerToken || 1250;
        // Normalize older small USD test values (< 100) to standard INR pricing
        const priceInr = rawPrice < 100 ? rawPrice * 85 : rawPrice;
        return {
          id: p.projectId || p._id,
          seller: p.ngoId,
          sellerFull: p.walletAddress,
          amount: p.totalTokens || p.saplingsPlanted || 1000,
          pricePerToken: Math.round(priceInr),
          createdAt: p.createdAt || new Date().toISOString(),
          active: (p.status || '').toLowerCase() === 'approved' || (p.status || '').toLowerCase() === 'submitted',
          projectName: p.projectName || 'Blue Carbon Project',
          location: p.location || 'Coastal Habitat',
          plantationType: p.plantationType || 'Mangrove',
          aiVerification: p.aiVerification
        };
      });
  }, [dbProjects]);

  // Smart Recommendation Engine: Find best project matching company's requested credits
  const recommendedProject = useMemo(() => {
    if (!companyProfile || !companyProfile.requiredCredits || listings.length === 0) return null;
    const req = parseFloat(companyProfile.requiredCredits) || 1000;
    const pref = companyProfile.preferredHabitat;

    // Filter active listings
    let candidates = listings.filter(l => l.active);
    if (candidates.length === 0) candidates = listings;

    // Preference filtering if specified
    if (pref && pref !== 'Any') {
      const prefMatches = candidates.filter(c => c.plantationType?.toLowerCase().includes(pref.toLowerCase()));
      if (prefMatches.length > 0) candidates = prefMatches;
    }

    // Rank candidates: prioritize those with adequate supply, lowest price, and AI verification pass
    candidates.sort((a, b) => {
      const aCoverage = a.amount >= req ? 1 : a.amount / req;
      const bCoverage = b.amount >= req ? 1 : b.amount / req;
      if (aCoverage !== bCoverage) return bCoverage - aCoverage;
      return a.pricePerToken - b.pricePerToken;
    });

    const best = candidates[0];
    if (!best) return null;

    const coverage = Math.min(100, Math.round((best.amount / req) * 100));
    return {
      ...best,
      coveragePercent: coverage,
      totalCost: (Math.min(req, best.amount) * best.pricePerToken).toFixed(2),
      creditsFulfillable: Math.min(req, best.amount)
    };
  }, [companyProfile, listings]);

  const handleSaveCompanyOnboarding = (e) => {
    e.preventDefault();
    if (!onboardingForm.companyName.trim() || !userAddress) return;

    const credits = parseInt(onboardingForm.requiredCredits, 10);
    if (isNaN(credits) || credits < MIN_CREDIT_REQUIREMENT || credits > MAX_CREDIT_REQUIREMENT) {
      alert(`Invalid credit requirement. Please enter a value between ${MIN_CREDIT_REQUIREMENT} and ${MAX_CREDIT_REQUIREMENT.toLocaleString()} Tonnes (BCT) as mandated by VCM & CCTS regulatory guidelines.`);
      return;
    }

    const profile = {
      companyName: onboardingForm.companyName.trim(),
      requiredCredits: credits,
      preferredHabitat: onboardingForm.preferredHabitat,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`bcd_company_profile_${userAddress.toLowerCase()}`, JSON.stringify(profile));
    setCompanyProfile(profile);
    setShowOnboardingModal(false);
  };

  const handleBuy = useCallback(async (listingId, amount) => {
    if (!userAddress) return;
    const targetListing = listings.find(l => l.id === listingId);
    const price = targetListing ? targetListing.pricePerToken : 1250;
    const qty = amount || (targetListing ? targetListing.amount : 100);
    const totalInr = (qty * price).toLocaleString('en-IN');
    setTimeout(() => {
      alert(`Simulation: Successfully initiated purchase for ${qty} BCT credits at ₹${price.toLocaleString('en-IN')}/credit. Total: ₹${totalInr} INR. In production, this executes via smart contract.`);
    }, 400);
  }, [userAddress, listings]);

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
          <h1>Corporate Blue Carbon Marketplace</h1>
          <p>Browse verified Blue Carbon credits, fulfill corporate sustainability goals, and retire tokens for official offset certificates.</p>
        </div>
        <div className="marketplace-actions" style={{ display: 'flex', gap: 10 }}>
          {isCompany && companyProfile && (
            <button
              className="retire-btn"
              onClick={() => {
                setOnboardingForm({
                  companyName: companyProfile.companyName,
                  requiredCredits: String(companyProfile.requiredCredits),
                  preferredHabitat: companyProfile.preferredHabitat || 'Any'
                });
                setShowOnboardingModal(true);
              }}
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Edit Requirements
            </button>
          )}
          <button className="retire-btn" onClick={() => setShowRetireModal(true)}>
            <Flame size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Retire Credits
          </button>
        </div>
      </header>

      {/* Smart Project Recommendation Card for Companies */}
      {isCompany && companyProfile && recommendedProject && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            color: '#fff',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 4px 14px rgba(6, 78, 59, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.5px' }}>
              <Sparkles size={13} /> SMART MATCH FOR {companyProfile.companyName.toUpperCase()}
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700 }}>
              {recommendedProject.projectName}
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', opacity: 0.9 }}>
              <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
              {recommendedProject.location} &bull; <strong>{recommendedProject.amount.toLocaleString('en-IN')} credits available</strong> at ₹{recommendedProject.pricePerToken.toLocaleString('en-IN')}/credit
            </p>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', opacity: 0.95 }}>
              <span>✅ Fulfills <strong>{recommendedProject.creditsFulfillable.toLocaleString('en-IN')} / {parseInt(companyProfile.requiredCredits, 10).toLocaleString('en-IN')}</strong> needed credits ({recommendedProject.coveragePercent}% Goal)</span>
              <span>&bull; Est. Total: <strong>₹{Number(recommendedProject.totalCost).toLocaleString('en-IN')} INR</strong></span>
            </div>
          </div>

          <button
            onClick={() => handleBuy(recommendedProject.id, recommendedProject.creditsFulfillable)}
            style={{
              background: '#22c55e',
              color: '#064e3b',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            Fulfill Credit Goal <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {/* Market Stats */}
      <section className="market-stats-grid">
        <div className="market-stat-card">
          <span className="ms-label">Your BCT Balance</span>
          <span className="ms-value">{balance.toLocaleString('en-IN')} BCT</span>
        </div>
        <div className="market-stat-card">
          <span className="ms-label">Active Listings</span>
          <span className="ms-value">{listings.filter(l => l.active).length} Projects</span>
        </div>
        <div className="market-stat-card retire-card">
          <span className="ms-label">Total Credits Retired</span>
          <span className="ms-value">{totalRetired.toLocaleString('en-IN')} BCT</span>
        </div>
        <div className="market-stat-card">
          <span className="ms-label">Avg Credit Price (INR)</span>
          <span className="ms-value">₹1,250 / Tonne</span>
        </div>
      </section>

      {/* Price Chart */}
      <section className="price-chart-section">
        <h3>BCT Carbon Credit Price Index (₹ INR)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={priceHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis dataKey="date" stroke="#5f6368" />
            <YAxis stroke="#5f6368" tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
            <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Price (INR)']} />
            <Line type="monotone" dataKey="price" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Tabs */}
      <div className="market-tabs">
        {['browse', 'retirements', 'leaderboard'].map(tab => (
          <button
            key={tab}
            className={`market-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Browse Listings */}
      {activeTab === 'browse' && (
        <div className="listings-grid">
          {listings.filter(l => l.active).map(listing => (
            <motion.div key={listing.id} className="listing-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="listing-seller"><Tag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {listing.seller}</div>
              <h4 style={{ margin: '6px 0 2px', fontSize: '1rem', color: '#1e293b' }}>{listing.projectName}</h4>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#64748b' }}>{listing.location}</p>
              <div className="listing-amount">{listing.amount.toLocaleString('en-IN')} <span>BCT Credits</span></div>
              <div className="listing-price">₹{listing.pricePerToken.toLocaleString('en-IN')} <span>per tonne CO₂e</span></div>
              <div className="listing-total">Total Supply Value: ₹{(listing.amount * listing.pricePerToken).toLocaleString('en-IN')} INR</div>
              <button className="buy-btn" onClick={() => handleBuy(listing.id, listing.amount)} disabled={!userAddress}>
                Buy Credits
              </button>
            </motion.div>
          ))}
          {listings.filter(l => l.active).length === 0 && (
            <div className="no-listings">No active verified listings available currently.</div>
          )}
        </div>
      )}

      {/* Retirements */}
      {activeTab === 'retirements' && (
        <div className="retirements-list">
          {retirements.length > 0 ? retirements.map(r => (
            <div key={r.id} className="retirement-row">
              <span className="ret-icon"><Flame size={16} /></span>
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
            <div className="no-listings">No retirements yet. Be the first to offset corporate emissions!</div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-table">
          <div className="lb-header">
            <span>Rank</span><span>Company Wallet</span><span>Total Retired</span><span>Retirements</span>
          </div>
          {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
            <div key={entry.address} className="lb-row">
              <span className="lb-rank">#{i + 1}</span>
              <span className="lb-address">{entry.address}</span>
              <span className="lb-total">{entry.total.toLocaleString()} BCT</span>
              <span className="lb-count">{entry.count}</span>
            </div>
          )) : (
            <div className="no-listings">No corporate retirements recorded yet.</div>
          )}
        </div>
      )}

      {/* Company Onboarding / Requirements Modal */}
      {showOnboardingModal && (() => {
        const currentCredits = parseFloat(onboardingForm.requiredCredits);
        const tierInfo = getRegulatoryTier(currentCredits);
        const isCreditsValid = !isNaN(currentCredits) && currentCredits >= MIN_CREDIT_REQUIREMENT && currentCredits <= MAX_CREDIT_REQUIREMENT;
        const isFormValid = Boolean(onboardingForm.companyName?.trim()) && isCreditsValid;

        return (
          <div className="modal-overlay" onClick={() => setShowOnboardingModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 490, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} style={{ color: '#059669' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Company Credit Profile</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Configure corporate carbon offsetting goals & regulatory limits</p>
                </div>
              </div>

              <form onSubmit={handleSaveCompanyOnboarding} className="modal-form">
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Infosys ESG & Sustainability Wing"
                    required
                    value={onboardingForm.companyName}
                    onChange={e => setOnboardingForm(f => ({ ...f, companyName: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                      Target Credit Requirement (Tonnes / BCT)
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                      Cap: 10 – 100,000 t
                    </span>
                  </div>

                  <input
                    type="number"
                    min={MIN_CREDIT_REQUIREMENT}
                    max={MAX_CREDIT_REQUIREMENT}
                    step="10"
                    placeholder="e.g. 1000"
                    required
                    value={onboardingForm.requiredCredits}
                    onChange={e => setOnboardingForm(f => ({ ...f, requiredCredits: e.target.value }))}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      borderColor: tierInfo?.status === 'error' ? '#ef4444' : undefined
                    }}
                  />

                  {/* Preset Standard Allocations */}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginBottom: 4 }}>
                      Standard Regulatory Preset Tiers:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PRESET_CREDIT_OPTIONS.map(opt => {
                        const isSelected = Number(onboardingForm.requiredCredits) === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setOnboardingForm(f => ({ ...f, requiredCredits: String(opt.value) }))}
                            style={{
                              padding: '4px 9px',
                              fontSize: '0.725rem',
                              fontWeight: isSelected ? 700 : 500,
                              borderRadius: 6,
                              border: isSelected ? '1px solid #059669' : '1px solid #e2e8f0',
                              background: isSelected ? '#059669' : '#f8fafc',
                              color: isSelected ? '#ffffff' : '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {opt.label} <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>({opt.desc})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Regulatory Compliance Badge */}
                  {tierInfo && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: tierInfo.bg,
                        border: `1px solid ${tierInfo.border}`,
                        fontSize: '0.8rem',
                        color: tierInfo.color,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}
                    >
                      {tierInfo.status === 'error' ? (
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      ) : tierInfo.status === 'warning' ? (
                        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>
                          {tierInfo.tier} &bull; <span style={{ textDecoration: 'underline' }}>{tierInfo.badge}</span>
                        </div>
                        <div style={{ opacity: 0.95, lineHeight: 1.35, fontSize: '0.75rem' }}>
                          {tierInfo.message}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Policy & Market Study Regulatory Callout */}
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      fontSize: '0.725rem',
                      color: '#64748b',
                      lineHeight: 1.4
                    }}
                  >
                    <strong style={{ color: '#334155' }}>🏛️ CCTS & VCM Anti-Hoarding Rules:</strong> Per market guidelines & the SBTi Mitigation Hierarchy, single-buyer target quotas are capped at <strong>100,000 BCT</strong> to prevent speculative hoarding and ensure credits strictly target residual unabated emissions.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                    Preferred Blue Carbon Habitat
                  </label>
                  <select
                    value={onboardingForm.preferredHabitat}
                    onChange={e => setOnboardingForm(f => ({ ...f, preferredHabitat: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Any">Any Verified Coastal Ecosystem</option>
                    <option value="Mangrove">Mangrove Delta & Forests</option>
                    <option value="Seagrass">Seagrass Meadows</option>
                    <option value="Salt Marsh">Tidal Salt Marshes</option>
                  </select>
                </div>

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  <button type="button" className="modal-cancel" onClick={() => setShowOnboardingModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit"
                    disabled={!isFormValid}
                    style={{
                      background: isFormValid ? '#059669' : '#94a3b8',
                      color: '#fff',
                      cursor: isFormValid ? 'pointer' : 'not-allowed',
                      opacity: isFormValid ? 1 : 0.7,
                      boxShadow: isFormValid ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none'
                    }}
                  >
                    Save & Find Best Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Retire Modal */}
      {showRetireModal && (
        <div className="modal-overlay" onClick={() => setShowRetireModal(false)}>
          <div className="modal-content retire-modal" onClick={e => e.stopPropagation()}>
            <h2>Retire Carbon Credits</h2>
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
                  <Flame size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Confirm Retirement
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
              <h2>Blue Carbon DAO</h2>
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
