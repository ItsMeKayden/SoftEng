import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./PopupStyles.css"; // Make sure to create this CSS file for styles

const ChatbotPopup = ({ onClose, showResultPopup, setShowResultPopup, setShowChatbotPopup, darkMode }) => {
  const chatContentRef = useRef(null);

  const getGreeting = () => {
    const greetings = [
      "Hello! 👋 How can I help you today?",
      "Hi there! 😊 What would you like to know?",
      "Greetings! 🌟 I'm here to assist you.",
      "Hey! 🙌 Feel free to ask me anything.",
      "Welcome! 🎉 How can I assist you?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const [messages, setMessages] = useState([
    { sender: "bot", text: getGreeting() }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    // Scroll to the bottom of the chat content on message update
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    // Add user message to chat
    const userMessage = { sender: "user", text: newMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage(""); // Clear input immediately

    const userInputLower = newMessage.toLowerCase();

    // Check if the user is asking for weather
    if (userInputLower.includes("weather")) {
      const location = newMessage.replace(/.*weather in /i, "").trim(); // Extract location
      setLoading(true);

      try {
        const response = await axios.get('https://gis-chatbot-app.onrender.com/weather', {
          params: { location: location }
        });
        const weatherData = response.data;

        if (weatherData && weatherData.temperature !== undefined && weatherData.conditions && weatherData.location) {
          const weatherResponse = `Weather in ${weatherData.location}: ${weatherData.temperature.toFixed(1)}°C, ${weatherData.conditions}.`;
          setMessages(prevMessages => [...prevMessages, { sender: "bot", text: weatherResponse }]);
        } else if (weatherData && weatherData.error) {
          setMessages(prevMessages => [...prevMessages, { sender: "bot", text: `Sorry, could not get weather for that location. ${weatherData.error}` }]);
        }
        else {
          setMessages(prevMessages => [...prevMessages, { sender: "bot", text: "Sorry, I couldn't retrieve the weather data." }]);
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setMessages(prevMessages => [...prevMessages, { sender: "bot", text: "Sorry, I couldn't retrieve the weather data." }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Set loading state for chat responses
    setLoading(true);

    // Send message to Flask server for chat responses
    try {
      const response = await axios.post('https://gis-chatbot-app.onrender.com/chat', { message: newMessage });
      const botMessage = response.data.response;
      setMessages(prevMessages => [...prevMessages, { sender: "bot", text: botMessage }]);
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error?.response?.status
      });
      setMessages(prevMessages => [...prevMessages, { sender: "bot", text: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-popup-overlay">
      <div className={`profile-popup ${darkMode ? "dark-mode" : ""}`}>
        <div className="profile-panel" style={{ backgroundColor: "#41AB5D" }}>
          <div className="panel-left">
            <button
              className={showResultPopup ? "active" : ""}
              onClick={() => { setShowResultPopup(true); setShowChatbotPopup(false); }}
            >
              <img src="/icons/result.png" alt="Assessment Result" />
            </button>
            <button
              className="active" // Always active since we're in chatbot
              onClick={() => {}}
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

        <div className="chatbot-top-panel">
          CHATBOT
        </div>

        <div className="chat-content" ref={chatContentRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.sender === "bot" && <img src="/icons/chatbot.png" alt="Bot" className="chat-icon" />}
              <div className="chat-bubble" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div className="chat-bubble bouncing-animation">
                <span>T</span><span>y</span><span>p</span><span>i</span><span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
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
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading} // Disable input while loading
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