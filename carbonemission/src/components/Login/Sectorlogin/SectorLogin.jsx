import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SectorLogin = () => {
  const [loginData, setLoginData] = useState({ 
    sector_id: '', 
    sector_email: '', 
    password: '' 
  });
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otpData, setOtpData] = useState({ 
    otp: '', 
    newPassword: '' 
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [passwordRequestLoading, setPasswordRequestLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const navigate = useNavigate();

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try {
      const response = await fetch(`${apiBaseURL}/api/sector-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.needsPasswordSetup) {
          setShowOTPForm(true);
          setMessage('Password not set. Check email for OTP.');
        }
        throw new Error(data.error || 'Login failed');
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordRequest = async () => {
    setError('');
    setPasswordRequestLoading(true);
    try {
      const response = await fetch(`${apiBaseURL}/api/sector-request-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector_id: loginData.sector_id,
          sector_email: loginData.sector_email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Request failed');
      
      setShowOTPForm(true);
      setMessage('OTP sent to your email');
    } catch (err) {
      setError(err.message);
    } finally {
      setPasswordRequestLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordResetLoading(true);
    try {
      const response = await fetch(`${apiBaseURL}/api/sector-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector_email: loginData.sector_email,
          otp: otpData.otp,
          newPassword: otpData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Password reset failed');
      
      setMessage('Password created successfully! You can now login');
      setShowOTPForm(false);
      setLoginData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <div className="Admin-cont">
      <div className="log-main-cont">
        <h2>Sector Login</h2>

        {!showOTPForm ? (
          <form onSubmit={handleLogin} className="box-mai">
            <div className="inpu-box">
              <label>Sector ID:</label>
              <br />
              <input
                type="text"
                className="inpu"
                placeholder="Enter sector ID"
                value={loginData.sector_id}
                onChange={(e) => setLoginData({ ...loginData, sector_id: e.target.value })}
                required
              />
            </div>

            <div className="inpu-box">
              <label>Sector Email:</label>
              <br />
              <input
                type="email"
                className="inpu"
                placeholder="Enter sector email"
                value={loginData.sector_email}
                onChange={(e) => setLoginData({ ...loginData, sector_email: e.target.value })}
                required
              />
            </div>

            <div className="inpu-box">
              <label>Password:</label>
              <br />
              <input
                type="password"
                className="inpu"
                placeholder="Enter password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button 
              type="submit" 
              className={loginLoading ? 'loading' : ''}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : 'Login'}
            </button>

            <button 
              type="button" 
              onClick={handlePasswordRequest}
              className={`secondary-btn ${passwordRequestLoading ? 'loading' : ''}`}
              disabled={passwordRequestLoading}
            >
              {passwordRequestLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending OTP...
                </>
              ) : 'Create Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="box-mai">
            <div className="inpu-box">
              <label>OTP Code:</label>
              <br />
              <input
                type="text"
                className="inpu"
                placeholder="Enter OTP from email"
                value={otpData.otp}
                onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                required
              />
            </div>

            <div className="inpu-box">
              <label>New Password:</label>
              <br />
              <input
                type="password"
                className="inpu"
                placeholder="Enter new password (min 8 chars)"
                value={otpData.newPassword}
                onChange={(e) => setOtpData({ ...otpData, newPassword: e.target.value })}
                minLength="8"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button 
              type="submit" 
              className={passwordResetLoading ? 'loading' : ''}
              disabled={passwordResetLoading}
            >
              {passwordResetLoading ? (
                <>
                  <span className="spinner"></span>
                  Setting Password...
                </>
              ) : 'Set Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SectorLogin;