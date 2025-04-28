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
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
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
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
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
  weatherData = {},
  selectedDate,
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

  // Set wide date range without restrictions
  const startDate = new Date('2024-01-01');
  const defaultDate = today;

  return {
    minDate: startDate,
    defaultDate: defaultDate,
    // Remove maxDate to allow all future dates
    // Add filterDate to handle dataset availability checking
    filterDate: (date) => {
      const year = date.getFullYear();
      return year === 2024 || year === 2025;
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

  try {
    const locationLower = location.toLowerCase();
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    // Determine correct period prefix based on date
    let period = '';
    if (year === 2025) {
      period = 'janapril'; // Only Jan-Apr data for 2025
    } else {
      // 2024 data uses different period prefixes
      period =
        month <= 2
          ? 'janfeb'
          : month <= 4
          ? 'marapril'
          : month <= 6
          ? 'mayjune'
          : month <= 8
          ? 'julyaug'
          : month <= 10
          ? 'sepoct'
          : 'novdec';
    }

    // Find matching city
    let matchedCity = null;
    let bestMatchScore = 0;

    console.log('Looking for datasets with:', {
      year,
      period,
      location: locationLower,
    });

    for (const [city, variations] of Object.entries(cityMappings)) {
      // For 2024, don't include the year in the check
      if (year === 2024 && city.includes('2025')) continue;
      // For 2025, only look at 2025 datasets
      if (year === 2025 && !city.includes('2025')) continue;

      // Check if city starts with the correct period
      if (!city.toLowerCase().startsWith(period.toLowerCase())) continue;

      for (const variant of variations) {
        if (locationLower.includes(variant.toLowerCase())) {
          const matchScore = variant.length;
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            matchedCity = city;
          }
        }
      }
    }

    console.log('Search results:', {
      period,
      matchedCity,
      date: formattedDate,
    });

    console.log('Selected date:', formattedDate);
    console.log('Period:', period);
    console.log('Matched city:', matchedCity);

    if (!matchedCity || !weatherDatasets[matchedCity]) {
      throw new Error('No dataset available for this location and period');
    }

    const weatherDataRaw = weatherDatasets[matchedCity];

    // Find the specific day in the dataset
    const selectedDayData = weatherDataRaw.days.find(
      (day) => day.datetime === formattedDate
    );

    if (!selectedDayData) {
      throw new Error('No data available for selected date');
    }

    return {
      hasData: true,
      resolvedAddress: location,
      latitude: weatherDataRaw.latitude,
      longitude: weatherDataRaw.longitude,
      days: [
        {
          temp: selectedDayData.temp || 0,
          feelslike: selectedDayData.feelslike || 0,
          humidity: selectedDayData.humidity || 0,
          precip: selectedDayData.precip || 0,
          precipprob: selectedDayData.precipprob || 0,
          cloudcover: selectedDayData.cloudcover || 0,
          windspeed: selectedDayData.windspeed || 0,
          datetime: selectedDayData.datetime,
        },
      ],
    };
  } catch (error) {
    console.error('Error loading weather data:', error);
    return {
      hasData: false,
      resolvedAddress: location,
      days: [DEFAULT_WEATHER],
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
        console.log('Loaded data:', data);
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
    [selectedHazards, hazardDetails, getWeatherMetrics]
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
            <p>Pick a Date</p>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={dateRange.minDate}
              maxDate={dateRange.maxDate}
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
                  data={dynamicHazards}
                  locationName={locationDetails.name}
                  weatherData={weatherData}
                  selectedDate={selectedDate}
                />
              }
              fileName="Assessment_Results.pdf"
              className="view-report-button"
              style={{ color: 'white' }}
            >
              {({ blob, url, loading, error }) =>
                loading
                  ? 'Generating PDF...'
                  : error
                  ? 'Error generating PDF'
                  : 'View Result with AI Recommendation (PDF)'
              }
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
