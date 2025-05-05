import React, { useState, useEffect } from 'react';
import './PopupStyles.css';
import ResultPopup from './ResultPopup';

const SeeResult = ({ onClose, selectedHazards, selectedLocation }) => {
  const [progress, setProgress] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setShowButton(true);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  const handleSeeResult = () => {
    setShowResultPopup(true);
  };

  return (
    <>
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

            {showButton && (
              <div className="button-row">
                <button className="cancel-button" onClick={onClose}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResultPopup && (
        <ResultPopup
          onClose={() => {
            setShowResultPopup(false);
            onClose();
          }}
          selectedHazards={selectedHazards}
          selectedLocation={selectedLocation}
        />
      )}
    </>
  );
};

export default SeeResult;
