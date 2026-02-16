// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {


  
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        setLoading(true);
        setApiError('');
        
        const response = await fetch('http://localhost:8080/api/tenant-details', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTenantData(data);
          setShowLogin(true);
          setShowRegistration(false);
          setApiError('');
        } else {
          // Get the actual error message from response
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
          }
          
          setApiError(errorMessage);
          setTenantData(null);
          setShowLogin(false);
          setShowRegistration(true);
        }
      } catch (err) {
        // Network error or server not reachable
        console.error('Network error:', err);
        setApiError(`Network Error: ${err.message}. Make sure the server is running at https://psychic-carnival-4jqrv4wjr44vh5rv9-8080.app.github.dev`);
        setTenantData(null);
        setShowLogin(false);
        setShowRegistration(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantInfo();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Loading EstateCRM...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {apiError && showRegistration && (
        <div className="api-error-banner">
          <div className="api-error-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
            <div>
              <strong>API Connection Status:</strong> {apiError}
            </div>
          </div>
        </div>
      )}
      
      {showLogin && tenantData ? (
        <LoginPage tenantData={tenantData} />
      ) : showRegistration ? (
        <RegistrationPage apiError={apiError} />
      ) : null}
    </div>
  );
};

// Login Page Component
const LoginPage = ({ tenantData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      // Add actual login API call here
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      window.location.href = '/dashboard';
      
    } catch (err) {
      setLoginError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">
              {tenantData.logo ? (
                <img src={tenantData.logo} alt={tenantData.name} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )}
            </div>
            <h1 className="brand-title">Welcome back to</h1>
            <h2 className="brand-subtitle">{tenantData.name}</h2>
            
            <div className="brand-details">
              <div className="detail-item">
                <span className="detail-label">Your CRM Domain</span>
                <span className="detail-value">
                  {tenantData.subdomain}.estatecrm.com
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Current Plan</span>
                <span className="detail-value plan-badge">
                  {tenantData.plan}
                  {tenantData.trialActive && (
                    <span className="trial-indicator">Trial</span>
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-badge status-${tenantData.status}`}>
                  {tenantData.status}
                </span>
              </div>
            </div>

            {tenantData.trialActive && (
              <div className="trial-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <strong>Trial ends in:</strong>
                  <span>
                    {Math.ceil((new Date(tenantData.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Sign in to your account</h2>
              <p>Welcome back! Please enter your details</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              {loginError && (
                <div className="error-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                  {loginError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Having trouble signing in? <a href="/support">Contact support</a>
              </p>
            </div>

            <div className="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Secured by enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Registration Page Component
const RegistrationPage = ({ apiError }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const [logo, setLogo] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo size should be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Company name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      return 'Please enter a valid email address';
    }
    if (!logo) return 'Company logo is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('logo', logo);

    try {
      console.log('Sending registration request to:', 'http://localhost:8080/api/tenants/register');
      
      const response = await fetch('http://localhost:8080/api/tenants/register', {
        method: 'POST',
        body: submitData
      });

      // Try to get error message from response
      let errorMessage = 'Registration failed';
      try {
        const responseData = await response.json();
        if (!response.ok) {
          errorMessage = responseData.message || responseData.error || `HTTP Error ${response.status}`;
        } else {
          setSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
      } catch (jsonError) {
        errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to connect to server. Make sure the server is running at https://psychic-carnival-4jqrv4wjr44vh5rv9-8080.app.github.dev');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="success-state-large">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Registration Successful!</h2>
            <p>Thank you for registering with EstateCRM.</p>
            <p className="redirect-message">Redirecting to login page...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>EstateCRM</span>
          </div>
          <h2>Get started with your CRM</h2>
          <p>Join 500+ real estate agencies using EstateCRM</p>
        </div>

        {/* Show API Error if any */}
        {apiError && (
          <div className="api-error-details">
            <h4>API Connection Details:</h4>
            <p>{apiError}</p>
            <p className="api-error-help">
              Make sure your backend server is running at <strong>https://psychic-carnival-4jqrv4wjr44vh5rv9-8080.app.github.dev</strong>
            </p>
          </div>
        )}

        <div className="registration-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Company Logo <span className="required">*</span></label>
              <div className="logo-upload">
                <div className="logo-preview">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  )}
                </div>
                <div className="upload-controls">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    hidden
                  />
                  <label htmlFor="logo" className="btn btn-outline">
                    Choose Logo
                  </label>
                  <span className="file-name">
                    {logo ? logo.name : 'No file chosen'}
                  </span>
                </div>
              </div>
              <small>Maximum file size: 2MB</small>
            </div>

            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Luxury Homes Realty"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                'Register Your CRM'
              )}
            </button>

            <div className="trial-info">
              ✓ 14-day free trial included • ✓ Cancel anytime • ✓ No credit card required
            </div>
          </form>
        </div>

        <div className="registration-footer">
          <p>Already have an account? <a href="#" onClick={() => window.location.reload()}>Sign in</a></p>
        </div>
      </div>
    </div>
  );
};

export default App;