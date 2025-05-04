import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './Context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="878909102028-mrj31atpdtuahqth5iaraj9jps0i1tok.apps.googleusercontent.com">
    <ThemeProvider>
      <App />
    </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
