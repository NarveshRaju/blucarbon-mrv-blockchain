import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { 
  Satellite, 
  Cpu, 
  ShieldCheck, 
  Coins, 
  Sprout, 
  Search, 
  Gem, 
  ArrowRight, 
  Layers, 
  Globe2, 
  CheckCircle2
} from 'lucide-react';
import Button from '../components/ui/Button';
import './LandingPage.css';

const LandingPage = () => {
  const { connectWallet, loading, userAddress } = useWeb3();

  const handleConnect = async () => {
    if (!userAddress) {
      await connectWallet();
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const workflowSteps = [
    {
      icon: <Sprout size={20} />,
      title: 'Mangrove Restoration',
      desc: 'Field plantation & project boundaries'
    },
    {
      icon: <Satellite size={20} />,
      title: 'Satellite Data',
      desc: 'Multi-spectral vegetation imagery'
    },
    {
      icon: <Cpu size={20} />,
      title: 'AI Biomass Analysis',
      desc: 'Canopy density & carbon estimation'
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'DAO Verification',
      desc: 'Independent validator consensus'
    },
    {
      icon: <Layers size={20} />,
      title: 'Blockchain Record',
      desc: 'Immutable audit trail on Sepolia'
    },
    {
      icon: <Coins size={20} />,
      title: 'Carbon Credits (BCT)',
      desc: 'Tokenized verified carbon offsets'
    }
  ];

  const features = [
    {
      icon: <Satellite size={26} />,
      title: 'Satellite Monitoring',
      desc: 'Monitor mangrove regions using satellite-based geospatial imagery and vegetation index data.'
    },
    {
      icon: <Cpu size={26} />,
      title: 'AI-Based Assessment',
      desc: 'Analyze vegetation health, canopy coverage, and estimate biomass and carbon sequestration.'
    },
    {
      icon: <ShieldCheck size={26} />,
      title: 'Transparent Verification',
      desc: 'Support reliable verification using decentralized validation by qualified DAO reviewers.'
    },
    {
      icon: <Coins size={26} />,
      title: 'Carbon Credit Tracking',
      desc: 'Track verified credits through the complete lifecycle from issuance to marketplace retirement.'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Project Registration',
      desc: 'NGOs submit mangrove restoration details, land tenure, and baseline information.'
    },
    {
      step: '02',
      title: 'Geospatial & Satellite MRV',
      desc: 'High-resolution multispectral data tracks vegetation growth and canopy density over time.'
    },
    {
      step: '03',
      title: 'Independent Verification',
      desc: 'Qualified DAO validators review ground evidence and baseline carbon pools to cast consensus votes.'
    },
    {
      step: '04',
      title: 'Credit Issuance & Trading',
      desc: 'Smart contracts mint verified Blue Carbon Tokens (BCT) directly for retirement or open market listing.'
    }
  ];

  const roles = [
    {
      role: 'NGO / Restoration Steward',
      tag: 'Project Creators',
      icon: <Sprout size={32} className="role-icon-ngo" />,
      points: [
        'Register mangrove restoration projects with GIS boundaries',
        'Upload geotagged field photos & drone survey evidence',
        'Record baseline biomass & soil carbon metrics',
        'Receive BCT tokens for verified sequestration'
      ],
      badgeClass: 'badge-ngo'
    },
    {
      role: 'Validator',
      tag: 'DAO Verifiers',
      icon: <Search size={32} className="role-icon-validator" />,
      points: [
        'Review submitted NGO project applications',
        'Inspect field evidence & baseline metrics',
        'Vote to approve or reject submissions',
        'Participate in decentralized DAO governance'
      ],
      badgeClass: 'badge-validator'
    },
    {
      role: 'Investor / Company',
      tag: 'Carbon Offsetters',
      icon: <Gem size={32} className="role-icon-investor" />,
      points: [
        'Explore verified blue carbon projects',
        'Access transparent MRV data & impact metrics',
        'Acquire BCT tokens on the open marketplace',
        'Permanently retire credits with official certificates'
      ],
      badgeClass: 'badge-investor'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-brand">
            <div className="landing-logo-badge">
              <Sprout size={22} className="brand-logo-icon" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">BlueChain</span>
              <span className="brand-tagline">MRV & Carbon Credit Platform</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <Link to="/explore" className="nav-link-btn highlight-link">
              Explore Projects
            </Link>
            <button onClick={() => scrollToSection('about')} className="nav-link-btn">About</button>
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link-btn">How it Works</button>
            <button onClick={() => scrollToSection('roles')} className="nav-link-btn">Roles</button>
            <button
              type="button"
              onClick={handleConnect}
              className="landing-nav-connect-btn"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="about" className="landing-hero-section">
        <div className="landing-container hero-grid">
          <div className="hero-content">
            <div className="hero-pill">
              <Globe2 size={14} />
              <span>Blue Carbon MRV & Decentralized Verification</span>
            </div>
            <h1 className="hero-title">
              Blue Carbon Credit Monitoring & Verification
            </h1>
            <p className="hero-description">
              A technology-driven platform for monitoring mangrove projects, verifying carbon data, and enabling transparent carbon credit management.
            </p>

            <div className="hero-cta-group">
              <Link to="/explore" className="bc-btn bc-btn--primary bc-btn--lg">
                <Globe2 size={18} /> Explore Projects
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleConnect}
                loading={loading}
                loadingText="Opening MetaMask..."
                icon={<ArrowRight size={18} />}
              >
                Connect Wallet to Enter
              </Button>
            </div>

            <div className="hero-trust-indicators">
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Transparent MRV Lifecycle</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Decentralized Validator Review</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>On-Chain Token Issuance</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Workflow Pipeline */}
          <div className="hero-visual">
            <div className="workflow-card">
              <div className="workflow-card-header">
                <div className="workflow-badge">End-to-End MRV Pipeline</div>
                <h3>Verification & Issuance Flow</h3>
              </div>

              <div className="workflow-pipeline">
                {workflowSteps.map((step, idx) => (
                  <div key={idx} className="pipeline-item">
                    <div className="pipeline-node">
                      <div className="pipeline-icon-circle">
                        {step.icon}
                      </div>
                      {idx < workflowSteps.length - 1 && <div className="pipeline-connector-line" />}
                    </div>
                    <div className="pipeline-info">
                      <span className="pipeline-step-num">Step 0{idx + 1}</span>
                      <h4 className="pipeline-step-title">{step.title}</h4>
                      <p className="pipeline-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="landing-section bg-alt">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Platform Capabilities</span>
            <h2 className="section-title">Core Technology Features</h2>
            <p className="section-subtitle">
              Engineered to support integrity, precision, and transparency throughout the blue carbon lifecycle.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon-box">
                  {feat.icon}
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Methodology</span>
            <h2 className="section-title">How BlueChain Works</h2>
            <p className="section-subtitle">
              A 5-step visual workflow bridging coastal restoration with decentralized verification.
            </p>
          </div>

          <div className="steps-container">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number-tag">{item.step}</div>
                <h3 className="step-card-title">{item.title}</h3>
                <p className="step-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="landing-section bg-alt">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Ecosystem Participants</span>
            <h2 className="section-title">Who Can Use BlueChain?</h2>
            <p className="section-subtitle">
              Collaborative roles designed for project developers, independent validators, and carbon buyers.
            </p>
          </div>

          <div className="roles-grid">
            {roles.map((roleItem, idx) => (
              <div key={idx} className="role-card">
                <div className="role-card-top">
                  <div className="role-icon-wrapper">
                    {roleItem.icon}
                  </div>
                  <span className={`role-pill-badge ${roleItem.badgeClass}`}>
                    {roleItem.tag}
                  </span>
                </div>

                <h3 className="role-name">{roleItem.role}</h3>

                <ul className="role-points-list">
                  {roleItem.points.map((pt, pIdx) => (
                    <li key={pIdx}>
                      <CheckCircle2 size={16} className="point-check" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action / CTA Banner */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="cta-box">
            <div className="cta-content">
              <h2>Ready to Participate in Blue Carbon MRV?</h2>
              <p>Connect your MetaMask wallet to register projects, review submissions, or explore verified credits.</p>
            </div>
            <div className="cta-action">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConnect}
                loading={loading}
                loadingText="Connecting..."
                icon={<Coins size={18} />}
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Sprout size={18} />
              <span>BlueChain</span>
            </div>
            <p>Design and Development of Blue Carbon Credit Monitoring and Verification System.</p>
          </div>
          <div className="footer-meta">
            <p className="footer-copyright">
              BE Major Project • Measurement, Reporting & Verification (MRV)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
