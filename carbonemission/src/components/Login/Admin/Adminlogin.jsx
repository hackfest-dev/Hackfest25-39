import React, { useState } from 'react';
import './Adminlogin.css';

const Adminlogin = () => {
  const [inputs, setInputs] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiBaseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : `http://${window.location.hostname}:5000`;

      const response = await fetch(`${apiBaseURL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      // Force full page reload to update navbar state
      window.location.reload();

      window.location.href = '/';

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Admin-cont">
      <div className="log-main-cont">
        <h2>Welcome, Admin</h2>

        <form onSubmit={handleSubmit} className='box-mai'>
          <div className='inpu-box'>
            <label>Admin id:</label> 
            <br />
            <input 
              type="text" 
              value={inputs.username}
              onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
              placeholder="Enter admin id" 
              className='inpu'
              required
              autoFocus
            />
          </div>

          <div className='inpu-box'>
            <label>Admin password:</label> 
            <br />
            <input 
              type="password" 
              value={inputs.password}
              onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
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
        </form>
      </div>
    </div>
  );
};

export default Adminlogin;