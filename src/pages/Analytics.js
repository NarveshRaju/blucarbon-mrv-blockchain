import React, { useState, useEffect, useMemo } from 'react';
import {
  Trees,
  Globe,
  FileText,
  CheckCircle2,
  MapPin,
  Building2
} from 'lucide-react';
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

    let cumulativeTrees = 0;
    const monthlyMap = {};

    sorted.forEach(p => {
      const date = new Date(p.createdAt);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      cumulativeTrees += (p.saplingsPlanted || p.noOfPlantations || 0);
      // Rough conversion: 1 tree absorbs ~21.77 kg CO2/year = ~0.02177 tonnes
      const cumulativeCO2 = Math.round(cumulativeTrees * 0.022 * 10) / 10;
      monthlyMap[key] = cumulativeCO2;
    });

    return Object.entries(monthlyMap).map(([month, co2]) => ({ month, co2 }));
  }, [projects]);

  // Project status distribution
  const statusData = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    projects.forEach(p => {
      const s = p.status || 'Pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Projects by plantation/ecosystem type
  const plantationData = useMemo(() => {
    const types = {};
    projects.forEach(p => {
      const t = p.plantationType || 'Unknown';
      if (!types[t]) types[t] = { count: 0, trees: 0 };
      types[t].count += 1;
      types[t].trees += (p.saplingsPlanted || p.noOfPlantations || 0);
    });
    return Object.entries(types).map(([type, data]) => ({
      type,
      count: data.count,
      trees: data.trees,
    }));
  }, [projects]);

  // Monthly submissions
  const monthlyData = useMemo(() => {
    const months = {};
    projects.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([month, submissions]) => ({ month, submissions }));
  }, [projects]);

  // Projects by location (top 5)
  const locationData = useMemo(() => {
    const locs = {};
    projects.forEach(p => {
      const l = p.location || 'Unknown';
      locs[l] = (locs[l] || 0) + 1;
    });
    return Object.entries(locs)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [projects]);

  // Top NGOs by trees planted
  const topNGOs = useMemo(() => {
    const ngos = {};
    projects.forEach(p => {
      const name = p.projectName || p.ngoName || p.ngoId || 'Unknown NGO';
      if (!ngos[name]) ngos[name] = { trees: 0, projects: 0, tokens: 0 };
      ngos[name].trees += (p.saplingsPlanted || p.noOfPlantations || 0);
      ngos[name].projects += 1;
      if (p.status === 'Approved') {
        ngos[name].tokens += (p.totalTokens || p.saplingsPlanted || p.noOfPlantations || 0);
      }
    });
    return Object.entries(ngos)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.trees - a.trees)
      .slice(0, 5);
  }, [projects]);

  // Summary stats
  const summary = useMemo(() => ({
    totalProjects: projects.length,
    totalTrees: projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0),
    totalCO2: Math.round(projects.reduce((s, p) => s + (p.saplingsPlanted || p.noOfPlantations || 0), 0) * 0.022),
    approvedProjects: projects.filter(p => p.status === 'Approved').length,
    uniqueLocations: new Set(projects.map(p => p.location).filter(Boolean)).size,
    uniqueNGOs: new Set(projects.map(p => p.ngoId).filter(Boolean)).size,
  }), [projects]);

  if (loading) return <div className="analytics-container"><p>Loading analytics...</p></div>;

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Impact Analytics</h1>
        <p>Comprehensive insights into the Blue Carbon DAO ecosystem</p>
      </header>

      {/* Summary Cards */}
      <section className="analytics-summary-grid">
        <div className="analytics-card accent-green">
          <span className="ac-icon"><Trees size={22} /></span>
          <div>
            <span className="ac-value">{summary.totalTrees.toLocaleString()}</span>
            <span className="ac-label">Trees Planted</span>
          </div>
        </div>
        <div className="analytics-card accent-blue">
          <span className="ac-icon"><Globe size={22} /></span>
          <div>
            <span className="ac-value">{summary.totalCO2.toLocaleString()}</span>
            <span className="ac-label">Tonnes CO₂ Sequestered</span>
          </div>
        </div>
        <div className="analytics-card accent-orange">
          <span className="ac-icon"><FileText size={22} /></span>
          <div>
            <span className="ac-value">{summary.totalProjects}</span>
            <span className="ac-label">Total Projects</span>
          </div>
        </div>
        <div className="analytics-card accent-purple">
          <span className="ac-icon"><CheckCircle2 size={22} /></span>
          <div>
            <span className="ac-value">{summary.approvedProjects}</span>
            <span className="ac-label">Verified Projects</span>
          </div>
        </div>
        <div className="analytics-card">
          <span className="ac-icon"><MapPin size={22} /></span>
          <div>
            <span className="ac-value">{summary.uniqueLocations}</span>
            <span className="ac-label">Locations</span>
          </div>
        </div>
        <div className="analytics-card">
          <span className="ac-icon"><Building2 size={22} /></span>
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
        <h3>Top Contributors</h3>
        <p className="chart-subtitle">NGOs ranked by total trees planted</p>
        <div className="analytics-leaderboard">
          <div className="alb-header">
            <span>Rank</span><span>NGO / Project</span><span>Projects</span>
            <span>Trees Planted</span><span>Tokens Earned</span>
          </div>
          {topNGOs.map((ngo, i) => (
            <div key={ngo.name} className="alb-row">
              <span className="alb-rank">
                #{i + 1}
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
