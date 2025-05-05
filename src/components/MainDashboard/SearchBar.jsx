import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';

const SearchBar = ({ onSearch, onClearSearch, isCollapsed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const suggestionBoxRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const formatDisplayName = (place) => {
    if (!place) return '';

    const addr = place.address || {};
    let primaryName = place.name || '';

    if (
      place.type === 'amenity' ||
      place.type === 'shop' ||
      place.type === 'building' ||
      place.type === 'leisure' ||
      place.type === 'office' ||
      place.type === 'education' ||
      place.class === 'amenity' ||
      place.class === 'building'
    ) {
      let specificLocation = primaryName;

      if (addr.road || addr.street) {
        const streetName = addr.road || addr.street;
        const streetNumber = addr.house_number || '';

        if (streetNumber && streetName) {
          specificLocation += `, ${streetNumber} ${streetName}`;
        } else if (streetName) {
          specificLocation += `, ${streetName}`;
        }
      }

      const district = addr.suburb || addr.neighbourhood || addr.district || '';
      const city =
        addr.city || addr.town || addr.village || addr.municipality || '';

      if (district && !specificLocation.includes(district)) {
        specificLocation += `, ${district}`;
      }

      if (city && !specificLocation.includes(city)) {
        specificLocation += `, ${city}`;
      }

      const region = addr.state || addr.province || '';

      if (region && !specificLocation.includes(region)) {
        specificLocation += `, ${region}`;
      }

      if (addr.country_code && addr.country_code.toUpperCase() === 'PH') {
        specificLocation += ', PHL';
      }

      return specificLocation;
    } else {
      let locationName = '';

      if (addr.city || addr.town || addr.village || addr.municipality) {
        locationName =
          addr.suburb || addr.neighbourhood || addr.district || primaryName;
        const cityName =
          addr.city || addr.town || addr.village || addr.municipality;

        if (!locationName.includes(cityName)) {
          locationName += `, ${cityName}`;
        }
      } else {
        locationName = primaryName;
      }

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
      const poiParams = new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: 'ph',
        limit: 10,
        addressdetails: 1,
        namedetails: 1,
        'accept-language': 'en',
        dedupe: 1,
      });

      const poiResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?${poiParams}`
      );
      const poiData = await poiResponse.json();

      if (query.length >= 3) {
        const amenityParams = new URLSearchParams({
          format: 'json',
          q: `${query}, Philippines`,
          addressdetails: 1,
          namedetails: 1,
          limit: 8,
          featuretype: 'amenity building shop office leisure education',
        });

        const amenityResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?${amenityParams}`
        );
        const amenityData = await amenityResponse.json();

        const generalParams = new URLSearchParams({
          format: 'json',
          q: `${query}, Philippines`,
          addressdetails: 1,
          namedetails: 1,
          limit: 5,
          featuretype:
            'city city_district suburb neighbourhood town village hamlet',
        });

        const generalResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?${generalParams}`
        );
        const generalData = await generalResponse.json();

        const combinedResults = [...poiData];

        amenityData.forEach((newItem) => {
          if (
            !combinedResults.some(
              (existingItem) => existingItem.place_id === newItem.place_id
            )
          ) {
            combinedResults.push(newItem);
          }
        });

        generalData.forEach((newItem) => {
          if (
            !combinedResults.some(
              (existingItem) => existingItem.place_id === newItem.place_id
            )
          ) {
            combinedResults.push(newItem);
          }
        });

        const formattedResults = combinedResults.map((place) => ({
          ...place,
          formatted_name: formatDisplayName(place),
        }));

        const nameSet = new Set();
        const validSuggestions = formattedResults.filter((item) => {
          if (!item.formatted_name || !item.lat || !item.lon) return false;

          if (nameSet.has(item.formatted_name)) return false;
          nameSet.add(item.formatted_name);

          return true;
        });

        validSuggestions.sort((a, b) => {
          const aIsSpecific =
            a.type === 'amenity' ||
            a.class === 'amenity' ||
            a.class === 'building';
          const bIsSpecific =
            b.type === 'amenity' ||
            b.class === 'amenity' ||
            b.class === 'building';

          if (aIsSpecific && !bIsSpecific) return -1;
          if (!aIsSpecific && bIsSpecific) return 1;

          return (b.importance || 0.5) - (a.importance || 0.5);
        });

        setSuggestions(validSuggestions.slice(0, 10));
      } else {
        const formattedResults = poiData.map((place) => ({
          ...place,
          formatted_name: formatDisplayName(place),
        }));

        const nameSet = new Set();
        const validSuggestions = formattedResults.filter((item) => {
          if (!item.formatted_name || !item.lat || !item.lon) return false;

          if (nameSet.has(item.formatted_name)) return false;
          nameSet.add(item.formatted_name);

          return true;
        });

        validSuggestions.sort(
          (a, b) => (b.importance || 0.5) - (a.importance || 0.5)
        );
        setSuggestions(validSuggestions.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSuggestions([]);

    try {
      const regularParams = new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: 'ph',
        limit: 10,
        addressdetails: 1,
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${regularParams}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        onSearch([parseFloat(lat), parseFloat(lon)]);
      } else {
        const broadParams = new URLSearchParams({
          format: 'json',
          q: `${query}, Philippines`,
          limit: 5,
          addressdetails: 1,
        });

        const broadResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?${broadParams}`
        );
        const broadData = await broadResponse.json();

        if (broadData.length > 0) {
          const { lat, lon } = broadData[0];
          onSearch([parseFloat(lat), parseFloat(lon)]);
        } else {
          alert(
            'Location not found in the Philippines. Please try another search.'
          );
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (place) => {
    setSearchQuery(place.formatted_name || place.display_name);
    setSuggestions([]);
    onSearch([parseFloat(place.lat), parseFloat(place.lon)]);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    onClearSearch();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return (
    <li className="search-bar-container" data-tooltip="Search Location">
      <img src="/icons/searchicon.png" alt="Search" className="search-icon" />
      {!isCollapsed && (
        <div className="search-bar-wrapper" ref={suggestionBoxRef}>
          <input
            type="text"
            placeholder="Search any Philippine location"
            className="search-input"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="search-spinner"></div>
              ) : (
                <img
                  src="/icons/clear.png"
                  alt="Clear"
                  className="clear-icon"
                />
              )}
            </button>
          )}

          {suggestions.length > 0 && (
            <ul className="sidebar-suggestions-list">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  className="sidebar-suggestion-item"
                >
                  {item.formatted_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

export default SearchBar;
