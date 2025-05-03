import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginRegister.module.css";
import ForgotPassword from "./ForgotPassword";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const LoginRegister = ({ closeModal }) => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  
  // Loading states for buttons
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  
  // Create ref for password popup
  const passwordPopupRef = useRef(null);

  // Error states
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [adminPasswordErrors, setAdminPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false
  });

  // Password touched states to track if user has interacted with fields
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [adminPasswordTouched, setAdminPasswordTouched] = useState(false);

  // Success message state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Separate states for admin and regular login
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });

  const [userCredentials, setUserCredentials] = useState({
    email: '',
    password: '',
    role: ''
  });

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState({
    adminPassword: false,
    userPassword: false,
    registerPassword: false,
    confirmPassword: false
  });

  // State for the Admin button label
  const [adminButtonLabel, setAdminButtonLabel] = useState('Admin');
  // State for the Toggle Container content
  const [toggleContainerContent, setToggleContainerContent] = useState({
    leftTitle: 'Welcome!',
    leftDescription: 'Enter your personal details to use all of site features',
    leftButtonText: 'Sign In',
    rightTitle: 'Hey!',
    rightDescription: 'Register with your personal details to use all of site features',
    rightButtonText: 'Sign Up'
  });

  // Validate password function
  const validatePassword = (password) => {
    return {
      length: password.length < 8,
      uppercase: !/[A-Z]/.test(password),
      lowercase: !/[a-z]/.test(password),
      number: !/[0-9]/.test(password),
      symbol: !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  };

  // Check if password has any validation errors
  const hasPasswordErrors = (errors) => {
    return Object.values(errors).some(error => error);
  };

  // Update password errors when password changes
  useEffect(() => {
    if (passwordTouched) {
      setPasswordErrors(validatePassword(password));
    }
  }, [password, passwordTouched]);

  // Update confirm password error when either password changes
  useEffect(() => {
    if (confirmPasswordTouched) {
      setConfirmPasswordError(password !== confirmPassword);
    }
  }, [password, confirmPassword, confirmPasswordTouched]);

  // Update admin password errors when admin password changes
  useEffect(() => {
    if (adminPasswordTouched) {
      setAdminPasswordErrors(validatePassword(adminCredentials.password));
    }
  }, [adminCredentials.password, adminPasswordTouched]);

  // Add event listener to detect clicks outside password popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (passwordPopupRef.current && 
          !passwordPopupRef.current.contains(event.target) && 
          !event.target.classList.contains('passwordInput')) {
        // Reset the focused field to close password popup
        setFocusedField(null);
      }
    }

    // Add the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Remove the event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const toggleForm = () => {
    setIsActive(!isActive);
    // Clear error messages when switching forms
    setLoginError('');
    setRegisterError('');
    // Reset touched states
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setAdminPasswordTouched(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); // Clear previous errors
    setLoginLoading(true); // Start loading

    try {
      const res = await axios.post("https://ecourban.onrender.com/login", userCredentials);

      if (res.data.success) {
        // Save user info (email, role, etc.)
        localStorage.setItem("user", JSON.stringify({
          email: res.data.email,
          role: res.data.role,
          userId: res.data.email, // Add userId if provided by backend
          timestamp: new Date().toISOString() // Add login timestamp
        }));

        const storedUser = JSON.parse(localStorage.getItem("user"));
        console.log("Stored user data:", storedUser);

        // Show success popup instead of alert
        setSuccessMessage("Login successful!");
        setShowSuccessPopup(true);

        // Clear form fields
        setUserCredentials({
          email: '',
          password: '',
          role: ''
        });

        // Close the modal with login status after a delay
        setTimeout(() => {
          closeModal(true); // Pass true to indicate successful login
        }, 2000);
      } else {
        setLoginError(res.data.message || "Invalid email or password");
      }
    } catch (err) {
      setLoginError("Invalid email or password");
      console.error("Login error:", err);
    } finally {
      setLoginLoading(false); // Stop loading regardless of outcome
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(''); // Clear previous errors
    setRegisterLoading(true); // Start loading

    // Check password security requirements
    const passwordIssues = validatePassword(password);
    if (hasPasswordErrors(passwordIssues)) {
      setPasswordTouched(true);
      setPasswordErrors(passwordIssues);
      setRegisterError("Please fix password security issues before registering.");
      setRegisterLoading(false); // Stop loading if validation fails
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      setRegisterError("Passwords do not match!");
      setRegisterLoading(false); // Stop loading if validation fails
      return;
    }

    const userData = {
      email,
      password,
      role
    };

    try {
      const result = await axios.post('https://ecourban.onrender.com/register', userData);
      console.log("Register result:", result.data);

      // Show success popup
      setSuccessMessage("Registration successful!");
      setShowSuccessPopup(true);

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('');
      setPasswordTouched(false);
      setConfirmPasswordTouched(false);

      // We don't auto-login after registration
    } catch (err) {
      console.log("Register error:", err);
      setRegisterError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setRegisterLoading(false); // Stop loading regardless of outcome
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoginLoading(true); // Start loading
  
    try {
      console.log("Admin credentials:", adminCredentials);
  
      const res = await axios.post("https://ecourban.onrender.com/admin-login", adminCredentials);
  
      if (res.data.success) {
        localStorage.setItem("admin", JSON.stringify({
          username: res.data.username,
          password: res.data.password
        }));
  
        setSuccessMessage("Admin login successful!");
        setShowSuccessPopup(true);
  
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 2000);
      } else {
        setAdminLoginError(res.data.message || "Admin login failed");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setAdminLoginError("Incorrect Credentials!");
    } finally {
      setAdminLoginLoading(false); // Stop loading regardless of outcome
    }
  };

  const toggleAdminMode = () => {
    setIsAdminLogin(!isAdminLogin);
    // Clear inputs and errors when switching modes
    setAdminCredentials({ username: '', password: '' });
    setUserCredentials({ email: '', password: '', role: '' });
    setLoginError('');
    setAdminLoginError('');
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setAdminPasswordTouched(false);
    // Toggle the label of the Admin button
    setAdminButtonLabel(prevLabel => prevLabel === 'Admin' ? 'User' : 'Admin');
    // Update Toggle Container content for Admin mode
    setToggleContainerContent(prevContent => ({
      leftTitle: 'Admin Access',
      leftDescription: 'Enter your admin credentials to proceed',
      leftButtonText: 'Sign In',
      rightTitle: 'Not an Admin?',
      rightDescription: 'Switch back to user login',
      rightButtonText: 'Switch to User'
    }));
    // If switching back to user mode, revert the toggle container content
    if (isAdminLogin) {
      setToggleContainerContent({
        leftTitle: 'Welcome!',
        leftDescription: 'Enter your personal details to use all of site features',
        leftButtonText: 'Sign In',
        rightTitle: 'Hey!',
        rightDescription: 'Register with your personal details to use all of site features',
        rightButtonText: 'Sign Up'
      });
    }
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setAdminPasswordTouched(true);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);

    // Check if we have a logged in user
    const user = localStorage.getItem("user");
    if (user) {
      closeModal(true); // Close with login status = true
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const credentialResponseDecoded = jwtDecode(credentialResponse.credential);

    fetch("https://ecourban.onrender.com/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentialResponseDecoded)
    })
    .then(res => res.json())
    .then(data => {
      console.log("User saved or found:", data);

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify({
        email: credentialResponseDecoded.email,
        name: credentialResponseDecoded.name,
        role: "user" // Default role for Google sign-in
      }));

      // Show success message
      setSuccessMessage("Google sign-in successful!");
      setShowSuccessPopup(true);

      // Close modal with login status after delay
      setTimeout(() => {
        closeModal(true); // Pass true to indicate successful login
      }, 2000);
    })
    .catch(err => {
      console.error("Error saving Google user:", err);
      setLoginError("Google sign-in failed");
    });
  };

  const renderPasswordRequirements = (errors, touched, focused) => {
    if (!touched) return null;
    
    // Check if all requirements are met
    const allRequirementsMet = !hasPasswordErrors(errors);
    
    // When all requirements are met, return just a simple success message (no popup)
    if (allRequirementsMet) {
      return <p className={styles.successText}>Strong Password!</p>;
    }
    
    // Only show the requirements popup when focused and there are errors
    if (focused) {
      return (
        <div className={styles.passwordPopup} ref={passwordPopupRef}>
          <div className={styles.passwordRequirements}>
            <p className={styles.requirementsTitle}>Password must have:</p>
            <ul>
              <li className={errors.length ? styles.invalid : styles.valid}>
                At least 8 characters
              </li>
              <li className={errors.uppercase ? styles.invalid : styles.valid}>
                At least one uppercase letter (A-Z)
              </li>
              <li className={errors.lowercase ? styles.invalid : styles.valid}>
                At least one lowercase letter (a-z)
              </li>
              <li className={errors.number ? styles.invalid : styles.valid}>
                At least one number (0-9)
              </li>
              <li className={errors.symbol ? styles.invalid : styles.valid}>
                At least one special character (!@#$%^&*)
              </li>
            </ul>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      <div className={`${styles.container} ${isActive ? styles.active : ""}`} id="container">
        <button
          className={styles.adminBtn0}
          onClick={toggleAdminMode}
        >
          <img
            src="/icons/profile.png"
            alt={adminButtonLabel === 'Admin' ? "Admin login" : "User login"}
            className={styles.adminIcon0}
          />
          <span className={styles.adminLabel}>{adminButtonLabel}</span>
        </button>

        {/* Sign Up Form */}
        <div className={`${styles.formContainer} ${styles.signUp}`}>
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <button type="button" className={styles.googleBtn}>
              <GoogleLogin
                onSuccess={credentialResponse => {
                  handleGoogleSuccess(credentialResponse);
                }}
                onError={() => {
                  setRegisterError('Google Sign Up failed');
                }}
                render={renderProps => (
                  <button
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                    type="button"
                    className={`${styles.googleBtn} ${styles.customGoogle}`}
                  >
                    <img
                      src="/icons/google.webp"
                      alt="Google logo"
                      className={styles.googleIcon}
                    />
                    Sign up with Google
                  </button>
                )}
              />
            </button>
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              placeholder="Email Address"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className={styles.inputGroup}>
              <div className={`${styles.passwordWrapper} ${passwordTouched && hasPasswordErrors(passwordErrors) ? styles.errorInput : ""}`}>
                <input
                  type={showPassword.registerPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    setPasswordTouched(true);
                    setFocusedField('password');
                  }}
                  required
                  className={`${styles.largerDots} passwordInput ${passwordTouched && hasPasswordErrors(passwordErrors) ? styles.errorInput : ""}`}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => togglePasswordVisibility('registerPassword')}
                >
                  {showPassword.registerPassword ?
                    <img src="/icons/ayclose.png" alt="Hide" className={styles.eyeIcon} /> :
                    <img src="/icons/ay.png" alt="Show" className={styles.eyeIcon} />
                  }
                </button>
              </div>
              {renderPasswordRequirements(passwordErrors, passwordTouched, focusedField === 'password')}
            </div>

            <div className={styles.inputGroup}>
              <div className={`${styles.passwordWrapper} ${confirmPasswordTouched && confirmPasswordError ? styles.errorInput : ""}`}>
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => {
                  setConfirmPasswordTouched(true);
                  setFocusedField('confirmPassword');
                }}
                required
                className={`${styles.largerDots} passwordInput ${confirmPasswordTouched && confirmPasswordError ? styles.errorInput : ""}`}
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
              {confirmPasswordTouched && focusedField === 'confirmPassword' && confirmPasswordError && (
                <p className={styles.errorText}>Passwords do not match</p>
              )}
            </div>

            {/* Role Dropdown */}
            <div className={styles.selectWrapper}>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={styles.roleSelect}
                required
              >
                <option value="">Select Role</option>
                <option value="Urban Planner">Urban Planner</option>
                <option value="Student">Student</option>
                <option value="Farmer">Farmer</option>
                <option value="Others">Others</option>
              </select>
              <div className={styles.dropdownIcon}>
                <img src="/icons/dropdown0.png" alt="Dropdown arrow" />
              </div>
            </div>

            {/* Registration error message */}
            {registerError && <p className={styles.errorMessage}>{registerError}</p>}

            <button type="submit" disabled={
              registerLoading ||
              hasPasswordErrors(passwordErrors) || 
              confirmPasswordError || 
              !email || 
              !password || 
              !confirmPassword || 
              !role
            }>
              {registerLoading ? (
                <div className={styles.loader}></div>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>

        {/* Sign In Form - Modified */}
        <div className={`${styles.formContainer} ${styles.signIn}`}>
          <form onSubmit={isAdminLogin ? handleAdminLogin : handleLogin}>
            <h1>{isAdminLogin ? "Sign In as Admin" : "Sign In"}</h1>

            {!isAdminLogin && (
              <>
                <button type="button" className={styles.googleBtn}>
                  <GoogleLogin
                    onSuccess={credentialResponse => {
                      handleGoogleSuccess(credentialResponse);
                    }}
                    onError={() => {
                      console.log("❌ Google Sign Up failed");
                    }}
                    render={renderProps => (
                      <button
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                        type="button"
                        className={`${styles.googleBtn} ${styles.customGoogle}`}
                      >
                        <img 
                          src="/icons/google.webp" 
                          alt="Google logo" 
                          className={styles.googleIcon}
                        />
                        Sign in with Google
                      </button>
                    )}
                  />
                </button>
                <div className={styles.divider}>
                  <span>OR</span>
                </div>
              </>
            )}
            
            {isAdminLogin ? (
              <>
                <input
                  type="text"
                  name="username"
                  value={adminCredentials.username}
                  onChange={handleAdminChange}
                  placeholder="Admin Username"
                  required
                />

                <div className={styles.inputGroup}>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword.adminPassword ? "text" : "password"}
                      name="password"
                      value={adminCredentials.password}
                      onChange={handleAdminChange}
                      placeholder="Admin Password"
                      required
                      className={`${styles.largerDots} passwordInput`}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => togglePasswordVisibility('adminPassword')}
                    >
                      {showPassword.adminPassword ?
                        <img src="/icons/ayclose.png" alt="Hide" className={styles.eyeIcon} /> :
                        <img src="/icons/ay.png" alt="Show" className={styles.eyeIcon} />
                      }
                    </button>
                  </div>
                </div>
                
                {adminLoginError && <p className={styles.errorMessage}>{adminLoginError}</p>}
              </>
            ) : (
              <>
                <input
                  type="email"
                  name="email"
                  value={userCredentials.email}
                  onChange={handleUserChange}
                  placeholder="Email Address"
                  required
                />

                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword.userPassword ? "text" : "password"}
                    name="password"
                    value={userCredentials.password}
                    onChange={handleUserChange}
                    placeholder="Password"
                    required
                    className={`${styles.largerDots} passwordInput`}
                    onFocus={() => setFocusedField('userPassword')}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility('userPassword')}
                  >
                    {showPassword.userPassword ?
                      <img src="/icons/ayclose.png" alt="Hide" className={styles.eyeIcon} /> :
                      <img src="/icons/ay.png" alt="Show" className={styles.eyeIcon} />
                    }
                  </button>
                </div>
                
                {loginError && <p className={styles.errorMessage}>{loginError}</p>}
                
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}>
                  Forgot your password?
                </a>
              </>
            )}

            <button type="submit" disabled={
              (isAdminLogin ? adminLoginLoading : loginLoading) ||
              (isAdminLogin ? 
                !adminCredentials.username || !adminCredentials.password : 
                !userCredentials.email || !userCredentials.password)
            }>
              {isAdminLogin ? 
                (adminLoginLoading ? <div className={styles.loader}></div> : "Sign In") : 
                (loginLoading ? <div className={styles.loader}></div> : "Sign In")}
            </button>
          </form>
        </div>

        {/* Toggle Container */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <h1>{toggleContainerContent.leftTitle}</h1>
              <p>{toggleContainerContent.leftDescription}</p>
              <button className={styles.hidden} id="login" onClick={toggleForm}>
                {toggleContainerContent.leftButtonText}
              </button>
            </div>
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <h1>{toggleContainerContent.rightTitle}</h1>
              <p>{toggleContainerContent.rightDescription}</p>
              <button className={styles.hidden} id="register" onClick={() => {
                if (isAdminLogin) {
                  toggleAdminMode(); // Switch back to user mode
                  setIsActive(false); // Show the sign-in side
                } else {
                  toggleForm(); // Normal toggle between sign in and sign up
                }
              }}>
                {toggleContainerContent.rightButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className={styles.successPopupOverlay}>
          <div className={styles.successPopup}>
            <div className={styles.successHeader}>
              <img src="/icons/success.png" alt="Success" className={styles.successIcon} />
              <h2>Success!</h2>
            </div>
            <p>{successMessage}</p>
            <button onClick={closeSuccessPopup} className={styles.successButton}>OK</button>
          </div>
        </div>
      )}

      {/* Render Forgot Password as overlay */}
      {showForgotPassword && (
        <ForgotPassword
          closeModal={closeModal}
          goBackToLogin={handleBackToLogin}
        />
      )}
    </>
  );
};

export default LoginRegister;