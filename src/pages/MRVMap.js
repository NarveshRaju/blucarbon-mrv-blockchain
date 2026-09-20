import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import apiClient from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Satellite, MapPin, Leaf, TreePine, 
  CheckCircle2, XCircle, Clock, ShieldCheck, 
  BarChart2, Globe2 
} from 'lucide-react';
import './MRVMap.css';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Simulated coordinates for known locations
const LOCATION_COORDS = {
  'sundarbans': [21.9497, 89.1833],
  'bangladesh': [21.9497, 89.1833],
  'great barrier reef': [-18.2871, 147.6992],
  'australia': [-25.2744, 133.7751],
  'balearic islands': [39.5696, 2.6502],
  'spain': [40.4168, -3.7038],
  'mumbai': [19.0760, 72.8777],
  'india': [20.5937, 78.9629],
  'kerala': [10.8505, 76.2711],
  'goa': [15.2993, 74.1240],
  'chennai': [13.0827, 80.2707],
  'madagascar': [-18.7669, 46.8691],
  'indonesia': [-0.7893, 113.9213],
  'philippines': [12.8797, 121.7740],
  'vietnam': [14.0583, 108.2772],
  'kenya': [-1.2864, 36.8172],
  'brazil': [-14.2350, -51.9253],
  'florida': [27.6648, -81.5158],
  'mexico': [23.6345, -102.5528],
  'thailand': [15.8700, 100.9925],
  'malaysia': [4.2105, 101.9758],
  'mangrove': [10.0, 78.0],
  'seagrass': [5.0, 100.0],
};

const getCoordinates = (location) => {
  if (!location) return [20.0, 78.0];
  const loc = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (loc.includes(key)) return coords;
  }
  const hash = loc.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return [10 + (hash % 40) - 10, 70 + (hash % 80)];
};

const STATUS_COLORS = {
  approved: '#34a853',
  pending: '#fbbc05',
  rejected: '#ea4335',
};

const getVerificationScore = (project) => {
  let score = 0;
  if (project.projectName) score += 15;
  if (project.description) score += 10;
  if (project.location) score += 15;
  if (project.plantationType) score += 10;
  if (project.saplingsPlanted && project.saplingsPlanted > 0) score += 15;
  if (project.walletAddress) score += 10;
  if (project.ngoId) score += 10;
  if (project.status === 'Approved') score += 15;
  return Math.min(score, 100);
};

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2010;

// Generate ambient background data for global mangroves to visualize overall ecosystem changes
const AMBIENT_MANGROVES = Array.from({ length: 150 }).map((_, i) => {
  // Rough bounding boxes for global mangroves
  const regions = [
    { lat: [15, 22], lng: [70, 74] }, // West India (Maharashtra, Gujarat)
    { lat: [10, 22], lng: [72, 89] }, // Rest of India/Bangladesh
    { lat: [-10, 10], lng: [95, 140] }, // SE Asia / Indonesia
    { lat: [-25, -10], lng: [110, 150] }, // Australia
    { lat: [-10, 5], lng: [-50, -35] }, // Brazil
    { lat: [15, 30], lng: [-105, -80] }, // Central America / Florida
    { lat: [-15, 5], lng: [35, 50] }, // East Africa / Madagascar
  ];
  const r = regions[i % regions.length];
  const lat = r.lat[0] + Math.random() * (r.lat[1] - r.lat[0]);
  const lng = r.lng[0] + Math.random() * (r.lng[1] - r.lng[0]);
  const startYear = START_YEAR + Math.floor(Math.random() * (CURRENT_YEAR - START_YEAR + 1));
  return { id: `ambient-${i}`, coordinates: [lat, lng], startYear };
});

const MRVMap = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNDVI, setShowNDVI] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  // Timeline State
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    apiClient.get('/projects-for-sale')
      .then(res => {
        const withCoords = res.data.map(p => {
          // Spread projects evenly across the entire 2010-2024 timeline based on their name hash
          const hash = p.projectName ? p.projectName.charCodeAt(0) + p.projectName.length : Math.floor(Math.random() * 100);
          const simulatedStartYear = START_YEAR + (hash % (CURRENT_YEAR - START_YEAR + 1));
          
          return {
            ...p,
            coordinates: getCoordinates(p.location),
            verificationScore: getVerificationScore(p),
            simulatedStartYear
          };
        });
        setProjects(withCoords);
      })
      .catch(err => console.error('Failed to fetch projects:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status?.toLowerCase() === statusFilter);
    }
    
    // Filter out projects that haven't started yet in the timeline
    return result.filter(p => p.simulatedStartYear <= selectedYear);
  }, [projects, statusFilter, selectedYear]);

  // Calculate simulated growth
  const getGrowthFactor = useCallback((project) => {
    const yearsActive = selectedYear - project.simulatedStartYear;
    const maxYears = CURRENT_YEAR - project.simulatedStartYear;
    if (maxYears <= 0) return 1; // Fallback
    
    // Growth from 0.1 to 1.0 based on how many years have passed
    return Math.min(1, Math.max(0.1, (yearsActive + 1) / (maxYears + 1)));
  }, [selectedYear]);

  const stats = useMemo(() => {
    let totalTreesSimulated = 0;
    
    filteredProjects.forEach(p => {
      const actualTrees = p.saplingsPlanted || p.noOfPlantations || 0;
      const growth = getGrowthFactor(p);
      totalTreesSimulated += Math.floor(actualTrees * growth);
    });

    return {
      total: filteredProjects.length,
      approved: filteredProjects.filter(p => p.status === 'Approved').length,
      totalTrees: totalTreesSimulated,
      avgScore: filteredProjects.length > 0
        ? Math.round(filteredProjects.reduce((s, p) => s + p.verificationScore, 0) / filteredProjects.length)
        : 0,
    };
  }, [filteredProjects, getGrowthFactor]);

  if (loading) return <div className="mrv-container"><div className="loading-spinner"><Satellite className="spin" size={48} /> <p>Loading MRV data...</p></div></div>;

  return (
    <div className="mrv-container">
      <header className="mrv-header">
        <div>
          <h1><Satellite size={32} className="header-icon" /> MRV Satellite Map</h1>
          <p>Geospatial verification of blue carbon projects worldwide</p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="mrv-stats-bar">
        <div className="mrv-stat">
          <Globe2 size={24} className="stat-icon" />
          <div className="stat-info">
            <span className="mrv-stat-value">{stats.total}</span>
            <span>Projects</span>
          </div>
        </div>
        <div className="mrv-stat">
          <ShieldCheck size={24} className="stat-icon approved-icon" />
          <div className="stat-info">
            <span className="mrv-stat-value">{stats.approved}</span>
            <span>Verified</span>
          </div>
        </div>
        <div className="mrv-stat">
          <TreePine size={24} className="stat-icon trees-icon" />
          <div className="stat-info">
            <span className="mrv-stat-value">{stats.totalTrees.toLocaleString()}</span>
            <span>Est. Trees Grown</span>
          </div>
        </div>
        <div className="mrv-stat">
          <BarChart2 size={24} className="stat-icon score-icon" />
          <div className="stat-info">
            <span className="mrv-stat-value">{stats.avgScore}%</span>
            <span>Avg Score</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mrv-controls">
        <div className="mrv-filters">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mrv-select">
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="mrv-toggles">
          <label className="mrv-toggle">
            <input type="checkbox" checked={showNDVI} onChange={e => setShowNDVI(e.target.checked)} />
            <span><Leaf size={16} /> NDVI Overlay</span>
          </label>
          <label className="mrv-toggle">
            <input type="checkbox" checked={showVerification} onChange={e => setShowVerification(e.target.checked)} />
            <span><BarChart2 size={16} /> Verification Scores</span>
          </label>
        </div>
      </div>

      {/* Map Area */}
      <div className="map-wrapper">
        <MapContainer center={[15, 78]} zoom={3} className="leaflet-map" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ambient Global Mangroves (Background ecosystem) */}
          {AMBIENT_MANGROVES.filter(m => m.startYear <= selectedYear).map(m => {
            const yearsActive = selectedYear - m.startYear;
            const maxYears = CURRENT_YEAR - m.startYear;
            const growth = maxYears <= 0 ? 1 : Math.min(1, Math.max(0.1, (yearsActive + 1) / (maxYears + 1)));
            const radius = 2 + (4 * growth);
            return (
              <CircleMarker
                key={m.id}
                center={m.coordinates}
                radius={radius}
                pathOptions={{
                  color: '#1e8e3e',
                  fillColor: '#34a853',
                  fillOpacity: 0.15 + (0.35 * growth),
                  weight: 0.5,
                }}
              />
            );
          })}

          {/* NDVI Overlay - simulated vegetation areas with historical growth */}
          {showNDVI && filteredProjects.map(project => {
            const growth = getGrowthFactor(project);
            const radius = Math.max(10, 30 * growth);
            const opacity = Math.max(0.05, 0.25 * growth);

            return (
              <CircleMarker
                key={`ndvi-${project.projectId}`}
                center={project.coordinates}
                radius={radius}
                pathOptions={{
                  color: '#22c55e',
                  fillColor: '#22c55e',
                  fillOpacity: opacity,
                  weight: 1,
                }}
              />
            );
          })}

          {/* Project Markers */}
          {filteredProjects.map(project => {
            const status = project.status?.toLowerCase() || 'pending';
            const color = STATUS_COLORS[status] || '#fbbc05';
            const growth = getGrowthFactor(project);

            return (
              <CircleMarker
                key={project.projectId}
                center={project.coordinates}
                radius={4 + (8 * growth)}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.4 + (0.5 * growth),
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setSelectedProject(project),
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>{project.projectName || 'Unnamed Project'}</h4>
                    <p className="popup-ngo">{project.ngoId || 'Unknown NGO'}</p>
                    <p className="icon-text"><MapPin size={14} /> {project.location}</p>
                    <p className="icon-text"><TreePine size={14} /> {Math.floor((project.saplingsPlanted || project.noOfPlantations || 0) * getGrowthFactor(project)).toLocaleString()} trees</p>
                    <span className={`popup-status ${status}`}>{project.status || 'Pending'}</span>
                    
                    {showVerification && (
                      <div className="popup-score">
                        <span>Verification: {project.verificationScore}%</span>
                        <div className="popup-score-bar">
                          <div style={{ width: `${project.verificationScore}%`, background: project.verificationScore > 70 ? '#34a853' : project.verificationScore > 40 ? '#fbbc05' : '#ea4335' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Timeline Slider */}
        <div className="timeline-slider-container">
          <div className="timeline-header">
            <Clock size={16} />
            <span>Historical Timeline: <strong>{selectedYear}</strong></span>
          </div>
          <div className="slider-wrapper">
            <span>{START_YEAR}</span>
            <input 
              type="range" 
              min={START_YEAR} 
              max={CURRENT_YEAR} 
              step="1" 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-slider"
            />
            <span>{CURRENT_YEAR}</span>
          </div>
          <p className="timeline-hint">Drag to see simulated growth of projects over time</p>
        </div>

        {/* NDVI Legend */}
        {showNDVI && (
          <div className="ndvi-legend">
            <h4><Leaf size={16}/> Vegetation Index (NDVI)</h4>
            <div className="ndvi-gradient" />
            <div className="ndvi-labels">
              <span>Low</span><span>Medium</span><span>High</span>
            </div>
          </div>
        )}

        {/* Status Legend */}
        <div className="status-legend">
          <h4>Project Status</h4>
          <div className="legend-items">
            <div><span className="legend-dot" style={{ background: '#34a853' }} /> Approved</div>
            <div><span className="legend-dot" style={{ background: '#fbbc05' }} /> Pending</div>
            <div><span className="legend-dot" style={{ background: '#ea4335' }} /> Rejected</div>
          </div>
        </div>
      </div>

      {/* Selected Project Detail Panel */}
      {selectedProject && (
        <div className="project-detail-panel">
          <button className="close-panel" onClick={() => setSelectedProject(null)}><XCircle size={24} /></button>
          <h3>{selectedProject.projectName || 'Unnamed Project'}</h3>
          <span className={`detail-status ${selectedProject.status?.toLowerCase()}`}>
            {selectedProject.status}
          </span>

          <div className="panel-grid">
            <div><span><MapPin size={16} /> Location</span><strong>{selectedProject.location}</strong></div>
            <div><span><Leaf size={16} /> Type</span><strong>{selectedProject.plantationType}</strong></div>
            <div><span><TreePine size={16} /> Est. Trees ({selectedYear})</span><strong>{Math.floor((selectedProject.saplingsPlanted || selectedProject.noOfPlantations || 0) * getGrowthFactor(selectedProject)).toLocaleString()}</strong></div>
            <div><span><Clock size={16} /> Started</span><strong>{selectedProject.simulatedStartYear}</strong></div>
          </div>

          <div className="verification-score-panel">
            <h4><ShieldCheck size={16} /> Automated Verification</h4>
            <div className="score-circle">
              <span className="score-value">{selectedProject.verificationScore}%</span>
            </div>
            <div className="score-breakdown">
              <div className={`score-item ${selectedProject.projectName ? 'pass' : 'fail'}`}>
                {selectedProject.projectName ? <CheckCircle2 size={16} /> : <XCircle size={16} />} Project Name
              </div>
              <div className={`score-item ${selectedProject.location ? 'pass' : 'fail'}`}>
                {selectedProject.location ? <CheckCircle2 size={16} /> : <XCircle size={16} />} Location Data
              </div>
              <div className={`score-item ${selectedProject.saplingsPlanted > 0 ? 'pass' : 'fail'}`}>
                {selectedProject.saplingsPlanted > 0 ? <CheckCircle2 size={16} /> : <XCircle size={16} />} Plantation Data
              </div>
              <div className={`score-item ${selectedProject.walletAddress ? 'pass' : 'fail'}`}>
                {selectedProject.walletAddress ? <CheckCircle2 size={16} /> : <XCircle size={16} />} Wallet Linked
              </div>
              <div className={`score-item ${selectedProject.status === 'Approved' ? 'pass' : 'fail'}`}>
                {selectedProject.status === 'Approved' ? <CheckCircle2 size={16} /> : <Clock size={16} />} DAO Verification
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRVMap;
