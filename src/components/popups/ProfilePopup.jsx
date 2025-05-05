import React, { useEffect, useState } from 'react';
import './PopupStyles.css';

const ProfilePopup = ({
  onClose,
  showSubmissionHistoryPopup,
  setShowSubmissionHistoryPopup,
  setShowProfilePopup,
}) => {
  const [userData, setUserData] = useState({
    email: '',
    role: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (stored && stored !== 'undefined') {
      try {
        const parsedUser = JSON.parse(stored);
        const username = parsedUser.email.split('@')[0];

        setUserData({
          email: parsedUser.email,
          username: username,
          role: parsedUser.role,
        });
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
  }, []);

  return (
    <div className="profile-popup-overlay">
      <div className="profile-popup">
        <div className="profile-panel" style={{ backgroundColor: '#41AB5D' }}>
          <div className="panel-left">
            <button
              className="active"
              onClick={() => {
                setShowProfilePopup(true);
                setShowSubmissionHistoryPopup(false);
              }}
            >
              <img src="/icons/profile.png" alt="Profile" />
            </button>
            <button
              className={showSubmissionHistoryPopup ? 'active' : ''}
              onClick={() => {
                setShowSubmissionHistoryPopup(true);
                setShowProfilePopup(false);
              }}
            >
              <img src="/icons/result.png" alt="Submission History" />
            </button>
          </div>
          <div className="panel-center">PROFILE</div>
          <div className="panel-right">
            <button onClick={onClose}>
              <img src="/icons/close.png" alt="Close" className="close-icon" />
            </button>
          </div>
        </div>

        <div className="profile-popup1">
          <div className="background-layer" />
          <div className="image-overlay" />
          <div className="top-fade-overlay" />
          <div className="right-geo" />
          <div className="left-geo" />
          <div className="profile-content">
            <div className="profile-info">
              <div className="info-card">
                <div className="icon">
                  <img src="/icons/profile.png" alt="User Icon" />
                </div>
                <div>
                  <div className="label">Username</div>
                  <div className="value">{userData.username || 'N/A'}</div>
                </div>
              </div>

              <div className="info-card">
                <div className="icon">
                  <img src="/icons/email.png" alt="Email Icon" />
                </div>
                <div>
                  <div className="label">Email</div>
                  <div className="value">{userData.email || 'N/A'}</div>
                </div>
              </div>

              <div className="info-card">
                <div className="icon">
                  <img src="/icons/role.png" alt="Role Icon" />
                </div>
                <div>
                  <div className="label">Role</div>
                  <div className="value">{userData.role || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
