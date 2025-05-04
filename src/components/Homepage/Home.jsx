
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginRegister from "./LoginRegister";
import emailjs from '@emailjs/browser';
import "./Homec.css";

const Home = () => {
  const [showLoginRegister, setShowLoginRegister] = useState(false);
  const [headerScrolled,] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add this state for login status
  const [userInfo, setUserInfo] = useState(null); // Add this to store user info
  const searchDebounceRef = useRef(null);
  const suggestionBoxRef = useRef(null);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Refs for scrolling to sections
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const contactRef = useRef(null);

  // New state for logout confirmation popup
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    // Set a small timeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check login status on component mount
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      setUserInfo(JSON.parse(user));
    }
  }, []);

 // Improved display name formatting to show specific locations
const formatDisplayName = (place) => {
  if (!place) return "";

  const addr = place.address || {};

  // If the place has a name that's different from the raw location name
  // use that as the primary identifier (like "Cubao Baptist Church")
  let primaryName = place.name || "";

  // If the place type indicates a specific point of interest
  if (place.type === 'amenity' ||
      place.type === 'shop' ||
      place.type === 'building' ||
      place.type === 'leisure' ||
      place.type === 'office' ||
      place.type === 'education' ||
      place.class === 'amenity' ||
      place.class === 'building') {

    // For specific locations like churches, schools, etc.
    let specificLocation = primaryName;

    // Add street address if available
    if (addr.road || addr.street) {
      const streetName = addr.road || addr.street;
      const streetNumber = addr.house_number || '';

      if (streetNumber && streetName) {
        specificLocation += `, ${streetNumber} ${streetName}`;
      } else if (streetName) {
        specificLocation += `, ${streetName}`;
      }
    }

    // Add neighborhood/district and city
    const district = addr.suburb || addr.neighbourhood || addr.district || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';

    if (district && !specificLocation.includes(district)) {
      specificLocation += `, ${district}`;
    }

    if (city && !specificLocation.includes(city)) {
      specificLocation += `, ${city}`;
    }

    // Add region/province and country code
    const region = addr.state || addr.province || '';

    if (region && !specificLocation.includes(region)) {
      specificLocation += `, ${region}`;
    }

    if (addr.country_code && addr.country_code.toUpperCase() === 'PH') {
      specificLocation += ', PHL';
    }

    return specificLocation;
  }
  // For general locations (not specific POIs)
  else {
    let locationName = '';

    // For administrative units like cities, towns, etc.
    if (addr.city || addr.town || addr.village || addr.municipality) {
      locationName = addr.suburb || addr.neighbourhood || addr.district || primaryName;
      const cityName = addr.city || addr.town || addr.village || addr.municipality;

      if (!locationName.includes(cityName)) {
        locationName += `, ${cityName}`;
      }
    } else {
      // If no city info, use the primary name
      locationName = primaryName;
    }

    // Add region and country
    const region = addr.state || addr.province || '';
    if (region && !locationName.includes(region)) {
      locationName += `, ${region}`;
    }

    if (addr.country_code && addr.country_code.toUpperCase() === 'PH') {
      locationName += ', PHL';
    }

    return locationName;
  }
};

const fetchSuggestions = async (query) => {
  if (!query.trim()) {
    setSuggestions([]);
    return;
  }

  try {
    // First search with standard parameters
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      countrycodes: 'ph',
      limit: 10,
      addressdetails: 1,
      'accept-language': 'en',
      // Add these parameters to get more specific places
      dedupe: 1,
      namedetails: 1
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const data = await response.json();

    // For longer queries, add an extended search focused on POIs
    if (query.length >= 3) {
      const extendedParams = new URLSearchParams({
        format: 'json',
        q: `${query}, Philippines`,
        addressdetails: 1,
        namedetails: 1,
        limit: 10,
        // Look specifically for amenities to get places like schools, churches, etc.
        featuretype: 'amenity building shop office leisure education'
      });

      const extendedResponse = await fetch(`https://nominatim.openstreetmap.org/search?${extendedParams}`);
      const extendedData = await extendedResponse.json();

      // Combine results and filter duplicates
      const combinedResults = [...data];
      extendedData.forEach(newItem => {
        if (!combinedResults.some(existingItem => existingItem.place_id === newItem.place_id)) {
          combinedResults.push(newItem);
        }
      });

      // Format the display names
      const formattedResults = combinedResults.map(place => ({
        ...place,
        formatted_name: formatDisplayName(place)
      }));

      // Filter out results without good location data and remove duplicates by name
      const nameSet = new Set();
      const validSuggestions = formattedResults.filter(item => {
        if (!item.formatted_name || !item.lat || !item.lon) return false;

        // Prevent duplicate formatted names
        if (nameSet.has(item.formatted_name)) return false;
        nameSet.add(item.formatted_name);

        return true;
      });

      // Sort by relevance but prioritize specific locations
      validSuggestions.sort((a, b) => {
        // Prioritize specific places first
        const aIsSpecific = a.type === 'amenity' || a.class === 'amenity' || a.class === 'building';
        const bIsSpecific = b.type === 'amenity' || b.class === 'amenity' || b.class === 'building';

        if (aIsSpecific && !bIsSpecific) return -1;
        if (!aIsSpecific && bIsSpecific) return 1;

        // Then sort by importance
        return (b.importance || 0.5) - (a.importance || 0.5);
      });

      // Limit to reasonable number
      setSuggestions(validSuggestions.slice(0, 10));
    } else {
      // Process just the initial results for short queries
      const formattedResults = data.map(place => ({
        ...place,
        formatted_name: formatDisplayName(place)
      }));

      // Remove duplicates
      const nameSet = new Set();
      const validSuggestions = formattedResults.filter(item => {
        if (!item.formatted_name || !item.lat || !item.lon) return false;

        if (nameSet.has(item.formatted_name)) return false;
        nameSet.add(item.formatted_name);

        return true;
      });

      validSuggestions.sort((a, b) => (b.importance || 0.5) - (a.importance || 0.5));
      setSuggestions(validSuggestions.slice(0, 10));
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  }
};

// Handle input change with debounce for search suggestions
const handleInputChange = (e) => {
  const value = e.target.value;
  setSearchQuery(value);

  // Clear previous timeout
  if (searchDebounceRef.current) {
    clearTimeout(searchDebounceRef.current);
  }

  // Set new timeout for debounced search
  searchDebounceRef.current = setTimeout(() => {
    fetchSuggestions(value);
  }, 300);
};

  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const viewportMiddle = scrollPosition + (windowHeight / 2);

    // Get the positions of each section
    if (aboutRef.current && featuresRef.current && contactRef.current) {
      const aboutPosition = aboutRef.current.getBoundingClientRect().top + scrollPosition;
      const featuresPosition = featuresRef.current.getBoundingClientRect().top + scrollPosition;
      const contactPosition = contactRef.current.getBoundingClientRect().top + scrollPosition;

      // Determine the visible section based on their actual positions
      const aboutHeight = aboutRef.current.offsetHeight;
      const featuresHeight = featuresRef.current.offsetHeight;
      const contactHeight = contactRef.current.offsetHeight;

      // Check which section contains the middle of the viewport
      if (viewportMiddle >= contactPosition && viewportMiddle <= contactPosition + contactHeight) {
        setActiveSection('contact');
      } else if (viewportMiddle >= featuresPosition && viewportMiddle <= featuresPosition + featuresHeight) {
        setActiveSection('features');
      } else if (viewportMiddle >= aboutPosition && viewportMiddle <= aboutPosition + aboutHeight) {
        setActiveSection('about');
      }
    }
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Initial check
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clear any pending timeouts when component unmounts
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Close suggestion box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToSection = (ref, section) => {
    setActiveSection(section);
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      // Show logout confirmation
      setShowLogoutPopup(true);
    } else {
      // Show login modal
      setShowLoginRegister(true);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowLogoutPopup(false);
  
    // Show popup instead of alert
    setShowLogoutSuccess(true);
    setTimeout(() => {
      setShowLogoutSuccess(false);
    }, 3000); // Hides popup after 3 seconds
  };
  

  const handleLogoutCancel = () => {
    // Cancel logout
    setShowLogoutPopup(false);
  };

  const handleCloseModal = (loggedInStatus = false) => {
    setShowLoginRegister(false);

    // Check if user logged in from the modal
    if (loggedInStatus) {
      setIsLoggedIn(true);
      // Get user info from localStorage
      const user = localStorage.getItem("user");
      if (user) {
        setUserInfo(JSON.parse(user));
      }
    }
  };

  const handleLocationClick = () => {
    navigate('/map');
    setTimeout(() => {
      if (window.triggerLocateFunction) {
        window.triggerLocateFunction();
      }
    }, 500);
  };

  const handleSuggestionClick = (place) => {
    setSearchQuery(place.formatted_name || place.display_name);
    setSuggestions([]);

    // Navigate to map page with the selected location
    navigate('/map');

    // Allow time for the map component to load before triggering the search
    setTimeout(() => {
      if (window.searchLocationFunction) {
        window.searchLocationFunction([parseFloat(place.lat), parseFloat(place.lon)]);
      }
    }, 500);
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;

    setIsSearching(true);
    setSuggestions([]); // clear suggestions

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}` +
        `&countrycodes=ph` +
        `&viewbox=116.95,4.6,126.6,18.2` +
        `&bounded=1`
      );

      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        // Navigate to map page
        navigate('/map');

        // Allow time for the map component to load before triggering the search
        setTimeout(() => {
          if (window.searchLocationFunction) {
            window.searchLocationFunction([parseFloat(lat), parseFloat(lon)]);
          }
        }, 500);
      } else {
        alert("Location not found in the Philippines. Please try another search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching for location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Feature data for mapping - changed emoji icons to image paths
  const features = [
    {
      title: "Interactive GIS Map",
      description: "Real-time geospatial data",
      icon: "/icons/interactive.png"
    },
    {
      title: "AI Analysis Tools",
      description: "Pattern detection & prediction",
      icon: "/icons/aianalysis.png"
    },
    {
      title: "Environmental Layers",
      description: "Rainfall, temp, elevation",
      icon: "/icons/environmentlayers.png"
    },
    {
      title: "Reporting Tool",
      description: "Auto-generate insights",
      icon: "/icons/reportingtool.png"
    },
    {
      title: "Location-Based Search",
      description: "Find areas by name or GPS",
      icon: "/icons/locationbased.png"
    },
    {
      title: "Green Space Identification",
      description: "Detect green zones via AI",
      icon: "/icons/greenspace.png"
    },
  ];

    // Form state for contact form
    const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    message: ''
  });

  // Add formStatus state
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  // Create the form reference
  const form = useRef();

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus({ submitted: false, error: false, message: 'Sending message...' });

    // Prepare the template variables for email content
    const templateParams = {
      name: formData.name,
      role: formData.role,
      email: formData.email,
      message: formData.message
    };

    // Send the email to the user
    emailjs.send(
      'service_iysc2g7', // Your EmailJS service ID
      'template_lynhqib', // Your EmailJS template ID
      templateParams, // Pass the templateParams directly
      'c96TY5rqu6knfGW4j' // Your EmailJS public key
    )
    .then((result) => {
      console.log('Email sent successfully:', result.text);
      setFormStatus({
        submitted: true,
        error: false,
        message: 'Message sent successfully! We will get back to you soon.'
      });
      // Reset form data
      setFormData({
        name: '',
        role: '',
        email: '',
        message: ''
      });

    }, (error) => {
      console.error('Failed to send email:', error.text);
      setFormStatus({
        submitted: true,
        error: true,
        message: 'Failed to send message. Please try again later.'
      });
    });
  };


  return (
    <div className="home-container">
      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-content" style={{ 
            backgroundColor: 'var(--sidebar-bg)',
            width: '370px', 
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p>Are you sure you want to logout?</p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginTop: '10px'
            }}>
              <button onClick={handleLogoutConfirm} style={{ 
                backgroundColor: '#d32f2f', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}>Yes, Logout</button>
              <button onClick={handleLogoutCancel} style={{ 
                backgroundColor: '#4caf50', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
  
      {showLogoutSuccess && (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="modal-content" style={{ 
            width: '300px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: 'white',
            color: '#41AB5D',
            borderRadius: '8px',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.3)'
          }}>
            <img src="/icons/logout.png" alt="Logout Success" className="logout-icon" style={{ width: '50px', height: '50px' }} />
            <h2 style={{ fontSize: '20px', margin: '10px 0' }}>Logout Successful</h2>
            <p>You have been logged out successfully.</p>
          </div>
        </div>
      )}
  
      {/* Header Section - Responsive Layout */}
      <header className={`home-header ${headerScrolled ? 'scrolled' : ''} ${contentLoaded ? 'fade-in' : ''}`}>
        <div className="header-content">
          <div className="home-logo-container">
            <img src="/icons/logo.png" alt="Logo" className="home-logo" />
            <div className="home-title-container">
              <h1 className="home-main-title">EcoUrban</h1>
              <p className="home-subtitle">Shaping Sustainable Urban Landscapes</p>
            </div>
          </div>
  
          <div className="header-navigation">
            {/* Menu button (visible only on small screens) */}
            <button
              className="menu-toggle-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <img src="/icons/menu.png" alt="Menu" className="menu-icon" />
            </button>
  
            {/* Navigation buttons (always in the DOM, but hidden on small screens via CSS) */}
            <div className="nav-links">
              <button
                onClick={() => scrollToSection(aboutRef, 'about')}
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection(featuresRef, 'features')}
                className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection(contactRef, 'contact')}
                className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              >
                Contact
              </button>
            </div>
  
            {/* Login button (always visible) */}
            <button className="home-login-button" onClick={handleLoginClick}>
              <img
                src={isLoggedIn ? "/icons/login.png" : "/icons/login.png"}
                alt={isLoggedIn ? "Logout" : "Login"}
                className="home-login-icon"
              />
              {isLoggedIn ? "Logout" : "Login"}
            </button>
          </div>
        </div>
  
        {/* Dropdown menu shown only when menuOpen is true */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={() => {
              scrollToSection(aboutRef, 'about');
              setMenuOpen(false);
            }}>About</button>
            <button onClick={() => {
              scrollToSection(featuresRef, 'features');
              setMenuOpen(false);
            }}>Features</button>
            <button onClick={() => {
              scrollToSection(contactRef, 'contact');
              setMenuOpen(false);
            }}>Contact</button>
          </div>
        )}
      </header>
  
      {/* Login/Register Modal with updated props */}
      {showLoginRegister && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => handleCloseModal(false)}>
              &times;
            </button>
            <LoginRegister closeModal={handleCloseModal} />
          </div>
        </div>
      )}
  
      {/* Hero Section - Responsive Layout */}
      <div className="hero-section">
        <img src="/icons/homepageebg.avif" alt="Background" className="hero-image" />
        <div className="overlay">
          <div className="side-search-container">
            <div className="side-search-wrapper" ref={suggestionBoxRef}>
              <input
                type="text"
                placeholder="Type a location"
                className="side-search-input"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
              />
              <button
                className="side-search-button"
                onClick={handleSearch}
                disabled={isSearching}
                aria-label="Search"
              >
                {isSearching ? (
                  <div className="search-spinner"></div>
                ) : (
                  <img src="/icons/search.png" alt="Search" />
                )}
              </button>
  
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSuggestionClick(item)}
                      className="suggestion-item"
                    >
                      {item.formatted_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
  
          <div className="buttons-container">
            <button
              className="location-button"
              data-tooltip="Get your real-time location and navigate easily"
              onClick={handleLocationClick}
            >
              <img src="/icons/currentlocation1.png" alt="Current Location" />
              Current Location
            </button>
            <button
              className="mapview-button"
              onClick={() => navigate("/map")}
              data-tooltip="See More Features"
            >
              <img src="/icons/mapview.png" alt="Map View" />
              Go to Map View
            </button>
          </div>
          
          {/* Info Section */}
          <div className={`info-section ${contentLoaded ? 'fade-in delay-400' : ''}`}>
            <p>
              This platform utilizes AI-driven GIS for analysis and visualization. Data sources include government agencies, satellite imagery, and research institutions. Results are for informational purposes only.
            </p>
          </div>
        </div>
      </div>
  
      {/* Footer Section */}
      <footer className="footer">
        <div className="partners">
          <div className="partner">
            <a className="partner-link">
              <img src="icons/qcu.webp" alt="DOST" className="partner-logo" />
            </a>
            <p className="partner-text">QCU</p>
          </div>
          <div className="partner">
            <a className="partner-link">
              <img src="icons/pagasa.png" alt="DOST-PAGASA" className="partner-logo" />
            </a>
            <p className="partner-text">DOST-PAGASA</p>
          </div>
        </div>
      </footer>

      
      {/* About Section */}
      <div ref={aboutRef} className="about-section">
        <div className="about-content-container">
          {/* About Us - Full width */}
          <div className="about-us-card">
            <h2 className="section-title">ABOUT</h2>
            <div className="section-content">
              <p>AI-Driven GIS for Green Infrastructure is an intelligent mapping platform designed to support climate-resilient urban planning. It leverages geospatial data and artificial intelligence to identify, recommend, and optimize green spaces in cities.</p>
            </div>
          </div>

          {/* Three column layout below */}
          <div className="about-cards-grid">
            <div className="about-card"> {/* Changed from feature-card to about-card */}
              <img src="/icons/mission.png" alt="Logo" className="about-icon" />
              <h3 className="about-card-title">Our Mission</h3> {/* Changed classname */}
              <p className="about-card-content">To empower city planners, researchers, and decision-makers with cutting-edge tools that promote sustainable, eco-friendly, and climate-resilient urban development.</p> {/* Changed classname */}
            </div>

            <div className="about-card">
              <img src="/icons/itmatters.png" alt="Logo" className="about-icon" />
              <h3 className="about-card-title">Why It Matters</h3>
              <p className="about-card-content">Urban areas face growing challenges due to climate change, poor planning, and limited green spaces. Green infrastructure improves air quality, reduces heat, and supports biodiversity. Our AI + GIS system helps identify where these improvements are most needed — fast, accurately, and at scale.</p>
            </div>

            <div className="about-card">
              <img src="/icons/users.png" alt="Logo" className="about-icon" />
              <h3 className="about-card-title">Who Can Use It?</h3>
              <p className="about-card-content">Local Government Units – for city planning and zoning Researchers & Environmentalists – for spatial analysis and sustainability research Urban Planners & Architects – for integrating green elements in their designs</p>
            </div>
          </div>
        </div>


        {/* Features section */}
        <div ref={featuresRef} className="features-section">
          <div className="features-container">
            <h2 className="features-title">FEATURES</h2>

            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <h3 className="feature-title">{feature.title}</h3>
                  <div className="feature-icon-container">
                    <img src={feature.icon} alt={feature.title} className="feature-icon-img" />
                  </div>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div ref={contactRef} className="contact-section">
          <h2 className="contact-title">CONTACT</h2>

          <p className="contact-intro">
            Get in touch with us. Fill out the form with your details for comments, feedback, and inquiries.
          </p>

          <div className="contact-container">
            {/* Contact form */}
            <div className="contact-form-container">
              <form ref={form} onSubmit={handleSubmit} className="contact-form" id="contact-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name<span className="required">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role<span className="required">*</span>
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    value={formData.role}
                    onChange={handleFormInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email<span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormInputChange}
                    className="form-textarea"
                  />
                </div>

                {formStatus.message && (
                  <div className={`form-status ${formStatus.error ? 'error' : 'success'}`}>
                    {formStatus.message}
                  </div>
                )}

                <div className="form-submit">
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={formStatus.submitted && !formStatus.error}
                  >
                    {formStatus.submitted && !formStatus.error ? 'Sent' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact info */}
            <div className="contact-info">
              <div className="contact-details">
                <h3 className="contact-info-title">Get in Touch</h3>

                <div className="contact-item">
                  <span className="contact-item-icon">
                    <img src="/icons/phone.png" alt="Logo" className="phone-icon" />
                  </span>
                  <p className="contact-item-text">+63-961-3959093</p>
                </div>

                <div className="contact-item">
                  <span className="contact-item-icon">
                    <img src="/icons/mail.png" alt="Email" className="email-icon" />
                  </span>
                  <p className="contact-item-text">aidrivengis@gmail.com</p>
                </div>

                <div className="contact-item">
                  <span className="contact-item-icon">
                    <img src="/icons/@icon.png" alt="Phone" className="address-icon" />
                  </span>
                  <p className="contact-item-text">
                    Quezon City University, Novaliches, QC
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; EcoUrban</p>
      </div>
    </div>
  );
};

export default Home;