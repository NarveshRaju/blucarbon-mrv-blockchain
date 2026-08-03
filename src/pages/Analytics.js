import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './Analytics.css';

const COLORS = ['#34a853', '#fbbc05', '#ea4335', '#1a73e8', '#ff6d00', '#9c27b0'];

const Analytics = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to fetch analytics data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Carbon sequestration over time (cumulative)
  const sequestrationData = useMemo(() => {
    if (!projects.length) return [];
    const sorted = [...projects]
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let cumulative = 0;
    const monthly = {};
    sorted.forEach(p => {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const trees = p.saplingsPlanted || p.noOfPlantations || 0;
      // Rough estimate: 1 tree ≈ 22kg CO₂/year
      const co2 = trees * 22 / 1000; // tonnes
      cumulative += co2;
      monthly[key] = { month: key, co2: Math.round(cumulative * 10) / 10, trees: cumulative };
    });
    return Object.values(monthly);
  }, [projects]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    projects.forEach(p => { counts[p.status || 'Pending'] = (counts[p.status || 'Pending'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Projects by location
  const locationData = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const loc = p.location || 'Unknown';
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [projects]);

  // Monthly submissions
  const monthlyData = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([month, submissions]) => ({ month, submissions }));
  }, [projects]);

  // Top NGOs
  const topNGOs = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const ngo = p.ngoId || p.projectName || 'Unknown';
      if (!map[ngo]) map[ngo] = { name: ngo, projects: 0, trees: 0, tokens: 0 };
      map[ngo].projects += 1;
      map[ngo].trees += p.saplingsPlanted || p.noOfPlantations || 0;
      map[ngo].tokens += p.totalTokens || p.saplingsPlanted || 0;
    });
    return Object.values(map).sort((a, b) => b.trees - a.trees).slice(0, 10);
  }, [projects]);

  // Plantation type breakdown
  const plantationData = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const type = p.plantationType || 'Unknown';
      if (!map[type]) map[type] = { type, count: 0, trees: 0 };
      map[type].count += 1;
      map[type].trees += p.saplingsPlanted || p.noOfPlantations || 0;
    });
    return Object.values(map).sort((a, b) => b.trees - a.trees);
  }, [projects]);

  // Summary stats
  const summary = useMemo(() => ({
    totalProjects: projects.length,
    totalTrees: projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0),
    totalCO2: Math.round(projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0) * 22 / 1000, 0) * 10) / 10,
    approvedProjects: projects.filter(p => p.status === 'Approved').length,
    uniqueLocations: new Set(projects.map(p => p.location).filter(Boolean)).size,
    uniqueNGOs: new Set(projects.map(p => p.ngoId).filter(Boolean)).size,
  }), [projects]);

  if (loading) return <div className="analytics-container"><p>Loading analytics...</p></div>;

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>📊 Impact Analytics</h1>
        <p>Comprehensive insights into the Blue Carbon DAO ecosystem</p>
      </header>

      {/* Summary Cards */}
      <section className="analytics-summary-grid">
        <div className="analytics-card accent-green">
          <span className="ac-icon">🌳</span>
          <div>
            <span className="ac-value">{summary.totalTrees.toLocaleString()}</span>
            <span className="ac-label">Trees Planted</span>
          </div>
        </div>
        <div className="analytics-card accent-blue">
          <span className="ac-icon">🌍</span>
          <div>
            <span className="ac-value">{summary.totalCO2.toLocaleString()}</span>
            <span className="ac-label">Tonnes CO₂ Sequestered</span>
          </div>
        </div>
        <div className="analytics-card accent-orange">
          <span className="ac-icon">📋</span>
          <div>
            <span className="ac-value">{summary.totalProjects}</span>
            <span className="ac-label">Total Projects</span>
          </div>
        </div>
        <div className="analytics-card accent-purple">
          <span className="ac-icon">✅</span>
          <div>
            <span className="ac-value">{summary.approvedProjects}</span>
            <span className="ac-label">Verified Projects</span>
          </div>
        </div>
        <div className="analytics-card">
          <span className="ac-icon">📍</span>
          <div>
            <span className="ac-value">{summary.uniqueLocations}</span>
            <span className="ac-label">Locations</span>
          </div>
        </div>
        <div className="analytics-card">
          <span className="ac-icon">🏢</span>
          <div>
            <span className="ac-value">{summary.uniqueNGOs}</span>
            <span className="ac-label">Active NGOs</span>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Carbon Sequestration Over Time */}
        <section className="chart-card full-width">
          <h3>Carbon Sequestration Over Time</h3>
          <p className="chart-subtitle">Cumulative CO₂ sequestered (tonnes) based on trees planted</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sequestrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="month" stroke="#5f6368" />
              <YAxis stroke="#5f6368" />
              <Tooltip formatter={(v) => [`${v} tonnes`, 'CO₂ Sequestered']} />
              <Line type="monotone" dataKey="co2" stroke="#34a853" strokeWidth={3} dot={{ fill: '#34a853', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Project Status Pie */}
        <section className="chart-card">
          <h3>Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Monthly Submissions */}
        <section className="chart-card">
          <h3>Monthly Submissions</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="month" stroke="#5f6368" />
              <YAxis stroke="#5f6368" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="submissions" fill="#1a73e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Projects by Location */}
        <section className="chart-card">
          <h3>Projects by Location</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={locationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis type="number" stroke="#5f6368" allowDecimals={false} />
              <YAxis type="category" dataKey="location" stroke="#5f6368" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#34a853" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Ecosystem Metrics */}
        <section className="chart-card">
          <h3>Ecosystem Breakdown</h3>
          <div className="ecosystem-list">
            {plantationData.map((item, i) => (
              <div key={item.type} className="ecosystem-item">
                <div className="eco-header">
                  <span className="eco-icon">{['🌿', '🌊', '🌱', '🌳', '🍃'][i % 5]}</span>
                  <span className="eco-name">{item.type}</span>
                  <span className="eco-count">{item.count} projects</span>
                </div>
                <div className="eco-bar-wrapper">
                  <div
                    className="eco-bar-fill"
                    style={{
                      width: `${(item.trees / (plantationData[0]?.trees || 1)) * 100}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="eco-trees">{item.trees.toLocaleString()} trees</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Top NGO Leaderboard */}
      <section className="leaderboard-section">
        <h3>🏆 Top Contributors</h3>
        <p className="chart-subtitle">NGOs ranked by total trees planted</p>
        <div className="analytics-leaderboard">
          <div className="alb-header">
            <span>Rank</span><span>NGO / Project</span><span>Projects</span>
            <span>Trees Planted</span><span>Tokens Earned</span>
          </div>
          {topNGOs.map((ngo, i) => (
            <div key={ngo.name} className="alb-row">
              <span className="alb-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span className="alb-name">{ngo.name}</span>
              <span className="alb-projects">{ngo.projects}</span>
              <span className="alb-trees">{ngo.trees.toLocaleString()}</span>
              <span className="alb-tokens">{ngo.tokens.toLocaleString()} BCT</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
