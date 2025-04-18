import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
// import './Adminlogin.css'; 

const AdministratorLogin = () => {
  const [credentials, setCredentials] = useState({
    administrator_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getApiBaseUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000'
      : `http://${window.location.hostname}:5000`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/administrator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      window.location.href = '/';

    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Admin-cont">
      <div className="log-main-cont">
        <h2>Mine Administrator Login</h2>

        <form onSubmit={handleLogin} className='box-mai'>
          <div className='inpu-box'>
            <label>Administrator ID:</label>
            <br />
            <input
              type="text"
              value={credentials.administrator_id}
              onChange={(e) => setCredentials({ 
                ...credentials, 
                administrator_id: e.target.value 
              })}
              placeholder="Enter administrator ID"
              className='inpu'
              required
              autoFocus
            />
          </div>

          <div className='inpu-box'>
            <label>Password:</label>
            <br />
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ 
                ...credentials, 
                password: e.target.value 
              })}
              placeholder="Enter your password"
              className='inpu'
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={loading ? 'loading' : ''}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : 'Login'}
          </button>

          <div className="signup-link">
            <NavLink to='/administratorsignup'>
              Don't have an account? Register here
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdministratorLogin;