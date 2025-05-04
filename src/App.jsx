import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/MainDashboard/Sidebar";
import MapComponent from "./components/MainDashboard/MapComponent";
import Home from "./components/Homepage/Home";
import SeeResult from "./components/popups/SeeResult";
import ResultPopup from "./components/popups/ResultPopup";
import AdminDashboard from "./components/Admin/AdminDashboard"; // Import the new component
import "./index.css";
import ChatbotPopup from "./components/popups/ChatbotPopup0";
import SubmissionHistoryPopup from "./components/popups/SubmissionHistoryPopup";
import { UserProvider } from './context/UserContext';


function App() {
  const [searchLocation, setSearchLocation] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedBasemap, setSelectedBasemap] = useState('Streets');
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [showSeeResult, setShowSeeResult] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [showChatbotPopup, setShowChatbotPopup] = useState(false);
  const [showSubmissionHistoryPopup, setShowSubmissionHistoryPopup] = useState(false);
  const [selectedHazards, setSelectedHazards] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  

  // Check for login status on app mount
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      setUserInfo(JSON.parse(user));
    }
  }, []);

  // Function to handle logout across the app
  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  const handleLocate = () => {
    setLocateTrigger((prev) => prev + 1);
    setShowSeeResult(true);
  };

  // Expose the handleLocate function to the window object
  useEffect(() => {
    window.triggerLocateFunction = handleLocate;

    // Expose search location function to window object
    window.searchLocationFunction = setSearchLocation;

    // Expose login state functions
    window.loginUser = (user) => {
      setIsLoggedIn(true);
      setUserInfo(user);
      localStorage.setItem("user", JSON.stringify(user));
    };
    
    window.logoutUser = () => {
      handleLogout();
    };

    // Clean up when component unmounts
    return () => {
      delete window.triggerLocateFunction;
      delete window.searchLocationFunction;
      delete window.loginUser;
      delete window.logoutUser;
    };
  }, []);

  const handleSearch = (location) => {
    setSearchLocation(location);
    setSelectedLocation(location); // Update the location
  };

  const handleClearSearch = () => {
    setSearchLocation(null);
  };

  const toggleLoginPopup = () => {
    if (isLoggedIn) {
      // Handle logout
      handleLogout();
      alert("You have been logged out successfully");
    } else {
      // Show login popup
      setShowLoginPopup(!showLoginPopup);
    }
  };

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUserInfo(user);
    setShowLoginPopup(false);
  };

  const handleBasemapChange = (basemap) => {
    setSelectedBasemap(basemap);
  };

  const handleViewResult = () => {
    setShowSeeResult(false);
    setShowResultPopup(true);
  };

  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              showLoginPopup={showLoginPopup}
              toggleLoginPopup={toggleLoginPopup}
              onLoginSuccess={handleLoginSuccess}
              isLoggedIn={isLoggedIn}
              handleLogout={handleLogout}
              userInfo={userInfo}
            />
          }
        />
        <Route
          path="/map"
          element={
            <div
              className={`app ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            >
              <Sidebar
                onSearch={handleSearch}
                onLocate={handleLocate}
                onClearSearch={handleClearSearch}
                updateSidebarState={setIsSidebarCollapsed}
                onBasemapChange={handleBasemapChange}
                selectedBasemap={selectedBasemap}
                isLoggedIn={isLoggedIn}
                userInfo={userInfo}
                handleLogout={handleLogout}
              />
              <div className="main-content">
                <MapComponent
                  searchLocation={searchLocation}
                  isSidebarCollapsed={isSidebarCollapsed}
                  selectedBasemap={selectedBasemap}
                  onLocate={locateTrigger}
                />
              </div>

              {showSeeResult && (
                <SeeResult
                  onClose={() => setShowSeeResult(false)}
                  onViewResult={handleViewResult}
                  setSelectedHazards={setSelectedHazards}
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
                selectedLocation={selectedLocation} // Example hazards// Use the correct prop name // Example location
              />
              )}          
            </div>
          }
        />
        {/* Add Admin Dashboard Route */}
        <Route 
          path="/admin-dashboard/*" 
          element={<AdminDashboard isLoggedIn={isLoggedIn} userInfo={userInfo} handleLogout={handleLogout} />} 
        />
      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;