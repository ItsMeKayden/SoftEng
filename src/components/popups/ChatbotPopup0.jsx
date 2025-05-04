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
    setLoading(true);

    try {
      // Changed API endpoint to localhost for local development
      const response = await axios.post('https://gis-chatbot-app.onrender.com/chat', { message: newMessage });
      const botMessage = response.data.response;
      setMessages(prevMessages => [...prevMessages, { sender: "bot", text: botMessage }]);
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error?.response?.status
      });

      let errorMessage = "Sorry, something unexpected went wrong.";
      if (error.response) {
        switch (error.response.status) {
          case 500:
            errorMessage = "Sorry, the server encountered an error while processing your request.";
            break;
          case 502:
            errorMessage = "Sorry, the chatbot service is temporarily unavailable. Please try again later.";
            break;
          case 400:
            errorMessage = "Sorry, your request was not understood by the server.";
            break;
          case 404:
            errorMessage = "Sorry, the chatbot service endpoint could not be found.";
            break;
          default:
            errorMessage = `Sorry, an error occurred (HTTP status ${error.response.status}).`;
        }
      } else if (error.request) {
        errorMessage = "Sorry, there was a network error. Please check your internet connection and try again.";
      } else {
        errorMessage = `Sorry, an error occurred: ${error.message}`;
      }

      setMessages(prevMessages => [...prevMessages, { sender: "bot", text: errorMessage }]);
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
              <div className="chat-bubble">Typing...</div>
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