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
  
      // Create submission object with userId
      const submission = {
        userId: user.email,  // Make sure this matches your schema
        location: locationName,
        hazards: hazards,
        timestamp: new Date().toISOString()
      };
  
      console.log('Sending submission:', submission); // Debug log
  
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
  
      const savedSubmission = await response.json();
      console.log('Saved submission:', savedSubmission); // Debug log
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

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.email) { // Check specifically for user.email
          console.error('No user email found');
          setSubmissions([]);
          setIsLoading(false);
          return;
        }
  
        const response = await fetch(`https://ecourban.onrender.com/submissions?userId=${user.email}`, {
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
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchSubmissions();
  }, [user?.email]); // Add specific dependency
  

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
                submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission.location || 'Unknown location'}</td>
                    <td>{submission.hazards?.join(', ') || 'No hazards'}</td>
                    <td>
                      <div className="submission-buttons">
                        <button
                          className="view-result-button"
                          onClick={() => handleViewResult(submission)}
                        >
                          View Result
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>
                    No submissions found.
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