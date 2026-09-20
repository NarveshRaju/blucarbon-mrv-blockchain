import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  isValidCoordinate,
  formatCoordinate,
  formatRadius,
  estimateZoneAreaHectares,
  DEFAULT_MAP_CENTER,
  DEFAULT_ANALYSIS_RADIUS_METERS,
  MIN_ANALYSIS_RADIUS,
  MAX_ANALYSIS_RADIUS
} from '../utils/geoUtils';
import { MapPin, Navigation, Info, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import './LocationPicker.css';

// Fix Leaflet default marker icons for React builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map click event listener to capture coordinates from map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
    },
  });
  return null;
};

// Map view pan controller
const MapPanController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom() < 12 ? 13 : map.getZoom());
    }
  }, [center, map]);
  return null;
};

/**
 * Reusable Interactive Location Picker and Analysis Zone Configuration Component.
 *
 * @param {object} props
 * @param {number|string} props.latitude - Selected latitude
 * @param {number|string} props.longitude - Selected longitude
 * @param {Function} props.onChange - Called with (latitude, longitude)
 * @param {number} [props.radiusMeters=500] - Analysis zone buffer radius in meters
 * @param {Function} [props.onRadiusChange] - Called with updated radius in meters
 * @param {string} [props.className]
 */
const LocationPicker = ({
  latitude,
  longitude,
  onChange,
  onLocationChange,
  onLocationSelect,
  radiusMeters = DEFAULT_ANALYSIS_RADIUS_METERS,
  onRadiusChange,
  className = '',
}) => {
  const [geoError, setGeoError] = useState('');
  const [manualLatError, setManualLatError] = useState('');
  const [manualLngError, setManualLngError] = useState('');

  // Safe multi-callback trigger
  const notifyLocationChange = (newLat, newLng) => {
    if (typeof onChange === 'function') {
      onChange(newLat, newLng);
    }
    if (typeof onLocationChange === 'function') {
      onLocationChange(newLat, newLng);
    }
    if (typeof onLocationSelect === 'function') {
      onLocationSelect(newLat, newLng);
    }
  };

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = isValidCoordinate(lat, lng);

  const radius = parseInt(radiusMeters, 10) || DEFAULT_ANALYSIS_RADIUS_METERS;
  const estimatedHectares = useMemo(() => estimateZoneAreaHectares(radius), [radius]);

  const mapCenter = useMemo(() => {
    if (hasValidCoords) return [lat, lng];
    return DEFAULT_MAP_CENTER;
  }, [hasValidCoords, lat, lng]);

  const handleManualLatChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setManualLatError('');
      notifyLocationChange('', longitude);
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < -90 || num > 90) {
      setManualLatError('Latitude must be between -90 and 90');
    } else {
      setManualLatError('');
    }
    notifyLocationChange(val === '' ? '' : num, longitude);
  };

  const handleManualLngChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setManualLngError('');
      notifyLocationChange(latitude, '');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < -180 || num > 180) {
      setManualLngError('Longitude must be between -180 and 180');
    } else {
      setManualLngError('');
    }
    notifyLocationChange(latitude, val === '' ? '' : num);
  };

  const handleRadiusSlider = (e) => {
    const val = parseInt(e.target.value, 10);
    if (typeof onRadiusChange === 'function' && !isNaN(val)) {
      onRadiusChange(val);
    }
  };

  const handleRadiusInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (typeof onRadiusChange === 'function') {
      if (isNaN(val)) {
        onRadiusChange(MIN_ANALYSIS_RADIUS);
      } else {
        const clamped = Math.max(MIN_ANALYSIS_RADIUS, Math.min(MAX_ANALYSIS_RADIUS, val));
        onRadiusChange(clamped);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = parseFloat(pos.coords.latitude.toFixed(6));
        const userLng = parseFloat(pos.coords.longitude.toFixed(6));
        notifyLocationChange(userLat, userLng);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setGeoError('Unable to retrieve current location. Please select on map.');
      }
    );
  };

  return (
    <div className={`location-picker-container ${className}`}>
      {/* Top Map Control Bar */}
      <div className="lp-header-bar">
        <div className="lp-hint">
          <MapPin size={16} className="text-primary" />
          <span>Click anywhere on the map or enter coordinates to place the project reference marker.</span>
        </div>
        <button
          type="button"
          className="lp-geolocate-btn"
          onClick={handleUseCurrentLocation}
          title="Use current GPS location"
        >
          <Navigation size={14} /> My Location
        </button>
      </div>

      {geoError && (
        <div className="lp-geo-error">
          <AlertCircle size={14} />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map View */}
      <div className="lp-map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={hasValidCoords ? 13 : 6}
          scrollWheelZoom={true}
          className="lp-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={(newLat, newLng) => notifyLocationChange(newLat, newLng)} />
          {hasValidCoords && <MapPanController center={[lat, lng]} />}

          {hasValidCoords && (
            <>
              {/* Center Reference Marker */}
              <Marker position={[lat, lng]} />

              {/* Dynamic Circular Analysis Zone Buffer */}
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: '#0e9aa7',
                  fillColor: '#0e9aa7',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '6, 6',
                }}
              />
            </>
          )}
        </MapContainer>

        {/* Selected Coordinates Overlay Badge */}
        {hasValidCoords && (
          <div className="lp-map-status-overlay">
            <CheckCircle2 size={14} className="text-success" />
            <span>
              {formatCoordinate(lat, 'lat')} • {formatCoordinate(lng, 'lng')}
            </span>
          </div>
        )}
      </div>

      {/* Coordinate Manual Inputs & Validation */}
      <div className="lp-coordinates-section">
        <div className="lp-inputs-grid">
          <div className="lp-input-group">
            <label htmlFor="lp-lat-input">
              Latitude <span className="req-star">*</span>
            </label>
            <input
              id="lp-lat-input"
              type="number"
              step="any"
              min="-90"
              max="90"
              placeholder="e.g. 19.076000"
              value={latitude !== undefined && latitude !== null ? latitude : ''}
              onChange={handleManualLatChange}
              className={`bc-input ${manualLatError ? 'bc-input--error' : ''}`}
            />
            {manualLatError ? (
              <span className="lp-field-error">{manualLatError}</span>
            ) : (
              <span className="lp-field-hint">Range: -90.0 to +90.0</span>
            )}
          </div>

          <div className="lp-input-group">
            <label htmlFor="lp-lng-input">
              Longitude <span className="req-star">*</span>
            </label>
            <input
              id="lp-lng-input"
              type="number"
              step="any"
              min="-180"
              max="180"
              placeholder="e.g. 72.877700"
              value={longitude !== undefined && longitude !== null ? longitude : ''}
              onChange={handleManualLngChange}
              className={`bc-input ${manualLngError ? 'bc-input--error' : ''}`}
            />
            {manualLngError ? (
              <span className="lp-field-error">{manualLngError}</span>
            ) : (
              <span className="lp-field-hint">Range: -180.0 to +180.0</span>
            )}
          </div>

          {/* Analysis Radius Setting */}
          {onRadiusChange && (
            <div className="lp-input-group">
              <label htmlFor="lp-radius-input">
                Analysis Radius (Meters)
              </label>
              <div className="lp-radius-input-wrap">
                <input
                  id="lp-radius-input"
                  type="number"
                  min={MIN_ANALYSIS_RADIUS}
                  max={MAX_ANALYSIS_RADIUS}
                  step="50"
                  value={radius}
                  onChange={handleRadiusInput}
                  className="bc-input"
                />
                <span className="lp-radius-unit">meters</span>
              </div>
              <span className="lp-field-hint">Approx. {estimatedHectares} hectares area</span>
            </div>
          )}
        </div>

        {/* Radius Slider Control */}
        {onRadiusChange && (
          <div className="lp-radius-slider-box">
            <div className="lp-slider-header">
              <span className="lp-slider-title">
                <Sliders size={14} /> Adjust Analysis Zone Radius
              </span>
              <span className="lp-slider-value">
                <strong>{formatRadius(radius)}</strong> ({radius} meters)
              </span>
            </div>
            <input
              type="range"
              min={MIN_ANALYSIS_RADIUS}
              max={MAX_ANALYSIS_RADIUS}
              step="50"
              value={radius}
              onChange={handleRadiusSlider}
              className="lp-slider-control"
            />
            <div className="lp-slider-ticks">
              <span>100m</span>
              <span>1 km</span>
              <span>2.5 km</span>
              <span>5 km</span>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Zone Academic / Methodology Notice */}
      <div className="lp-academic-notice">
        <Info size={16} />
        <div>
          <strong>Initial Analysis Zone:</strong>
          <p>
            The selected location acts as a reference point. The analysis zone represents an approximate monitoring area (~{estimatedHectares} ha) generated around that point and will be used for future satellite-based MRV vegetation analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
