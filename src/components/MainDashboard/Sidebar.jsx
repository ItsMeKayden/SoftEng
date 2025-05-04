import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import ChatbotPopup from '../popups/ChatbotPopup0';
import ProfilePopup from '../popups/ProfilePopup';
import ResultPopup from '../popups/ResultPopup';
import SubmissionHistoryPopup from '../popups/SubmissionHistoryPopup';
import SearchBar from './SearchBar';
import { useTheme } from '../../context/ThemeContext';

const allHazards = ['Flooding', 'Rainfall', 'Heat Index'];
const Sidebar = ({
  onSearch,
  onLocate,
  onClearSearch,
  updateSidebarState,
  onBasemapChange,
  selectedBasemap,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReferenceMapDropdown, setShowReferenceMapDropdown] =
    useState(false);
  const [showHazardsDropdown, setShowHazardsDropdown] = useState(false);
  const [selectedHazards, setSelectedHazards] = useState([...allHazards]); // Initialize with all hazards selected
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showSubmissionHistoryPopup, setShowSubmissionHistoryPopup] =
    useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showChatbotPopup, setShowChatbotPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('myProfile');
  const [showSeeResult, setShowSeeResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profileButtonLabel, setProfileButtonLabel] = useState('Profile'); // Default label
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme(); // Get theme from context
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state to track login status

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setIsLoggedIn(!!storedUser); // Set login status based on whether user data exists
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Assuming your user object has 'username' or you want to extract it from 'email'
        setProfileButtonLabel(user.username || user.email.split('@')[0]);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    } else {
      setProfileButtonLabel('Profile'); // Revert to default if no user is logged in
    }
  }, []); // Empty dependency array ensures this runs only once after the initial render

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleCurrentLocationClick = () => {
    if (onLocate) {
      onLocate(); // Trigger the function passed from MapComponent
    }
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
    setShowProfileDropdown(false);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleLogout = () => {
    setShowLogoutPopup(true); // Show confirmation popup
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false); // Update login status on logout
    setProfileButtonLabel('Profile');
    setShowLogoutPopup(false);
    setShowLogoutSuccess(true);

    setTimeout(() => {
      setShowLogoutSuccess(false);
      navigate('/'); // Go to login/home after popup disappears
    }, 2000);
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    updateSidebarState(!isCollapsed);
  };

  const toggleReferenceMapDropdown = () => {
    setShowReferenceMapDropdown(!showReferenceMapDropdown);
    setShowHazardsDropdown(false);
  };

  // Modified reference map handler
  const handleReferenceMapSelect = (option) => {
    onBasemapChange(option); // Notify parent component
    setShowReferenceMapDropdown(true);
  };

  const toggleHazardsDropdown = () => {
    setShowHazardsDropdown(!showHazardsDropdown);
    setShowReferenceMapDropdown(false);
  };

  const handleHazardSelect = (hazardName) => {
    setSelectedHazards((prev) => {
      // Toggle the hazard on or off
      const updatedHazards = prev.includes(hazardName)
        ? prev.filter((h) => h !== hazardName)
        : [...prev, hazardName];

      // Sort the hazards back to the predefined order
      return allHazards.filter((hazard) => updatedHazards.includes(hazard));
    });
  };

  const handleChatbotClick = () => {
    if (isLoggedIn) {
      setShowChatbotPopup(true);
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isDarkMode ? 'dark-theme' : ''
        }`}
      >
        <header className="sidebar-header">
          <div
            className={`sidebar-logo-container ${
              isCollapsed ? 'collapsed' : ''
            }`}
          >
            <img
              src="/icons/logo.png"
              alt="AI-Driven GIS Logo"
              className="sidebar-logo"
            />
            {!isCollapsed && <span className="sidebar-title">EcoUrban</span>}
          </div>
        </header>
        <ul>
          {/* Location Tools Section */}
          {!isCollapsed && (
            <h3 className="sidebar-section-label">LOCATION TOOLS</h3>
          )}

          {/* Search Bar */}
          <SearchBar
            onSearch={(location) => {
              onSearch(location);
              handleLocationChange(location); // Add this line
            }}
            onClearSearch={onClearSearch}
            isCollapsed={isCollapsed}
          />

          {/* Current Location */}
          <li
            onClick={handleCurrentLocationClick}
            data-tooltip="Current Location"
          >
            <img src="/icons/currentloc.png" alt="Location" />
            {!isCollapsed && <span>Current Location</span>}
          </li>

          {/* Display Options Section */}
          {!isCollapsed && (
            <h3 className="sidebar-section-label">DISPLAY OPTIONS</h3>
          )}

          {/* Updated Reference Map Dropdown */}
          <li
            className="dropdown-item"
            onClick={toggleReferenceMapDropdown}
            data-tooltip="Basemaps"
          >
            <img src="/icons/basemap.png" alt="Map" />
            {!isCollapsed && <span>Basemaps</span>}
            {!isCollapsed && (
              <img
                src="/icons/dropdown0.png"
                alt="Expand"
                className={`dropdown-arrow ${
                  showReferenceMapDropdown ? 'rotate' : ''
                }`}
                style={{ width: '14px', height: '14px' }}
              />
            )}
          </li>
          {showReferenceMapDropdown && !isCollapsed && (
            <ul className="dropdown">
              {['Streets', 'Satellite Imagery', 'Terrain'].map((option) => (
                <li
                  key={option}
                  onClick={() => handleReferenceMapSelect(option)}
                  className={selectedBasemap === option ? 'selected' : ''}
                >
                  <div className="selection-circle">
                    {selectedBasemap === option && (
                      <div className="selected-circle" />
                    )}
                  </div>
                  <span>{option}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Hazards Dropdown */}
          <li
            className="dropdown-item"
            onClick={toggleHazardsDropdown}
            data-tooltip="Hazards"
          >
            <img src="/icons/hazard.png" alt="Hazards" />
            {!isCollapsed && <span>Hazards</span>}
            {!isCollapsed && (
              <img
                src="/icons/dropdown0.png"
                alt="Expand"
                className={`dropdown-arrow ${
                  showHazardsDropdown ? 'rotate' : ''
                }`}
                style={{ width: '14px', height: '14px' }}
              />
            )}
          </li>
          {showHazardsDropdown && !isCollapsed && (
            <ul className="dropdown">
              {[
                { name: 'Flooding', icon: '/icons/flood.png' },
                { name: 'Rainfall', icon: '/icons/rainfall.png' },
                { name: 'Heat Index', icon: '/icons/heat.png' },
              ].map((hazard) => (
                <li key={hazard.name} className="hazard-item">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHazards.includes(hazard.name)}
                      onChange={() => handleHazardSelect(hazard.name)}
                    />
                    <img src={hazard.icon} alt={hazard.name} />
                    <span>{hazard.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {/* Useful Links Section */}
          {!isCollapsed && (
            <h3 className="sidebar-section-label">USEFUL LINKS</h3>
          )}

          {/* Useful Links */}
          <li
            data-tooltip="QCU"
            onClick={() =>
              window.open(
                'https://qcu.edu.ph/?fbclid=IwY2xjawJqGfhleHRuA2FlbQIxMAABHlQrpclt2omBojSeDImG_tAXeoX4643Oz8WlTt0C9kCvoCzi1SYwV5OgnRZx_aem_5l8tLSQIhv7rVRESot0QPQ',
                '_blank'
              )
            }
            style={{ cursor: 'pointer' }}
          >
            <img src="/icons/qcu.webp" alt="QCU" />
            {!isCollapsed && <span>QCU</span>}
          </li>

          <li
            data-tooltip="PAGASA"
            onClick={() =>
              window.open(
                'https://www.facebook.com/PAGASA.DOST.GOV.PH/',
                '_blank'
              )
            }
            style={{ cursor: 'pointer' }}
          >
            <img src="/icons/pagasa.png" alt="PAGASA" />
            {!isCollapsed && <span>PAGASA</span>}
          </li>

          {/* Theme toggle - updated to use context */}
          <li
            className="theme-toggle-container"
            onClick={toggleTheme} // Using context toggle function
            data-tooltip={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            <div
              className={`theme-toggle-switch ${
                isDarkMode ? 'theme-toggle-dark' : 'theme-toggle-light'
              }`}
            >
              <div className="theme-toggle-circle">
                <img
                  src={isDarkMode ? '/icons/moon.png' : '/icons/sun.png'}
                  alt="Theme icon"
                  className="theme-toggle-icon"
                />
              </div>
            </div>
            {!isCollapsed && (
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            )}
          </li>
        </ul>
      </div>

      {/* Top Bar */}
      <div className={`top-bar ${isCollapsed ? 'collapsed' : ''}`}>
        <button className="menu-button" onClick={toggleSidebar}>
          <img src="/icons/menu.png" alt="Menu" />
        </button>

        {/* Home button with navigation */}
        <button className="home-button" onClick={handleHomeClick}>
          <img src="/icons/home.png" alt="Home" />
          <span>Home</span>
        </button>

        <div className="top-bar-right">
          {/* Chatbot button - always rendered but disabled if not logged in */}
         {/* Chatbot button - always rendered but disabled if not logged in */}
         <button
            className={`chatbot-button ${!isLoggedIn ? 'disabled' : ''}`}
            onClick={handleChatbotClick}
            {...(!isLoggedIn ? { 'data-tooltips': 'You need to login to access this feature' } : {})}
            disabled={!isLoggedIn}
            style={{
              filter: !isLoggedIn ? 'grayscale(100%)' : 'none',
              opacity: !isLoggedIn ? '0.6' : '1',
              cursor: !isLoggedIn ? 'not-allowed' : 'pointer',
              position: 'relative',
            }}
          >
            <img src="/icons/chatbot.png" alt="Chatbot" />
            <span>Chatbot</span>
          </button>
          <button className="profile-button" onClick={toggleProfileDropdown}>
            <img src="/icons/profile.png" alt="Profile" />
            <span>{profileButtonLabel}</span>{' '}
            {/* Use the state for the label */}
            <img
              src="/icons/dropdown0.png"
              alt="Expand"
              className={`dropdown-arrow profile-dropdown-arrow ${
                showProfileDropdown ? 'rotate' : ''
              }`}
              style={{ width: '15px', height: '15px' }}
            />
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div
                className="dropdown-item"
                onClick={() => setShowSubmissionHistoryPopup(true)}
              >
                <img
                  src="/icons/submissionhistory.png"
                  alt="Submission History"
                />
                <span>Submission History</span>
              </div>
              <div className="dropdown-item" onClick={toggleProfilePopup}>
                <img src="/icons/greenprofile.png" alt="Profile" />
                <span>Profile</span>
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <img src="/icons/logout.png" alt="Logout" />
                <span>Logout</span>
              </div>
            </div>
          )}

          {showLogoutPopup && (
            <div
              className="modal-overlay"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
              <div
                className="modal-content"
                style={{
                  backgroundColor: 'var(--sidebar-bg)',
                  width: '370px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '18px',
                    textAlign: 'center',
                    marginBottom: '10px', // Reduced from 20px to 10px for better fit
                  }}
                >
                  Are you sure you want to logout?
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    marginTop: '10px', // Reduced from 20px to 10px for better fit
                  }}
                >
                  <button
                    onClick={handleLogoutConfirm}
                    style={{
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Yes, Logout
                  </button>
                  <button
                    onClick={handleLogoutCancel}
                    style={{
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showLogoutSuccess && (
            <div
              className="modal-overlay"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            >
              <div
                className="modal-content"
                style={{
                  width: '300px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'white',
                  color: '#41AB5D',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src="/icons/logout.png"
                  alt="Logout Success"
                  className="logout-icon"
                  style={{ width: '50px', height: '50px' }}
                />
                <h2 style={{ fontSize: '20px', margin: '10px 0' }}>
                  Logout Successful
                </h2>
                <p>You have been logged out successfully.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup Components */}
      {showSubmissionHistoryPopup && (
        <SubmissionHistoryPopup
        onClose={() => setShowSubmissionHistoryPopup(false)}
        showProfilePopup={showProfilePopup}
        setShowProfilePopup={setShowProfilePopup}
        setShowSubmissionHistoryPopup={setShowSubmissionHistoryPopup}
        selectedHazards={selectedHazards}
        selectedLocation={selectedLocation} // Make sure this prop is passed
      />
    )}

    {showProfilePopup && (
      <ProfilePopup
        onClose={() => setShowProfilePopup(false)}
        showSubmissionHistoryPopup={showSubmissionHistoryPopup}
        setShowSubmissionHistoryPopup={setShowSubmissionHistoryPopup}
        setShowProfilePopup={setShowProfilePopup}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedHazards={selectedHazards}
      />
    )}

    {showResultPopup && (
      <ResultPopup
        onClose={() => setShowResultPopup(false)}
        showChatbotPopup={showChatbotPopup}
        setShowChatbotPopup={setShowChatbotPopup}
        setShowResultPopup={setShowResultPopup}
        selectedHazards={selectedHazards}
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

            {progress === 100 && (
              <button
                className="processing-button"
                onClick={() => {
                  setShowSeeResult(false);
                  setShowResultPopup(true);
                }}
              >
                See Result
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Sidebar;