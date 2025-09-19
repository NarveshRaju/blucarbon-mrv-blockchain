import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import TokenRegistry from './pages/TokenRegistry';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail'; // Import the new component
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/token-registry" element={<TokenRegistry />} />
            <Route path="/profile" element={<Profile />} />
            {/* Add the dynamic route for project details */}
            <Route path="/project/:projectId" element={<ProjectDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;