import React, { useState, useEffect } from "react";
import ResultPopup from "./ResultPopup"; // Add this line



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

  const saveSubmission = async (location, hazards) => {
    if (!location || !hazards?.length) {
      console.log('Missing location or hazards');
      return;
    }

    try {
      // ✨ Step 1: Get the location name from coordinates
      const [lat, lon] = location; // unpack the location array
      const getLocationName = async (lat, lon) => {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        return data.display_name;
      };
  
      const locationName = await getLocationName(lat, lon);
  
      // ✨ Step 2: Submit the form with the location name
      const response = await fetch('https://ecourban.onrender.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: locationName, // now it is the human-readable location name
          hazards: hazards,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedSubmission = await response.json();
      console.log('Submission saved:', savedSubmission);
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
    const fetchSubmissions = async () => {
      // Check if we have both location and hazards before making the request
      if (!currentLocation || !selectedHazards?.length) {
        console.log('Missing location or hazards');
        setSubmissions([]); // Clear submissions if no data
        return;
      }
  
      try {
        // Format location coordinates
        const [lat, lng] = currentLocation.includes(',')
          ? currentLocation.split(',').map(coord => coord.trim())
          : [currentLocation.slice(0, 9), currentLocation.slice(9)];
  
        const formattedLocation = `${lat},${lng}`;
        
        console.log('Fetching submissions for:', formattedLocation);
        console.log('Selected hazards:', selectedHazards);
  
        const response = await fetch(
          `https://ecourban.onrender.com/submissions?location=${formattedLocation}&hazards=${selectedHazards.join(',')}`
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('Received data:', data);
  
        // Filter and format the submissions
        const formattedSubmissions = data.map(submission => ({
          ...submission,
          location: formattedLocation // Ensure consistent location format
        }));
  
        setSubmissions(formattedSubmissions);
        
        console.log('Updated submissions:', formattedSubmissions);
  
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]); // Clear submissions on error
      }
    };
  
    fetchSubmissions();
  }, [currentLocation, selectedHazards]);

  

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
        {submissions && submissions.length > 0 ? (
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