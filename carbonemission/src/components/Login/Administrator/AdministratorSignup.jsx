import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdministratorSignup = () => {
  const [formData, setFormData] = useState({
    administrator_id: '',
    mine_name: '',
    mine_location: '',
    mine_type: '',
    password: '',
    confirm_password: '',
    license: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.password !== formData.confirm_password) {
        throw new Error("Passwords don't match");
      }

      const formPayload = new FormData();
      formPayload.append('administrator_id', formData.administrator_id);
      formPayload.append('mine_name', formData.mine_name);
      formPayload.append('mine_location', formData.mine_location);
      formPayload.append('mine_type', formData.mine_type);
      formPayload.append('password', formData.password);
      formPayload.append('license', formData.license);

      const getApiBaseUrl = () => {
        return window.location.hostname === 'localhost' 
          ? 'http://localhost:5000'
          : `http://${window.location.hostname}:5000`;
      };
      
      const response = await fetch(`${getApiBaseUrl()}/api/administrator/signup`, {
        method: 'POST',
        body: formPayload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      alert('Registration submitted for approval!');
      navigate('/');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);  
    }
  };

  return (
    <div className="Admin-cont">
      <div className="log-main-cont">
        <h2>Mine Administrator Registration</h2>
        
        <form onSubmit={handleSubmit} className="box-mai" encType="multipart/form-data">
          <div className="inpu-box">
            <label>Administrator ID:</label>
            <br />
            <input
              type="text"
              className="inpu"
              value={formData.administrator_id}
              onChange={(e) => setFormData({ ...formData, administrator_id: e.target.value })}
              required
            />
          </div>

          <div className="inpu-box">
            <label>Mine Name:</label>
            <br />
            <input
              type="text"
              className="inpu"
              value={formData.mine_name}
              onChange={(e) => setFormData({ ...formData, mine_name: e.target.value })}
              required
            />
          </div>

          <div className="inpu-box">
            <label>Mine Location:</label>
            <br />
            <input
              type="text"
              className="inpu"
              value={formData.mine_location}
              onChange={(e) => setFormData({ ...formData, mine_location: e.target.value })}
              required
            />
          </div>

          <div className="inpu-box">
            <label>Mine Type:</label>
            <br />
            <select
              className="inpu"
              value={formData.mine_type}
              onChange={(e) => setFormData({ ...formData, mine_type: e.target.value })}
              required
            >
              <option value="">Select Mine Type</option>
              <option value="underground">Underground</option>
              <option value="open-cast">Open-cast</option>
            </select>
          </div>

          <div className="inpu-box">
            <label>Password:</label>
            <br />
            <input
              type="password"
              className="inpu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="inpu-box">
            <label>Confirm Password:</label>
            <br />
            <input
              type="password"
              className="inpu"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              required
            />
          </div>

          <div className="inpu-box">
            <label>Upload Mining License (PDF):</label>
            <br />
            <input
              type="file"
              className="inpu"
              accept=".pdf"
              onChange={(e) => setFormData({ ...formData, license: e.target.files[0] })}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className={loading ? 'loading' : ''}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdministratorSignup;