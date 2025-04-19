import React, { useState, useEffect } from 'react';
import './ManageSectors.css';

const ManageSectors = () => {
  const [sectors, setSectors] = useState([]);
  const [formData, setFormData] = useState({
    sector_id: '',
    sector_category: '',
    sector_email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sectorCategories = [
    'Extraction Sector',
    'Overburden (OB) Removal Sector',
    'Coal Processing & Handling Sector',
    'Waste Management Sector',
    'Support Infrastructure Sector',
    'Coal Dispatch Sector',
    'Rehabilitation Sector',
    'Exploration Sector'
  ];

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch(`${apiBaseURL}/api/manage-sectors`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch sectors');
        
        const data = await response.json();
        setSectors(data);
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchSectors();
  }, [apiBaseURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    // Validate empty fields
    if (!formData.sector_id.trim() || !formData.sector_category || !formData.sector_email.trim()) {
      return setError('All fields are required');
    }
  
    // Validate email format
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.sector_email)) {
      return setError('Invalid email format');
    }
  
    // Validate category selection
    if (!sectorCategories.includes(formData.sector_category)) {
      return setError('Invalid sector category');
    }
  
    try {
      const response = await fetch(`${apiBaseURL}/api/manage-sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sector');
      }
  
      const data = await response.json();
      setSectors([...sectors, data]);
      setSuccess('Sector created successfully!');
      setFormData({ sector_id: '', sector_category: '', sector_email: '' });
      
    } catch (err) {
      setError(err.message);
    }
  };



return (
  <div className="ms-container">
    <h2>Manage Mine Sectors</h2>
    
    <form onSubmit={handleSubmit} className="ms-form">
      <div className="ms-form-grid">
        <div className="ms-form-group">
          <label>Sector ID:</label>
          <input
            type="text"
            value={formData.sector_id}
            onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
            placeholder="Enter unique sector ID"
          />
        </div>

        <div className="ms-form-group">
          <label>Sector Category:</label>
          <select
            value={formData.sector_category}
            onChange={(e) => setFormData({ ...formData, sector_category: e.target.value })}
          >
            <option value="">Select Category</option>
            {sectorCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="ms-form-group">
          <label>Sector Email:</label>
          <input
            type="email"
            value={formData.sector_email}
            onChange={(e) => setFormData({ ...formData, sector_email: e.target.value })}
            placeholder="Enter sector email"
          />
        </div>
      </div>

      {error && <div className="ms-message ms-error-message">{error}</div>}
      {success && <div className="ms-message ms-success-message">{success}</div>}

      <button type="submit" className="ms-submit-btn">
        Create Sector
      </button>
    </form>

    <div className="ms-sectors-list">
      <h3>Existing Sectors</h3>
      {sectors.length === 0 ? (
        <p>No sectors created yet</p>
      ) : (
        <table className="ms-table">
          <thead>
            <tr>
              <th>Sector ID</th>
              <th>Category</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector) => (
              <tr key={sector.sector_id}>
                <td>{sector.sector_id}</td>
                <td>{sector.sector_name}</td>
                <td>{sector.sector_email}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(sector.sector_id)}
                    className="ms-delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
};

export default ManageSectors;