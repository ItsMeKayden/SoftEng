import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-ruler';
import 'leaflet-compass';
import ResultPopup from '../popups/ResultPopup';
import ChatbotPopup from '../popups/ChatbotPopup0';
import SubmissionHistoryPopup from '../popups/SubmissionHistoryPopup';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapEvents = ({ onDoubleClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.on('dblclick', onDoubleClick);

    return () => {
      map.off('dblclick', onDoubleClick);
    };
  }, [map, onDoubleClick]);

  return null;
};

const MapTools = () => {
  const map = useMap();

  useEffect(() => {
    // Remove existing controls if they exist
    map.eachLayer((layer) => {
      if (layer instanceof L.Control) {
        map.removeControl(layer);
      }
    });

    // Add controls
    const zoomControl = L.control.zoom({ position: 'topleft' }).addTo(map);
    const compassControl = L.control
      .compass({
        position: 'bottomleft',
        title: 'Compass',
      })
      .addTo(map);
    const rulerControl = L.control
      .ruler({
        position: 'topleft',
        lengthUnit: { display: 'km', decimal: 2 },
      })
      .addTo(map);

    return () => {
      map.removeControl(zoomControl);
      map.removeControl(compassControl);
      map.removeControl(rulerControl);
    };
  }, [map]);

  return null;
};

const MapComponent = ({
  searchLocation,
  selectedBasemap = 'Satellite Imagery',
  onLocate,
}) => {
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]); // Add this line to track multiple markers
  const [markerPosition, setMarkerPosition] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocationState, setSelectedLocationState] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSeeResult, setShowSeeResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showChatbotPopup, setShowChatbotPopup] = useState(false);
  const [showSubmissionHistoryPopup, setShowSubmissionHistoryPopup] =
    useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [selectedHazards, setSelectedHazards] = useState([
    'Flooding',
    'Rainfall',
    'Heat Index',
  ]); // Add default hazards

  const handleLocationSelect = (marker) => {
    setShowInstructions(false);
    setShowSeeResult(true);
    setSelectedLocationState(marker.locationName); // Store the selected location name

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowSeeResult(false);
          setShowResultPopup(true);
        }, 500);
      }
    }, 200);
  };

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = [latitude, longitude];

          // Fetch location name using the existing getLocationName function
          const locationName = await getLocationName(latitude, longitude);

          // Set current location with name
          setMarkerPosition({
            position: location,
            locationName: locationName,
          });

          if (mapRef.current) {
            mapRef.current.flyTo(location, 17);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your current location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  }, []);
  useEffect(() => {
    if (onLocate) {
      handleLocate();
    }
  }, [onLocate, handleLocate]);

  useEffect(() => {
    if (searchLocation && mapRef.current) {
      const map = mapRef.current;
      map.flyTo(searchLocation, 17);
    }
  }, [searchLocation]);

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  const handleMapDoubleClick = async (e) => {
    const locationName = await getLocationName(e.latlng.lat, e.latlng.lng);
    const newMarker = {
      position: [e.latlng.lat, e.latlng.lng],
      id: Date.now(),
      locationName: locationName,
    };
    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
    setShowInstructions(false);
  };

  const baseLayers = {
    Streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
    },
    'Satellite Imagery': {
      // Imagery only
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      subdomains: [],
    },
    Terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution:
        'Map data: &copy; <a href="https://www.opentopomap.org">OpenTopoMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
    },
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    >
      <MapContainer
        center={[12.8797, 121.774]}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        doubleClickZoom={false}
      >
        <TileLayer
          url={baseLayers[selectedBasemap].url}
          attribution={baseLayers[selectedBasemap].attribution}
          subdomains={baseLayers[selectedBasemap].subdomains}
        />
        {selectedBasemap === 'Satellite Imagery' && (
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution="Labels &copy; Esri"
            pane="overlayPane"
          />
        )}
        {showSeeResult && (
          <div className="processing-popup-overlay">
            <div className="processing-popup">
              <div className="processing-content">
                <div className="processing-message">
                  Processing Hazard Assessment, Please wait...
                </div>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showResultPopup && (
          <ResultPopup
            selectedLocation={selectedLocationState}
            selectedHazards={selectedHazards}
            showChatbotPopup={showChatbotPopup}
            setShowChatbotPopup={setShowChatbotPopup}
            setShowResultPopup={setShowResultPopup}
            darkMode={false}
            onClose={() => {
              setShowResultPopup(false);
              setProgress(0);
            }}
          />
        )}
        {showChatbotPopup && (
          <ChatbotPopup
            onClose={() => setShowChatbotPopup(false)}
            showResultPopup={showResultPopup}
            setShowResultPopup={setShowResultPopup}
            setShowChatbotPopup={setShowChatbotPopup}
            selectedHazards={selectedHazards}
          />
        )}
        {showSubmissionHistoryPopup && (
          <SubmissionHistoryPopup
            onClose={() => setShowSubmissionHistoryPopup(false)}
            showProfilePopup={showProfilePopup}
            setShowProfilePopup={setShowProfilePopup}
            setShowSubmissionHistoryPopup={setShowSubmissionHistoryPopup}
            setShowResultPopup={setShowResultPopup}
            selectedHazards={selectedHazards}
            selectedLocation={selectedLocationState}
          />
        )}
        <MapEvents onDoubleClick={handleMapDoubleClick} />
        <MapTools />
        {/* Render all markers */}
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {marker.locationName}
                </h3>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Coordinates:</strong>
                  <br />
                  Lat: {marker.position[0].toFixed(4)}
                  <br />
                  Long: {marker.position[1].toFixed(4)}
                </div>
                <button
                  onClick={() => handleLocationSelect(marker)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#41AB5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  Select Location
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Render the current location marker */}
        {markerPosition && (
          <Marker
            position={markerPosition.position}
            icon={
              new L.Icon({
                iconUrl:
                  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })
            }
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {markerPosition.locationName}
                </h3>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Coordinates:</strong>
                  <br />
                  Lat: {markerPosition.position[0].toFixed(4)}
                  <br />
                  Long: {markerPosition.position[1].toFixed(4)}
                </div>
                <button
                  onClick={() =>
                    handleLocationSelect({
                      position: markerPosition.position,
                      locationName: markerPosition.locationName,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#41AB5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  Select Location
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: '1000',
          padding: '8px 12px',
          background: '#41AB5D',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          fontSize: '14px',
        }}
      >
        {selectedBasemap}
      </div>

      {showInstructions && (
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '1000',
            padding: '12px 24px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '16px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            maxWidth: '90%',
            animationName: 'fadeInUp',
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ flex: 1 }}>
            Double-Click/tap a location to start the assessment
          </span>
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              marginLeft: '8px',
            }}
            aria-label="Close instructions"
          >
            ✕
          </button>
        </div>
      )}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translate(-50%, 20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default MapComponent;
