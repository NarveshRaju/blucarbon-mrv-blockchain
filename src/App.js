import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Import providers
import { Web3Provider, useWeb3 } from './Web3Context'; 
import { RoleProvider, useRole } from './RoleContext';

// Import layout components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoleSelector from './components/RoleSelector';

// Import page components
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import TokenRegistry from './pages/TokenRegistry';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail';
import Governance from './pages/Governance';
import Marketplace from './pages/Marketplace';
import MRVMap from './pages/MRVMap';
import Analytics from './pages/Analytics';
import SubmitProject from './pages/SubmitProject';
import MyProjects from './pages/MyProjects';
import NGOOnboarding from './pages/NGOOnboarding';
import NGOVerify from './pages/NGOVerify';
import ProjectExplorer from './pages/ProjectExplorer';
import AIVerification from './pages/AIVerification';

import './App.css';

function MainLayout() {
  const { userAddress } = useWeb3();
  const { loadRoleForAddress } = useRole();
  const location = useLocation();

  // Load saved role whenever wallet connects or changes
  useEffect(() => {
    if (userAddress) {
      loadRoleForAddress(userAddress);
    }
  }, [userAddress, loadRoleForAddress]);

  // Hide sidebar on the landing page (when user is not connected on "/" or explicitly on "/landing")
  const isLandingPage = (!userAddress && location.pathname === '/') || location.pathname === '/landing';

  return (
    <div className={`app-container ${isLandingPage ? 'landing-view-container' : ''}`}>
      {!isLandingPage && <Sidebar />}
      <main className={isLandingPage ? 'landing-main-content' : 'main-content'}>
        {!isLandingPage && <Header />}
        <Routes>
          {/* Main Landing / Dashboard Route */}
          <Route path="/" element={userAddress ? <Dashboard /> : <LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Public Discovery & Project Explorer */}
          <Route path="/explore" element={<ProjectExplorer />} />
          <Route path="/projects" element={<ProjectExplorer />} />
          <Route path="/projects-for-sale" element={<ProjectExplorer />} />

          {/* NGO Verification, Onboarding & Management Routes with Aliases */}
          <Route path="/ngo/verify" element={<NGOVerify />} />
          <Route path="/verify-ngo" element={<NGOVerify />} />
          <Route path="/ngo/onboarding" element={<NGOOnboarding />} />
          <Route path="/onboarding" element={<NGOOnboarding />} />
          <Route path="/ngo/submit" element={<SubmitProject />} />
          <Route path="/submit" element={<SubmitProject />} />
          <Route path="/submit-project" element={<SubmitProject />} />
          <Route path="/ngo/projects" element={<MyProjects />} />
          <Route path="/my-projects" element={<MyProjects />} />

          {/* AI Pre-Verification & Validator Review Routes */}
          <Route path="/ai-verification" element={<AIVerification />} />
          <Route path="/ai" element={<AIVerification />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/validator" element={<Verification />} />

          {/* Dynamic Project Details Route */}
          <Route path="/project/:projectId" element={<ProjectDetail />} />

          {/* DAO Governance & Marketplace Routes */}
          <Route path="/governance" element={<Governance />} />
          <Route path="/dao" element={<Governance />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/token-registry" element={<TokenRegistry />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mrv-map" element={<MRVMap />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* Fallback Catch-All */}
          <Route path="*" element={userAddress ? <Dashboard /> : <LandingPage />} />
        </Routes>
      </main>
      {/* Role selector modal */}
      <RoleSelector />
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <RoleProvider>
        <Router>
          <MainLayout />
        </Router>
      </RoleProvider>
    </Web3Provider>
  );
}

export default App;