import React, { useState, useRef, useEffect } from "react";
import emailjs from "@emailjs/browser";
import styles from "./LoginRegister.module.css";

const ForgotPassword = ({ closeModal, goBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  const [passwordFocus, setPasswordFocus] = useState(false);
  
  // Password validation states
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    text: "",
    class: ""
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Clear timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const startCountdown = (expiryTime) => {
    if (timerRef.current) clearInterval(timerRef.current); // clear previous timer
  
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiryTime - Date.now());
      setRemainingTime(remaining);
  
      if (remaining === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        showPopup("OTP has expired. Please request a new one.", "error");
      }
    }, 1000);
  };
  
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const showPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => {
      setPopup({ show: false, message: "", type: "" });
    }, 4000);
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    setPasswordRequirements(requirements);
    
    // Calculate password strength
    const passedChecks = Object.values(requirements).filter(Boolean).length;
    
    if (passedChecks <= 2) {
      setPasswordStrength({ strength: 1, text: "Weak", class: "weak" });
    } else if (passedChecks <= 4) {
      setPasswordStrength({ strength: 2, text: "Medium", class: "medium" });
    } else {
      setPasswordStrength({ strength: 3, text: "Strong", class: "strong" });
    }
    
    return requirements;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      showPopup("Please enter your email address", "error");
      return;
    }
    setLoading(true);
    
    // Check if email exists in the database
    try {
      const response = await fetch('https://ecourban.onrender.com/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
  
      if (result.exists) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        const expiryTime = Date.now() + 5 * 60 * 1000;
        setOtpExpiryTime(expiryTime);

        const readableTime = new Date(expiryTime).toLocaleTimeString();
  
        const templateParams = {
          user_email: email,
          passcode: otp,
          time: readableTime, 
        };
  
        try {
          await emailjs.send("service_iysc2g7", "template_zywl0ik", templateParams, "c96TY5rqu6knfGW4j");
          showPopup("OTP sent to your email", "success");
          startCountdown(expiryTime);
          setOtpSent(true);
          setStep(2);
        } catch (error) {
          console.error("Failed to send OTP", error);
          showPopup("Failed to send OTP. Please try again.", "error");
        }
      } else {
        showPopup("Email not found. Please check your email address.", "error");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      showPopup("Error checking email. Please try again.", "error");
    }
    finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = (e) => {
    e.preventDefault();

    if (remainingTime === 0) {
      showPopup("OTP has expired. Please request a new one.", "error");
      return;
    }

    if (otp !== generatedOtp) {
      showPopup("Invalid OTP. Please try again.", "error");
      return;
    }

    showPopup("OTP verified successfully!", "success");
    setStep(3);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === "newPassword") {
      validatePassword(value);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
  
    // Validate password requirements
    const requirements = validatePassword(passwords.newPassword);
    const allRequirementsMet = Object.values(requirements).every(Boolean);
    
    if (!allRequirementsMet) {
      showPopup("Password doesn't meet all requirements", "error");
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      showPopup("Passwords don't match!", "error");
      return;
    }
  
    try {
      setLoading(true);
      const response = await fetch('https://ecourban.onrender.com/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword 
        }),
      });
  
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const result = await response.json();
  
      if (response.ok && result.message === 'Password reset successfully!') {
        showPopup("Your password has been reset successfully.", "success");
        setTimeout(() => {
          goBackToLogin();
        }, 2000);
      } else {
        showPopup(result.message || "Failed to reset password. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      showPopup("Error resetting password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target.className === styles.modalOverlay) {
        goBackToLogin();
      }
    }}>
      <div className={styles.forgotPasswordContainer}>
        <button className={styles.backButton} onClick={goBackToLogin}>
          <img 
            src="/icons/close.png" 
            alt="Back" 
            className={styles.backIcon}
          />
        </button>
        
        <h1>Reset Password</h1>
        
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <p>Enter your email address to receive your OTP</p>
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <button type="submit" disabled={loading || !email}>
              {loading ? (
                <div className={styles.loader}></div>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <p>We've sent an OTP to your email. Please enter it below.</p>
            <div className={styles.otpMessage}>
              OTP sent to: {email}
            </div>
            <input 
              type="text" 
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required 
              maxLength={6}
              className={styles.otpInput}
            />
            {remainingTime !== null && remainingTime > 0 && (
              <div className={styles.otpTimer}>OTP expires in: {formatTime(remainingTime)}</div>
            )}
            <button type="submit" disabled={!otp || otp.length < 6}>Verify OTP</button>
            <button 
              type="button" 
              className={styles.resendBtn}
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>
          </form>
        )}
        
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p>Create your new password</p>
            
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword.newPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                required 
                className={styles.largerDots}
              />
              <button 
                type="button" 
                className={styles.togglePassword} 
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                {showPassword.newPassword ? 
                  <img src="/icons/ayclose.png" alt="Hide" className={styles.eyeIcon} /> : 
                  <img src="/icons/ay.png" alt="Show" className={styles.eyeIcon} />
                }
              </button>
            </div>

            {passwordFocus && (
              <div className={styles.passwordRequirements}>
                <p>Password must have:</p>
                <ul>
                  <li className={passwordRequirements.length ? styles.valid : styles.invalid}>
                    At least 8 characters
                  </li>
                  <li className={passwordRequirements.uppercase ? styles.valid : styles.invalid}>
                    At least one uppercase letter (A-Z)
                  </li>
                  <li className={passwordRequirements.lowercase ? styles.valid : styles.invalid}>
                    At least one lowercase letter (a-z)
                  </li>
                  <li className={passwordRequirements.number ? styles.valid : styles.invalid}>
                    At least one number (0-9)
                  </li>
                  <li className={passwordRequirements.special ? styles.valid : styles.invalid}>
                    One special character (e.g., !@#$%^&*)
                  </li>
                </ul>
              </div>
            )}

            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                required 
                className={`${styles.largerDots} ${
                  passwords.confirmPassword && 
                  passwords.newPassword !== passwords.confirmPassword ? 
                  styles.errorInput : ""
                }`}
              />
              <button 
                type="button" 
                className={styles.togglePassword} 
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {showPassword.confirmPassword ? 
                  <img src="/icons/ayclose.png" alt="Hide" className={styles.eyeIcon} /> : 
                  <img src="/icons/ay.png" alt="Show" className={styles.eyeIcon} />
                }
              </button>
            </div>
            
            {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
              <div className={styles.errorText}>Passwords don't match</div>
            )}

            {passwordStrength.text && (
              <div className={styles.strengthBarContainer}>
                <div className={`${styles.strengthBar} ${styles[passwordStrength.class]}`}>
                  {passwordStrength.text}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !passwords.newPassword || !passwords.confirmPassword || 
                       passwords.newPassword !== passwords.confirmPassword ||
                       passwordStrength.strength < 2}
            >
              {loading ? <div className={styles.loader}></div> : "Reset Password"}
            </button>
          </form>
        )}

        {popup.show && (
          <div className={`${styles.popupMessage} ${styles[popup.type]}`}>
            {popup.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;