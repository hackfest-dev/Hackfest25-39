import React, { useState, useEffect } from 'react';
// import './AdministratorDashboard.css';

const AdministratorMarketplace = () => {
  const [listings, setListings] = useState([]);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [formData, setFormData] = useState({ credits: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : `http://${window.location.hostname}:5000`;

    // Modify the useEffect to handle errors
useEffect(() => {
    const fetchData = async () => {
      try {
        const creditsRes = await fetch(`${apiBaseURL}/api/administrator/available-credits`, { 
          credentials: 'include' 
        });
        
        if (!creditsRes.ok) throw new Error('Credits data unavailable');
        
        const creditsData = await creditsRes.json();
        setAvailableCredits(creditsData.available || 0);
  
        const listingsRes = await fetch(`${apiBaseURL}/api/marketplace`, { 
          credentials: 'include' 
        });
        
        if (!listingsRes.ok) throw new Error('Listings unavailable');
        
        const listingsData = await listingsRes.json();
        setListings(listingsData);
  
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setAvailableCredits(0);
        setListings([]);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSellCredits = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseURL}/api/marketplace/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          credits: parseFloat(formData.credits),
          price: parseFloat(formData.price),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });
      
      if (!response.ok) throw new Error('Failed to list credits');
      
      // Refresh data
      const newListings = await fetch(`${apiBaseURL}/api/marketplace`);
      setListings(await newListings.json());
      setFormData({ credits: '', price: '' });
      
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading marketplace...</div>;
  if (error) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Carbon Credit Marketplace</h2>
        // AdministratorMarketplace.jsx - Add net credits display
<div className="credits-summary">
  <div className="available-credits">
    <h3>Net Available Credits</h3>
    <div className="credits-value">
  {availableCredits?.toFixed?.(2) || '0.00'} tCO₂e
</div>
  </div>
</div>
      </div>

      <div className="marketplace-content">
        <form onSubmit={handleSellCredits} className="listing-form">
          <h3>Sell Credits</h3>
          <div className="form-group">
            <label>Credits to Sell:</label>
            <input
              type="number"
              step="0.01"
              value={formData.credits}
              onChange={(e) => setFormData({...formData, credits: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Price per Credit (₹):</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="admin-submit-button">
            List Credits
          </button>
          <div className="form-limits">
            <span>Available: {availableCredits.toFixed(2)} tCO₂e</span>
            {formData.credits > availableCredits && (
              <span className="form-error">
                Cannot list more credits than available!
              </span>
            )}
          </div>
        </form>

        <div className="active-listings">
          <h3>Active Listings</h3>
          <div className="listings-grid">
            {listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <div className="listing-header">
                  <h4>{listing.mine_name}</h4>
                  <span className="price">₹{listing.price_per_credit}/credit</span>
                </div>
                <div className="listing-details">
                  <p>Available: {listing.credits_available} tCO₂e</p>
                  <p>Listed: {new Date(listing.created_at).toLocaleDateString()}</p>
                </div>
                <button className="admin-submit-button">
                  Purchase Credits
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorMarketplace;