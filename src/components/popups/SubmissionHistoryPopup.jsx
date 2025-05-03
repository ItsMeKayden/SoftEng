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
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  
  const saveSubmission = async (location, hazards) => {
    if (!location || !hazards?.length) {
      console.log('Missing location or hazards');
      return;
    }
  
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.email) {
        console.error('No user email found');
        return;
      }
  
      const [lat, lon] = location;
      const locationName = await getLocationName(lat, lon);
  
      const submission = {
        userId: user.email,
        location: locationName,
        hazards: hazards,
        timestamp: new Date().toISOString(),
        _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Generate unique ID
      };
  
      console.log('Sending submission with userId:', submission);
  
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': user.email
        },
        body: JSON.stringify(submission)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const savedSubmission = await response.json();
      console.log('Submission saved successfully:', savedSubmission);
      
       // Immediately fetch updated submissions
    await fetchSubmissions();
    
    // Add the new submission to the current state
    setSubmissions(prev => [...prev, savedSubmission]);
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

  useEffect(() => {
    // Update user state when localStorage changes
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
  
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchSubmissions = async () => {
    console.log('Fetching submissions...');
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.email) {
        console.error('No user email found');
        setSubmissions([]);
        return;
      }
  
      // Remove the query parameter from the URL
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'userId': user.email
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Raw API response:', data);
  
      // Filter submissions for current user
      const userSubmissions = Array.isArray(data) 
        ? data.filter(sub => sub.userId === user.email)
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
      if (user?.email) {
        await fetchSubmissions();
      }
    };
    
    loadSubmissions();
  }, [user?.email]); // Add user.email as dependency
  

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