import React from 'react';
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

  // Handle array location format
  if (Array.isArray(location)) {
    return location.join(',').trim();
  }

  // Handle string location
  return typeof location === 'string'
    ? location.trim()
    : 'Invalid location format';
};

console.log('Available datasets:', {
  totalCities: Object.keys(weatherDatasets).length,
  sampleCities: Object.keys(weatherDatasets).slice(0, 5),
  cityMappingsCount: Object.keys(cityMappings).length,
});

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

        {/* Weather Summary Section */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Weather Summary</Text>
          <View style={pdfStyles.table}>
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={pdfStyles.tableCell}>Metric</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                Value
              </Text>
            </View>
            {weatherData.hasData && weatherData.days?.[0] && (
              <>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Temperature</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].temp}°C
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Feels Like</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].feelslike}°C
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Humidity</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].humidity}%
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Precipitation</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].precip} mm
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Cloud Cover</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].cloudcover}%
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCell}>Wind Speed</Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {weatherData.days[0].windspeed} km/h
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Hazard Assessment Section */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Hazard Assessment</Text>
          {data.length > 0 ? (
            <View style={pdfStyles.table}>
              <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
                <Text style={pdfStyles.tableCell}>Hazard Type</Text>
                <Text style={pdfStyles.tableCell}>Risk Level</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                  Recommendation
                </Text>
              </View>
              {data.map((hazard, index) => (
                <View style={pdfStyles.tableRow} key={index}>
                  <Text style={pdfStyles.tableCell}>{hazard.name}</Text>
                  <Text style={pdfStyles.tableCell}>
                    {hazard.weather?.risk || 'N/A'}
                  </Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.lastCell]}>
                    {hazard.recommendation}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={pdfStyles.noData}>No hazards selected</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Generated on: {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
};

// Update the getWeatherData function
const getDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Set wide date range without restrictions
  const startDate = new Date('2024-01-01');
  const defaultDate = today;

  return {
    minDate: startDate,
    defaultDate: defaultDate,
    // Remove maxDate to allow all future dates
    // Add filterDate to handle dataset availability checking
    filterDate: (date) => {
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      // Basic year check
      const year = date.getFullYear();
      if (year !== 2024 && year !== 2025) return false;

      // Only allow dates up to today
      return compareDate <= today;
    },
  };
};

const getWeatherData = async (location, selectedDate) => {
  if (!location || location === 'No location selected') {
    console.log('No location provided');
    return {
      hasData: false,
      resolvedAddress: 'No location selected',
      days: [DEFAULT_WEATHER],
    };
  }

  // Visual Crossing API configuration
  const API_KEY = '5ZAFN8N4VVFBZ2RZHDYZQZCHC'; // Get this from Visual Crossing
  const baseUrl = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

  try {
    const locationLower = location.toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const formattedSelectedDate = selectedDate.toISOString().split('T')[0];
    const formattedDate = formattedSelectedDate;

    const formattedLocation = locationLower.includes('philippines') 
      ? encodeURIComponent(location.trim())
      : encodeURIComponent(`${location.trim()}, Philippines`);

    // First, get current weather data
    const url = `${baseUrl}/${formattedLocation}/${formattedSelectedDate}?unitGroup=metric&key=${API_KEY}&contentType=json`;

    console.log('Requesting URL:', url); // Debug log

    const response = await fetch(url);
    const responseText = await response.text();
    if (!response.ok) {
      console.error('API Error Response:', responseText);
      throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
    }

    const data = JSON.parse(responseText); // Parse the response text
    console.log('API Response:', data);

    return {
      hasData: true,
      resolvedAddress: data.resolvedAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      days: [{
        temp: data.days[0]?.temp || 0,
        feelslike: data.days[0]?.feelslike || 0,
        humidity: data.days[0]?.humidity || 0,
        precip: data.days[0]?.precip || 0,
        precipprob: data.days[0]?.precipprob || 0,
        cloudcover: data.days[0]?.cloudcover || 0,
        windspeed: data.days[0]?.windspeed || 0,
        datetime: formattedSelectedDate,
      }],
    };
  } catch (error) {
    console.error('Error loading weather data:', error);
    return {
      hasData: false,
      resolvedAddress: location,
      days: [DEFAULT_WEATHER],
      error: error.message,
    };
  }
};

// 🔗 Main Popup
const ResultPopup = ({
  onClose,
  showChatbotPopup,
  setShowChatbotPopup,
  setShowResultPopup,
  darkMode,
  selectedHazards = [],
  selectedLocation,
}) => {

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

  // Update the date state with better initialization
  const dateRange = React.useMemo(() => getDateRange(), []);
  const [selectedDate, setSelectedDate] = React.useState(dateRange.defaultDate);

  // Add a date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
    // This will trigger the useEffect that loads weather data
  };

  // Load weather data when location changes
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

  console.log('Selected Location:', location); // Debug log
  console.log('Weather Data:', weatherData); // Debug log

  const allHazards = [
    {
      name: 'Flooding',
      description: 'Flooding in low-lying areas',
      recommendation: 'Use flood barriers and evacuate',
    },
    {
      name: 'Rainfall',
      description: 'Heavy rainfall expected',
      recommendation: 'Stay indoors, avoid flooding zones',
    },
    {
      name: 'Heat Index',
      description: 'High heat risk',
      recommendation: 'Drink water and stay cool',
    },
  ];

  const getWeatherMetrics = (hazardType) => {
    const today = weatherData?.days?.[0] || DEFAULT_WEATHER;

    switch (hazardType) {
      case 'Flooding':
        return {
          risk: today.precip > 4 ? 'High' : today.precip > 2 ? 'Medium' : 'Low',
          metrics: {
            'Temperature:': `${today.temp}°C`,
            'Precipitation:': `${today.precip} mm`,
            'Probability:': `${today.precipprob}%`,
          },
          description: 'Heavy rainfall expected',
        };
      case 'Rainfall':
        return {
          metrics: {
            'Amount:': `${today.precip} mm`,
            'Cloud Cover:': `${today.cloudcover}%`,
            'Wind Speed:': `${today.windspeed} km/h`,
          },
          description: 'High rainfall intensity',
        };
      case 'Heat Index':
        return {
          risk: today.temp > 27 ? 'High' : today.temp > 25 ? 'Moderate' : 'Low',
          metrics: {
            'Temperature:': `${today.temp}°C`,
            'Feels Like:': `${today.feelslike}°C`,
            'Humidity:': `${today.humidity}%`,
          },
          description: 'High heat risk',
        };
      default:
        return null;
    }
  };

  // Only include hazards that are selected
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
      borderRightWidth: 0, // no right border on the last cell
    },

    tableHeader: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      backgroundColor: '#f0f0f0',
    },
  });

  // PDF Component
  // Update the MyDocument component to be more resilient

  // Dynamic hazard data from selectedHazards
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
        ? selectedHazards.map((name) => ({
            name,
            description: hazardDetails[name]?.description || 'N/A',
            recommendation: hazardDetails[name]?.recommendation || 'N/A',
            weather: getWeatherMetrics(name),
          }))
        : [],
    [selectedHazards, weatherData, getWeatherMetrics]
  );
  return (
    <div className="profile-popup-overlay">
      <div className={`profile-popup ${darkMode ? 'dark-mode' : ''}`}>
        {/* Panel */}
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
        {/* Top Panel with Location */}
        <div className="result-top-panel">
          <div className="assessment-title">ASSESSMENT RESULTS</div>
          <div className="date-picker-container">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={dateRange.minDate}
              filterDate={dateRange.filterDate}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className={`date-picker ${darkMode ? 'dark-mode' : ''}`}
              placeholderText="Select a date"
              todayButton="Today"
            />
          </div>
        </div>
        {/* Content Panels */}
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
        {/* Bottom Panel */}
        <div className="result-bottom-panel">
          {weatherData.hasData && dynamicHazards.length > 0 ? (
            <PDFDownloadLink
              document={
                <MyDocument
                  data={dynamicHazards.map(hazard => ({
                    name: hazard.name,
                    description: hazard.description,
                    recommendation: hazard.recommendation,
                    weather: {
                      risk: hazard.weather?.risk || 'N/A',
                      metrics: Object.entries(hazard.weather?.metrics || {}).reduce((acc, [key, value]) => {
                        acc[key.replace(':', '')] = value;
                        return acc;
                      }, {})
                    }
                  }))}
                  locationName={locationDetails.name|| 'Unknown Location'}
                  weatherData={{
                    hasData: true,
                    days: [{
                      temp: weatherData.days[0].temp,
                      feelslike: weatherData.days[0].feelslike,
                      humidity: weatherData.days[0].humidity,
                      precip: weatherData.days[0].precip,
                      cloudcover: weatherData.days[0].cloudcover,
                      windspeed: weatherData.days[0].windspeed
                    }]
                  }}
                  selectedDate={selectedDate}
                />
              }
              fileName={`Assessment_Results_${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}.pdf`}
              className="view-report-button"
              style={{ color: 'white' }}
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
    </div>
  );
};

export default ResultPopup;
