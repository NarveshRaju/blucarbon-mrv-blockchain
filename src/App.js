import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import the Web3Provider and your components
import { Web3Provider } from './Web3Context'; 
import Header from './components/Header';
import Sidebar from './components/Sidebar'; // Make sure the path is correct

// Import your page components
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import TokenRegistry from './pages/TokenRegistry';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="app-container">
          {/* --- FIX: The Sidebar is added back here for navigation --- */}
          <Sidebar />

          <main className="main-content">
            {/* --- The new Header remains here for the wallet button --- */}
            <Header />
            
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/token-registry" element={<TokenRegistry />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/project/:projectId" element={<ProjectDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;