import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './PopupStyles.css';

const ChatbotPopup = ({
  onClose,
  showResultPopup,
  setShowResultPopup,
  setShowChatbotPopup,
  darkMode,
}) => {
  const chatContentRef = useRef(null);

  const getGreeting = () => {
    const greetings = [
      'Hello! 👋 How can I help you today?',
      'Hi there! 😊 What would you like to know?',
      "Greetings! 🌟 I'm here to assist you.",
      'Hey! 🙌 Feel free to ask me anything.',
      'Welcome! 🎉 How can I assist you?',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const [messages, setMessages] = useState([
    { sender: 'bot', text: getGreeting() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  const locationPatterns = [
    /is (.*?) suitable for green infrastructure/i,
    /can we build green infrastructure in (.*?)\??/i,
    /assess (.*?) for green development/i,
    /evaluate (.*?) for infrastructure/i,
    /check (.*?) for green infrastructure/i,
    /analyze (.*?) for development/i,
    /how suitable is (.*?) for green infrastructure/i,
    /is (.*?) good for green infrastructure/i,
    /can (.*?) support green infrastructure/i,
    /green infrastructure in (.*?)(?:\?|$)/i,
    /green infrastructure of (.*?)(?:\?|$)/i,
    /suggest locations for green infrastructure/i,
    /recommend places for green infrastructure/i,
    /where (can|should) we build green infrastructure/i,
    /best (places|locations) for green infrastructure/i,
    /suitable (places|locations) for green development/i
  ];

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage = { sender: 'user', text: newMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage("");
    setLoading(true);

    try {
      // Check for recommendation request
      if (newMessage.toLowerCase().match(/(recommend|suggest|best|suitable) (locations?|places?) for green infrastructure/i)) {
        const response = await axios.get(
          "https://gis-chatbot-app.onrender.com/recommend-locations"
        );
  
        if (response.data.recommendations && response.data.recommendations.length > 0) {
          // Initial response
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              sender: "bot", 
              text: "Based on current weather conditions, here are the recommended locations for green infrastructure:" 
            }
          ]);
  
          // Format recommendations with icons and details
          const recommendationsText = response.data.recommendations
  .map(rec => {
    const scoreEmoji = rec.score >= 80 ? '🌟' : '✅';
    const riskIcons = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };
    
    const timestamp = new Date(rec.timestamp).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${scoreEmoji} ${rec.location} (Score: ${rec.score}/100)
${rec.score >= 80 ? '⭐ Highly Recommended' : '✔️ Recommended'}

Risk Assessment:
${riskIcons[rec.risks.flooding]} Flooding Risk: ${rec.risks.flooding}
${riskIcons[rec.risks.rainfall]} Rainfall Risk: ${rec.risks.rainfall}
${riskIcons[rec.risks.heat_index]} Heat Index Risk: ${rec.risks.heat_index}

Current Weather:
🌡️ Temperature: ${rec.current_conditions.temperature}°C
💧 Humidity: ${rec.current_conditions.humidity}%
🌧️ Rain: ${rec.current_conditions.precipitation}mm (${rec.current_conditions.precipProbability}% chance)

Last Updated: ${timestamp}
───────────────`;
  })
  .join('\n\n');
  
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: recommendationsText }
          ]);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              sender: "bot", 
              text: "I couldn't find any suitable locations at the moment. Please try again later." 
            }
          ]);
        }
        return; // Exit after handling recommendations
      }
  
      // Handle location assessment
      let location = null;
      for (const pattern of locationPatterns) {
        const match = newMessage.match(pattern);
        if (match) {
          location = match[1].trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .replace(/\s+/g, ' ');
          break;
        }
      }
  
      if (location) {
      const response = await axios.post(
        "https://gis-chatbot-app.onrender.com/predict-location",
        { 
          location: location,
          risks: {
            flooding: "low",
            rainfall: "medium", 
            heat_index: "medium"
          }
        }
      );
  
        // Enhanced response formatting
        const suitabilityEmoji = response.data.suitable ? '✅' : '⚠️';
        const timestamp = new Date(response.data.timestamp).toLocaleString();
        const botMessage = `${suitabilityEmoji} ${response.data.message}\n(Assessment based on data from: ${timestamp})`;
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: botMessage },
        ]);

        if (response.data.current_conditions) {
          const conditions = `Current Weather Conditions:\n` +
            `Temperature: ${response.data.current_conditions.temperature}°C\n` +
            `Humidity: ${response.data.current_conditions.humidity}%\n` +
            `Precipitation: ${response.data.current_conditions.precipitation}mm\n` +
            `Precipitation Probability: ${response.data.current_conditions.precipProbability}%`;
          
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: "bot", text: conditions },
            ]);
          }
        // Detailed weather conditions
        if (response.data.thresholds) {
          const riskEmojis = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
          };
  
          const conditions = `Current Risk Levels:\n` +
            `${riskEmojis[response.data.thresholds.flooding]} Flooding: ${response.data.thresholds.flooding}\n` +
            `${riskEmojis[response.data.thresholds.rainfall]} Rainfall: ${response.data.thresholds.rainfall}\n` +
            `${riskEmojis[response.data.thresholds.heat_index]} Heat Index: ${response.data.thresholds.heat_index}`;
          
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: "bot", text: conditions },
          ]);
        }
      } else {
        // Default chatbot behavior for other questions
        const response = await axios.post(
          'https://gis-chatbot-app.onrender.com/chat',
          { message: newMessage }
        );
        const botMessage = response.data.response;
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: botMessage },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.response?.status === 404 
        ? `Sorry, I couldn't find data for that location. Please check the spelling or try another location.`
        : `Sorry, I couldn't assess that location. Please try again later.`;
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-popup-overlay">
      <div className={`profile-popup ${darkMode ? 'dark-mode' : ''}`}>
        <div className="profile-panel" style={{ backgroundColor: '#41AB5D' }}>
          <div className="panel-left">
            <button
              className={showResultPopup ? 'active' : ''}
              onClick={() => {
                setShowResultPopup(true);
                setShowChatbotPopup(false);
              }}
            >
              <img src="/icons/result.png" alt="Assessment Result" />
            </button>
            <button className="active" onClick={() => {}}>
              <img src="/icons/chatbot.png" alt="Chat Bot" />
            </button>
          </div>
          <div className="panel-right">
            <button onClick={onClose}>
              <img src="/icons/close.png" alt="Close" className="close-icon" />
            </button>
          </div>
        </div>

        <div className="chatbot-top-panel">CHATBOT</div>

        <div className="chat-content" ref={chatContentRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <img src="/icons/chatbot.png" alt="Bot" className="chat-icon" />
              )}
              <div className="chat-bubble" style={{ whiteSpace: 'pre-line' }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div className="chat-bubble bouncing-animation">
                <span>T</span>
                <span>y</span>
                <span>p</span>
                <span>i</span>
                <span>n</span>
                <span>g</span>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <div className="chat-input">
            <input
              type="text"
              placeholder="Enter your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <button onClick={handleSendMessage} disabled={loading}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPopup;
