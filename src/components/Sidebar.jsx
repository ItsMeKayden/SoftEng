import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import ChatbotPopup from "./popups/chatbotpopup";
import ProfilePopup from "./popups/ProfilePopup";
import ResultPopup from "./popups/ResultPopup";
import SubmissionHistoryPopup from "./popups/SubmissionHistoryPopup";
import SearchBar from "./SearchBar";

const Sidebar = ({ 
  onSearch, 
  onLocate, 
  onClearSearch, 
  updateSidebarState,
  onBasemapChange,       // New prop for basemap updates
  selectedBasemap        // New prop for current basemap
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showReferenceMapDropdown, setShowReferenceMapDropdown] = useState(false);
  const [showHazardsDropdown, setShowHazardsDropdown] = useState(false);
  const [selectedHazards, setSelectedHazards] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showSubmissionHistoryPopup, setShowSubmissionHistoryPopup] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showChatbotPopup, setShowChatbotPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("myProfile");
  const [showSeeResult, setShowSeeResult] = useState(false);
  const [progress, setProgress] = useState(0); // Track progress percentage

  const navigate = useNavigate();

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
    setShowProfileDropdown(false);
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleLogout = () => {
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    updateSidebarState(!isCollapsed);
  };

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

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

 

  const handleHazardSelect = (hazard) => {
    setSelectedHazards((prevSelected) =>
      prevSelected.includes(hazard) ? prevSelected.filter((h) => h !== hazard) : [...prevSelected, hazard]
    );
  };

  
  return (
    <div className={`app ${isDarkTheme ? "dark-theme" : "light-theme"}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="logo-container">
          <img src="logo.png" alt="Logo" className="logo" />
        </div>
        <ul>
          {/* Location Tools Section */}
          {!isCollapsed && <h3 className="sidebar-section-label">LOCATION TOOLS</h3>}

          {/* Search Bar */}
          <SearchBar 
            onSearch={(location) => {
              onSearch(location);
            }}
            onClearSearch={onClearSearch}
            isCollapsed={isCollapsed}
          />

          {/* Current Location */}
          <li onClick={onLocate}
          data-tooltip="Current Location">
            <img src="/icons/currentloc.png" alt="Location" />
            {!isCollapsed && <span>Current Location</span>}
          </li>

          {/* Display Options Section */}
          {!isCollapsed && <h3 className="sidebar-section-label">DISPLAY OPTIONS</h3>}

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
                className={`dropdown-arrow ${showReferenceMapDropdown ? "rotate" : ""}`}
                style={{ width: '14px', height: '14px' }}
              />
            )}
          </li>
          {showReferenceMapDropdown && !isCollapsed && (
            <ul className="dropdown">
              {["Streets", "Satellite Imagery", "Terrain"].map((option) => (
                <li 
                  key={option} 
                  onClick={() => handleReferenceMapSelect(option)}
                  className={selectedBasemap === option ? "selected" : ""}
                >
                  <div className="selection-circle">
                    {selectedBasemap === option && <div className="selected-circle" />}
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
                className={`dropdown-arrow ${showHazardsDropdown ? "rotate" : ""}`}
                style={{ width: '14px', height: '14px' }}
              />
            )}
          </li>
          {showHazardsDropdown && !isCollapsed && (
            <ul className="dropdown">
              {[
                { name: "Flooding", icon: "/icons/flood.png" },
                { name: "Rainfall", icon: "/icons/rainfall.png" },
                { name: "Heat Index", icon: "/icons/heat.png" },
              ].map((hazard) => (
                <li key={hazard.name}>
                  <input
                    type="checkbox"
                    checked={selectedHazards.includes(hazard.name)}
                    onChange={() => handleHazardSelect(hazard.name)}
                  />
                  <img src={hazard.icon} alt={hazard.name} className="hazard-icon" />
                  <span>{hazard.name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Useful Links Section */}
          {!isCollapsed && <h3 className="sidebar-section-label">USEFUL LINKS</h3>}

          {/* Useful Links */}
          <li data-tooltip="PAGASA">
            <img src="/icons/pagasa.png" alt="PAGASA" />
            {!isCollapsed && <span>PAGASA</span>}
          </li>
          <li data-tooltip="DENR">
            <img src="/icons/denr.png" alt="DENR" />
            {!isCollapsed && <span>DENR</span>}
          </li>
          <li data-tooltip="NASA">
            <img src="/icons/nasalogo.png" alt="NASA" />
            {!isCollapsed && <span>NASA</span>}
          </li>

          {/* Theme Toggle - Replace the existing button with this */}
          <li 
            className="theme-toggle-container" 
            onClick={toggleTheme}
            data-tooltip={isDarkTheme ? "Light Mode" : "Dark Mode"}
          >
            <div className={`theme-toggle-switch ${isDarkTheme ? 'theme-toggle-dark' : 'theme-toggle-light'}`}>
              <div className="theme-toggle-circle">
                <img 
                  src={isDarkTheme ? "/icons/moon.png" : "/icons/sun.png"} 
                  alt="Theme icon" 
                  className="theme-toggle-icon" 
                />
              </div>
            </div>
            {!isCollapsed && (
              <span>{isDarkTheme ? "Dark Mode" : "Light Mode"}</span>
            )}
          </li>
        </ul>
      </div>

      {/* Top Bar */}
      <div className={`top-bar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="menu-button" onClick={toggleSidebar}>
          <img src="/icons/menu.png" alt="Menu" />
        </button>

        {/* Home button with navigation */}
        <button className="home-button" onClick={handleHomeClick}>
          <img src="/icons/home.png" alt="Home" />
          <span>Home</span>
        </button>

        <div className="top-bar-right">
          <button className="result-button" onClick={() => setShowResultPopup(true)}>
            <img src="/icons/result.png" alt="Result" />
            <span>Result</span>
          </button>
          <button className="profile-button" onClick={toggleProfileDropdown}>
            <img src="/icons/profile.png" alt="Profile" />
            <span>Profile</span>
            <img 
              src="/icons/dropdown0.png" 
              alt="Expand" 
              className={`dropdown-arrow profile-dropdown-arrow ${showProfileDropdown ? "rotate" : ""}`}
              style={{ width: '15px', height: '15px' }}
            />
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={() => setShowSubmissionHistoryPopup(true)}>
                <img src="/icons/submissionhistory.png" alt="Submission History" />
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
        </div>
      </div>

      {/* Popup Components */}
      {showSubmissionHistoryPopup && (
        <SubmissionHistoryPopup
          onClose={() => setShowSubmissionHistoryPopup(false)}
          showProfilePopup={showProfilePopup}
          setShowProfilePopup={setShowProfilePopup}
          setShowSubmissionHistoryPopup={setShowSubmissionHistoryPopup}
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
        />
      )}

      {showResultPopup && (
        <ResultPopup
          onClose={() => setShowResultPopup(false)}
          showChatbotPopup={showChatbotPopup}
          setShowChatbotPopup={setShowChatbotPopup}
          setShowResultPopup={setShowResultPopup}
        />
      )}

      {showChatbotPopup && (
        <ChatbotPopup
          onClose={() => setShowChatbotPopup(false)}
          showResultPopup={showResultPopup}
          setShowResultPopup={setShowResultPopup}
          setShowChatbotPopup={setShowChatbotPopup}
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