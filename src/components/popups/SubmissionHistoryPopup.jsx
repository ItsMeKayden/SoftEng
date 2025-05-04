import React, { useState, useEffect } from "react";
import ResultPopup from "./ResultPopup"; // Add this line
import '../popups/PopupStyles.css';

const getLocationName = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch location name');
    }
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Error getting location name:', error);
    return `${lat}, ${lon}`; // Fallback to coordinates if geocoding fails
  }
};

const SubmissionHistoryPopup = ({
  onClose,
  showProfilePopup,
  setShowProfilePopup,
  setShowSubmissionHistoryPopup,
  selectedHazards = [],
  selectedLocation = "",
}) => {
  const [submissions, setSubmissions] = useState([]);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(selectedLocation);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleInitialSubmission = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (selectedLocation && selectedHazards.length > 0 && user?.email) {
        console.log('Initial submission data:', {
          location: selectedLocation,
          hazards: selectedHazards,
          userId: user.email
        });
        await saveSubmission(selectedLocation, selectedHazards);
      } else {
        console.log('Missing required data:', {
          hasLocation: !!selectedLocation,
          hazardsCount: selectedHazards.length,
          hasUser: !!user?.email
        });
      }
    };
    
    handleInitialSubmission();
  }, [selectedLocation, selectedHazards]); 
  
  const saveSubmission = async (location, hazards) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;
  
      if (!userEmail) {
        console.error('No user email found');
        return;
      }
  
      console.log('Saving submission for user:', userEmail);
  
      const submission = {
        email: userEmail, // Changed from userId to email to match schema
        location: location,
        hazards: hazards,
        timestamp: new Date().toISOString()
      };
  
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userEmail // Keep this as userId for backward compatibility
        },
        body: JSON.stringify(submission)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const savedSubmission = await response.json();
      console.log('Submission saved successfully:', savedSubmission);
      
      await fetchSubmissions();
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
      saveSubmission(selectedLocation, selectedHazards);
    }
  }, [selectedLocation, selectedHazards]);

  const fetchSubmissions = async () => {
    console.log('Fetching submissions...');
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Check if user is logged in
      if (!user || !user.email) {
        console.log('No user logged in');
        setSubmissions([]);
        setIsLoading(false);
        return;
      }
  
      const userEmail = user.email;
      console.log('Fetching submissions for user:', userEmail);
  
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'userId': userEmail
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Received submissions:', data);
  
      // Only show submissions for currently logged in user
      const userSubmissions = Array.isArray(data) 
        ? data.filter(sub => sub.email === userEmail)
        : [];
      
      console.log('Filtered user submissions:', userSubmissions);
      setSubmissions(userSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update useEffect to use the named function
  useEffect(() => {
    const loadSubmissions = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.email) {
        await fetchSubmissions();
      } else {
        setSubmissions([]);
        setIsLoading(false); // Make sure to stop loading state
      }
    };
    
    loadSubmissions();
  }, [localStorage.getItem('user')]); // Add dependency to react to user changes

  const formatLocationDisplay = (location) => {
    if (!location) return '';
    const [lat, lng] = location.includes(',') 
      ? location.split(',')
      : [location.slice(0, 9), location.slice(9)];
    return `${lat}, ${lng}`;
  };

  const handleViewResult = (submission) => {
    setActiveSubmission({
      ...submission,
      location: submission.location,
      hazards: submission.hazards,
      timestamp: submission.timestamp
    });
    setShowResultPopup(true);
  };



  return (
    <div className="profile-popup-overlay">
      <div className="profile-popup">
        {/* Panel */}
        <div className="profile-panel" style={{ backgroundColor: '#41AB5D' }}>
          <div className="panel-left">
            <button
              className={showProfilePopup ? 'active' : ''}
              onClick={() => {
                setShowProfilePopup(true);
                setShowSubmissionHistoryPopup(false);
              }}
            >
              <img src="/icons/profile.png" alt="Profile" />
            </button>
            <button className="active">
              <img src="/icons/result.png" alt="Submission History" />
            </button>
          </div>
          <div className="panel-center">SUBMISSION HISTORY</div>
          <div className="panel-right">
            <button onClick={onClose}>
              <img src="/icons/close.png" alt="Close" className="close-icon" />
            </button>
          </div>
        </div>

        <div className="my-profile-section">
          <div className="submission-popup">
          <table className="submission-history-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Hazard Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3">
                    <div className="loader-container">
                      <div className="loader"></div>
                    </div>
                  </td>
                </tr>
              ) : submissions && submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <tr key={submission._id || submission.timestamp || index}>
                    <td>{submission.location || 'Unknown location'}</td>
                    <td>
                      {Array.isArray(submission.hazards) 
                        ? submission.hazards.join(', ') 
                        : typeof submission.hazards === 'string' 
                          ? submission.hazards
                          : 'No hazards'}
                    </td>
                    <td>
                      <button
                        className="view-result-button"
                        onClick={() => handleViewResult(submission)}
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>
                    {isLoading ? 'Loading...' : 'No submissions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {showResultPopup && activeSubmission && (
        <ResultPopup
          onClose={() => setShowResultPopup(false)}
          selectedLocation={currentLocation}
          selectedHazards={selectedHazards}
          submission={activeSubmission}
        />
      )}
    </div>
  );
};

export default SubmissionHistoryPopup;