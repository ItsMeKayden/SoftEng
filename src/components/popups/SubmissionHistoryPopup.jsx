import React, { useState, useEffect } from 'react';
import ResultPopup from './ResultPopup';
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
    return `${lat}, ${lon}`;
  }
};

const SubmissionHistoryPopup = ({
  onClose,
  showProfilePopup,
  setShowProfilePopup,
  setShowSubmissionHistoryPopup,
  selectedHazards = [],
  selectedLocation = '',
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
        await saveSubmission(selectedLocation, selectedHazards);
      }
    };
    handleInitialSubmission();
  }, [selectedLocation, selectedHazards]);

  const saveSubmission = async (location, hazards) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;

      if (!userEmail) return;

      const submission = {
        email: userEmail,
        location: location,
        hazards: hazards,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(
        'https://ecourban.onrender.com/submissions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            userId: userEmail,
          },
          body: JSON.stringify(submission),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));

      if (!user || !user.email) {
        setSubmissions([]);
        return;
      }

      const userEmail = user.email;
      const response = await fetch(
        'https://ecourban.onrender.com/submissions',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            userId: userEmail,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const userSubmissions = Array.isArray(data)
        ? data.filter((sub) => sub.email === userEmail)
        : [];

      setSubmissions(userSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadSubmissions = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.email) {
        await fetchSubmissions();
      } else {
        setSubmissions([]);
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, [localStorage.getItem('user')]);

  const formatLocationDisplay = (location) => {
    if (!location) return '';
    const [lat, lng] = location.includes(',')
      ? location.split(',')
      : [location.slice(0, 9), location.slice(9)];
    return `${lat}, ${lng}`;
  };

  const handleViewResult = async (submission) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;

      if (!userEmail) return;

      const submissionLocation = submission.location;
      const submissionHazards = Array.isArray(submission.hazards)
        ? submission.hazards
        : typeof submission.hazards === 'string'
        ? [submission.hazards]
        : [];

      setActiveSubmission({
        ...submission,
        location: submissionLocation,
        hazards: submissionHazards,
        timestamp: submission.timestamp,
      });

      try {
        const resultResponse = await fetch(
          `https://ecourban.onrender.com/results`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              userId: userEmail,
            },
            body: JSON.stringify({
              location: submissionLocation,
              hazards: submissionHazards,
            }),
          }
        );

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          setActiveSubmission((prevState) => ({
            ...prevState,
            results: resultData,
          }));
        }
      } catch (resultError) {
        console.error('Error fetching results:', resultError);
      }

      setShowResultPopup(true);
    } catch (error) {
      console.error('Error processing view result:', error);
    }
  };

  return (
    <div className="profile-popup-overlay">
      <div className="profile-popup">
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
          selectedLocation={activeSubmission.location}
          selectedHazards={activeSubmission.hazards}
          submission={activeSubmission}
        />
      )}
    </div>
  );
};

export default SubmissionHistoryPopup;
