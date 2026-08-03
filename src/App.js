import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import providers
import { Web3Provider } from './Web3Context'; 
import { RoleProvider } from './RoleContext';

// Import layout components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoleSelector from './components/RoleSelector';

// Import page components
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

import './App.css';

function App() {
  return (
    <Web3Provider>
      <RoleProvider>
        <Router>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Header />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ngo/submit" element={<SubmitProject />} />
                <Route path="/ngo/projects" element={<MyProjects />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/token-registry" element={<TokenRegistry />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/governance" element={<Governance />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/mrv-map" element={<MRVMap />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </main>
            {/* Role selector modal - shown on first wallet connection */}
            <RoleSelector />
          </div>
        </Router>
      </RoleProvider>
    </Web3Provider>
  );
}

export default App;