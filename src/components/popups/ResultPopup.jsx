import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PopupStyles.css';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import {
  weatherDatasets,
  DEFAULT_WEATHER,
  cityMappings,
} from '../Datasets/Index.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatLocation = (location) => {
  if (!location) return 'No location selected';
  if (Array.isArray(location)) return location.join(',').trim();
  return typeof location === 'string'
    ? location.trim()
    : 'Invalid location format';
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 12,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },

  noData: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  date: {
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottom: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
});

const MyDocument = ({
  data = [],
  locationName = '',
  weatherData = { days: [{}] },
  selectedDate = new Date(),
}) => {
  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Weather & Hazard Assessment Report</Text>
        <Text style={pdfStyles.subtitle}>{locationName}</Text>
        <Text style={pdfStyles.date}>Date: {formattedDate}</Text>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Weather Summary</Text>
          <View style={pdfStyles.table}>
            {/* ... Weather table content ... */}
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Hazard Assessment</Text>
          {/* ... Hazard assessment content ... */}
        </View>

        <Text style={pdfStyles.footer}>
          Generated on: {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
};

const getDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date('2024-01-01');
  const defaultDate = today;

  return {
    minDate: startDate,
    defaultDate: defaultDate,
    filterDate: (date) => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      const year = date.getFullYear();
      return year === 2024 || year === 2025 ? compareDate <= today : false;
    },
  };
};

const API_KEYS = [
  '5ZAFN8N4VVFBZ2RZHDYZQZCHC',
  'XW7E3XCPVNX8WNAZTMCYHJE8S',
  'ZJUTSWL9XAJ8T5B8QEFD8D82A',
];

const getWeatherData = async (location, selectedDate) => {
  if (!location || location === 'No location selected') {
    console.log('No location provided');
    return {
      hasData: false,
      resolvedAddress: 'No location selected',
      days: [DEFAULT_WEATHER],
    };
  }

  const baseUrl =
    'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
  const locationLower = location.toLowerCase();
  const formattedSelectedDate = new Date(
    selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split('T')[0];
  const formattedLocation = locationLower.includes('philippines')
    ? encodeURIComponent(location.trim())
    : encodeURIComponent(`${location.trim()}, Philippines`);

  for (const API_KEY of API_KEYS) {
    try {
      const url = `${baseUrl}/${formattedLocation}/${formattedSelectedDate}?unitGroup=metric&key=${API_KEY}&contentType=json`;

      console.log('Requesting URL:', url);

      const response = await fetch(url);
      const responseText = await response.text();
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(
          `Weather API request failed: ${response.status} ${response.statusText}`
        );
      }

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('API Response:', data);

        return {
          hasData: true,
          resolvedAddress: data.resolvedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          days: [
            {
              temp: data.days[0]?.temp || 0,
              feelslike: data.days[0]?.feelslike || 0,
              humidity: data.days[0]?.humidity || 0,
              precip: data.days[0]?.precip || 0,
              precipprob: data.days[0]?.precipprob || 0,
              cloudcover: data.days[0]?.cloudcover || 0,
              windspeed: data.days[0]?.windspeed || 0,
              datetime: formattedSelectedDate,
            },
          ],
        };
      }
      console.log(
        'API key failed:',
        API_KEY.substring(0, 5) + '...',
        responseText
      );
    } catch (error) {
      console.error(
        'Error with API key:',
        API_KEY.substring(0, 5) + '...',
        error
      );
    }
  }

  console.error('Error loading weather data:', error);
  return {
    hasData: false,
    resolvedAddress: location,
    days: [DEFAULT_WEATHER],
    error: 'All API keys exceeded or invalid',
  };
};

const ResultPopup = ({
  onClose,
  showChatbotPopup,
  setShowChatbotPopup,
  setShowResultPopup,
  darkMode,
  selectedHazards = [],
  selectedLocation,
}) => {
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const navigate = useNavigate();

  const saveSubmissionToDatabase = async (hazardData, location) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;

      if (!userEmail) {
        console.error('No user email found');
        throw new Error('User not logged in');
      }

      console.log('Saving submission with data:', {
        userId: userEmail,
        location,
        hazards: hazardData.map((h) => h.name),
      });

      const response = await fetch(
        'https://ecourban.onrender.com/submissions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            userId: userEmail,
          },
          body: JSON.stringify({
            userId: userEmail,
            location: location,
            hazards: hazardData.map((h) => h.name),
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save submission: ${errorData}`);
      }

      const savedSubmission = await response.json();
      console.log('Submission saved:', savedSubmission);
      return true;
    } catch (error) {
      console.error('Error saving submission:', error);
      throw error;
    }
  };

  const [isPdfLoading, setIsPdfLoading] = React.useState(false);

  const [weatherData, setWeatherData] = React.useState({
    hasData: false,
    days: [DEFAULT_WEATHER],
    resolvedAddress: formatLocation(selectedLocation),
  });

  const locationDetails = React.useMemo(() => {
    const name = formatLocation(selectedLocation);
    const coordinates =
      weatherData?.latitude && weatherData?.longitude
        ? `${weatherData.latitude.toFixed(
            4
          )}°N, ${weatherData.longitude.toFixed(4)}°E`
        : '';

    return { name, coordinates };
  }, [selectedLocation, weatherData]);

  console.log('ResultPopup received props:', {
    selectedLocation,
    selectedHazards,
    showChatbotPopup,
    darkMode,
  });

  const location = Array.isArray(selectedLocation)
    ? selectedLocation.join(',').trim()
    : typeof selectedLocation === 'string'
    ? selectedLocation.trim()
    : 'No location selected';

  const dateRange = React.useMemo(() => getDateRange(), []);
  const [selectedDate, setSelectedDate] = React.useState(dateRange.defaultDate);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  React.useEffect(() => {
    const loadWeatherData = async () => {
      const formattedLocation = Array.isArray(selectedLocation)
        ? selectedLocation.join(',').trim()
        : typeof selectedLocation === 'string'
        ? selectedLocation.trim()
        : null;

      if (formattedLocation) {
        console.log(
          'Loading weather data for:',
          formattedLocation,
          'Date:',
          selectedDate
        );
        const data = await getWeatherData(formattedLocation, selectedDate);
        setWeatherData(data);
      } else {
        console.log('No valid location provided');
        setWeatherData({
          hasData: false,
          days: [DEFAULT_WEATHER],
          resolvedAddress: 'No location selected',
        });
      }
    };
    loadWeatherData();
    const refreshInterval = setInterval(loadWeatherData, 30 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [selectedLocation, selectedDate]);

  console.log('Selected Location:', location);
  console.log('Weather Data:', weatherData);

  const allHazards = [
    {
      name: 'Flooding',
      description: 'Assessment of flooding risk in low-lying areas',
      getRiskBasedRecommendation: (risk) => {
        switch (risk?.toLowerCase()) {
          case 'high':
            return 'IMMEDIATE ACTION REQUIRED! Evacuate to higher ground. Avoid flood-prone areas. Follow evacuation orders. Secure important documents and valuables. Monitor PAGASA updates.';
          case 'medium':
            return 'Be prepared for possible evacuation. Move vehicles to higher ground. Keep emergency supplies ready. Monitor local flood warnings and PAGASA updates.';
          case 'low':
            return 'Stay alert to weather changes. Keep drainage areas clear. Prepare basic emergency supplies. Check local weather updates.';
          default:
            return 'Monitor local weather updates and maintain awareness of flood risks.';
        }
      },
    },
    {
      name: 'Rainfall',
      description: 'Assessment of rainfall intensity and potential impacts',
      getRiskBasedRecommendation: (risk) => {
        switch (risk?.toLowerCase()) {
          case 'high':
            return 'STAY INDOORS! Avoid unnecessary travel. Secure loose objects outdoors. Prepare for possible flooding. Keep emergency supplies ready. Monitor PAGASA rainfall advisories.';
          case 'medium':
            return 'Carry rain protection. Avoid flood-prone areas. Be prepared for heavy rain. Stay updated with weather alerts. Check drainage systems.';
          case 'low':
            return 'Light to moderate rainfall expected. Carry rain protection. Normal activities can continue with usual precautions.';
          default:
            return 'Keep updated with weather forecasts and carry rain protection if needed.';
        }
      },
    },
    {
      name: 'Heat Index',
      description:
        'Assessment of heat stress risk based on temperature and humidity',
      getRiskBasedRecommendation: (risk) => {
        switch (risk?.toLowerCase()) {
          case 'high':
            return 'EXTREME CAUTION! Stay indoors in air-conditioned spaces. Avoid strenuous activities. Drink plenty of water. Watch for heat exhaustion symptoms. Seek immediate medical attention if needed.';
          case 'medium':
            return 'Reduce outdoor activities. Stay hydrated. Wear light clothing. Take frequent breaks in shade. Monitor for heat-related symptoms.';
          case 'low':
            return 'Maintain normal hydration. Use sun protection. Normal activities can continue with usual heat precautions.';
          default:
            return 'Stay hydrated and be aware of heat-related symptoms.';
        }
      },
    },
  ];

  const getWeatherMetrics = (hazardType) => {
    const today = weatherData?.days?.[0] || DEFAULT_WEATHER;

    switch (hazardType) {
      case 'Flooding':
        return {
          risk:
            today.precip > 30 ? 'High' : today.precip > 15 ? 'Medium' : 'Low',
          metrics: {
            'Temperature:': `${today.temp}°C`,
            'Precipitation:': `${today.precip} mm`,
            'Probability:': `${today.precipprob}%`,
          },
          description:
            today.precip > 30
              ? 'Heavy rainfall may cause severe flooding'
              : today.precip > 15
              ? 'Moderate flooding possible in low-lying areas'
              : 'Minor flood risk in flood-prone areas',
        };

      case 'Rainfall':
        return {
          risk:
            today.precip > 30 ? 'High' : today.precip > 15 ? 'Medium' : 'Low',
          metrics: {
            'Amount:': `${today.precip} mm`,
            'Cloud Cover:': `${today.cloudcover}%`,
            'Wind Speed:': `${today.windspeed} km/h`,
          },
          description:
            today.precip > 30
              ? 'Heavy rainfall warning (Red)'
              : today.precip > 15
              ? 'Moderate rainfall warning (Orange)'
              : 'Light to moderate rainfall (Yellow)',
        };

      case 'Heat Index':
        return {
          risk: today.temp > 41 ? 'High' : today.temp > 33 ? 'Medium' : 'Low',
          metrics: {
            'Temperature:': `${today.temp}°C`,
            'Feels Like:': `${today.feelslike}°C`,
            'Humidity:': `${today.humidity}%`,
          },
          description:
            today.temp > 41
              ? 'Danger: Heat cramps and exhaustion likely'
              : today.temp > 33
              ? 'Extreme caution: Heat exhaustion possible'
              : 'Caution: Fatigue possible with prolonged exposure',
        };

      default:
        return null;
    }
  };

  const hazardData = allHazards.filter((h) => selectedHazards.includes(h.name));

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      backgroundColor: '#fff',
    },
    section: {
      marginBottom: 10,
    },
    table: {
      display: 'table',
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#000',
      marginBottom: 10,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: '#000',
    },
    tableCell: {
      flex: 1,
      padding: 5,
      fontSize: 12,
      textAlign: 'center',
      borderRightWidth: 1,
      borderColor: '#000',
    },
    lastCell: {
      borderRightWidth: 0,
    },

    tableHeader: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      backgroundColor: '#f0f0f0',
    },
  });

  const hazardDetails = {
    Flooding: {
      description: 'Flooding in low-lying areas',
      recommendation: 'Use flood barriers and evacuate',
    },
    Rainfall: {
      description: 'Heavy rainfall expected',
      recommendation: 'Stay indoors, avoid flooding zones',
    },
    'Heat Index': {
      description: 'High heat risk',
      recommendation: 'Drink water and stay cool',
    },
  };

  const dynamicHazards = React.useMemo(
    () =>
      Array.isArray(selectedHazards)
        ? selectedHazards.map((name) => {
            const hazard = allHazards.find((h) => h.name === name);
            const weatherMetrics = getWeatherMetrics(name);
            return {
              name,
              description: hazard?.description || 'N/A',
              recommendation:
                hazard?.getRiskBasedRecommendation(weatherMetrics?.risk) ||
                'N/A',
              weather: weatherMetrics,
            };
          })
        : [],
    [selectedHazards, weatherData]
  );

  const handleWheel = React.useCallback((e) => {
    e.stopPropagation();
  }, []);

  React.useEffect(() => {
    const contentElement = document.querySelector('.result-content');
    if (contentElement) {
      contentElement.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        contentElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  return (
    <div className="profile-popup-overlay" onClick={(e) => e.stopPropagation()}>
      <div
        className={`profile-popup ${darkMode ? 'dark-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-panel">
          <div className="panel-left">
            <button className="active" onClick={() => {}}>
              <img src="/icons/result.png" alt="Assessment Result" />
            </button>
            <button
              className={showChatbotPopup ? 'active' : ''}
              onClick={() => {
                setShowChatbotPopup(true);
                setShowResultPopup(false);
              }}
            >
              <img src="/icons/chatbot.png" alt="Chat Bot" />
            </button>
          </div>

          <div className="panel-right">
            <button onClick={onClose}>
              <img src="/icons/close.png" alt="Close" className="close-icon" />
            </button>
          </div>
        </div>
        <div className="result-top-panel">
          <div className="assessment-title">ASSESSMENT RESULTS</div>
          <div className="date-picker-container">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={new Date('2019-01-01')}
              maxDate={new Date('2025-12-31')}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className={`date-picker ${darkMode ? 'dark-mode' : ''}`}
              placeholderText="Select a date"
              todayButton="Today"
              yearDropdownItemNumber={7}
              scrollableYearDropdown
            />
          </div>
        </div>
        <div className="result-content">
          <div className="location-name">
            <h2>{locationDetails.name}</h2>
            {locationDetails.coordinates && (
              <p>{locationDetails.coordinates}</p>
            )}
          </div>
          {!weatherData.hasData ? (
            <div className="result-content-panel no-data">
              <h3>No Data Available</h3>
              <p>We currently don't have data for {selectedLocation}.</p>
            </div>
          ) : dynamicHazards.length > 0 ? (
            dynamicHazards.map((hazard, index) => (
              <div
                className="result-content-panel"
                key={`hazard-${hazard.name}-${index}`}
              >
                <h3>{hazard.name} Assessment</h3>
                <div className="hazard-content">
                  <p className="description">{hazard.description}</p>
                  {hazard.weather && (
                    <div className="weather-metrics">
                      {hazard.weather.risk && (
                        <div
                          className={`risk-level ${hazard.weather.risk.toLowerCase()}`}
                        >
                          Risk Level: {hazard.weather.risk}
                        </div>
                      )}
                      <div className="metrics-grid">
                        {Object.entries(hazard.weather.metrics).map(
                          ([key, value]) => (
                            <div key={key} className="metric-item">
                              <label>{key}</label>
                              <span>{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  <p className="recommendation">
                    <strong>Recommendation:</strong> {hazard.recommendation}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="result-content-panel">No hazards selected.</div>
          )}
        </div>
        <div className="result-bottom-panel">
          {weatherData.hasData && dynamicHazards.length > 0 ? (
            <PDFDownloadLink
              document={
                <MyDocument
                  data={dynamicHazards.map((hazard) => ({
                    name: hazard.name,
                    description: hazard.description,
                    recommendation: hazard.recommendation,
                    weather: {
                      risk: hazard.weather?.risk || 'N/A',
                      metrics: Object.entries(
                        hazard.weather?.metrics || {}
                      ).reduce((acc, [key, value]) => {
                        acc[key.replace(':', '')] = value;
                        return acc;
                      }, {}),
                    },
                  }))}
                  locationName={locationDetails.name || 'Unknown Location'}
                  weatherData={{
                    hasData: true,
                    days: [
                      {
                        temp: weatherData.days[0].temp,
                        feelslike: weatherData.days[0].feelslike,
                        humidity: weatherData.days[0].humidity,
                        precip: weatherData.days[0].precip,
                        cloudcover: weatherData.days[0].cloudcover,
                        windspeed: weatherData.days[0].windspeed,
                      },
                    ],
                  }}
                  selectedDate={selectedDate}
                />
              }
              fileName={`Assessment_Results_${selectedDate.getFullYear()}-${String(
                selectedDate.getMonth() + 1
              ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(
                2,
                '0'
              )}.pdf`}
              className="view-report-button"
              style={{ color: 'white' }}
              onClick={async (event) => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user?.email) {
                  event.preventDefault();
                  setShowLoginAlert(true);
                  return;
                }
                try {
                  await saveSubmissionToDatabase(
                    dynamicHazards,
                    locationDetails.name
                  );
                  console.log(
                    'Submission saved successfully for user:',
                    user?.email
                  );
                } catch (error) {
                  event.preventDefault();
                  console.error('Error saving submission:', error);
                  alert('Failed to save submission: ' + error.message);
                }
              }}
            >
              {({ blob, url, loading, error }) => {
                if (loading) {
                  return 'Generating PDF...';
                }
                if (error) {
                  console.error('PDF Generation Error:', error);
                  return 'Error generating PDF';
                }
                return 'View Result with AI Recommendation (PDF)';
              }}
            </PDFDownloadLink>
          ) : (
            <button
              className="view-report-button"
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              {!weatherData.hasData
                ? 'Select a location first'
                : 'Select hazards to generate report'}
            </button>
          )}
        </div>
      </div>
      {showLoginAlert && (
        <div className="login-alert-overlay">
          <div className="login-alert">
            <img
              src="/icons/warning.png"
              alt="Warning"
              className="alert-icon"
            />
            <h3>Login Required</h3>
            <p>Please log in to save submissions and download the report.</p>
            <button className="alert-button" onClick={() => navigate('/')}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPopup;
