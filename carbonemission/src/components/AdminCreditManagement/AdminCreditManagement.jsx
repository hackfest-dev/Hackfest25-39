import React, { useState, useEffect } from 'react';
// import './AdministratorDashboard.css';   

const AdminCreditManagement = () => {
  const [creditData, setCreditData] = useState([]);
  const [priceSettings, setPriceSettings] = useState({ month: '', year: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchData = async () => {
        try {
          const [overviewRes, pricesRes] = await Promise.all([
            fetch(`${apiBaseURL}/api/admin/credit-overview`, { credentials: 'include' }),
            fetch(`${apiBaseURL}/api/admin/credit-price`, { credentials: 'include' })
          ]);
          
          const [overviewData, pricesData] = await Promise.all([
            overviewRes.json(),
            pricesRes.json()
          ]);
          
          setCreditData(overviewData.map(item => ({
            ...item,
            total_credits: Number(item.total_credits),
            emissions: Number(item.emissions),
            available: Number(item.available)
          })));
          
          setPriceSettings(pricesData);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
    fetchData();
  }, []);

  const handleSetPrice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseURL}/api/admin/credit-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          month: parseInt(priceSettings.month),
          year: parseInt(priceSettings.year),
          price: parseFloat(priceSettings.price)
        })
      });
      
      if (!response.ok) throw new Error('Failed to set price');
      
      const updatedSettings = await response.json();
      setPriceSettings(updatedSettings);
      alert('Price updated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading credit data...</div>;
  if (error) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Carbon Credit Administration</h2>
      </div>

      <div className="management-content">
        <div className="price-control">
          <h3>Set Base Price</h3>
          <form onSubmit={handleSetPrice}>
            <div className="form-group">
              <label>Month:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={priceSettings.month || ''}
                onChange={(e) => setPriceSettings({...priceSettings, month: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Year:</label>
              <input
                type="number"
                min="2023"
                value={priceSettings.year || ''}
                onChange={(e) => setPriceSettings({...priceSettings, year: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Price per Credit (₹):</label>
              <input
                type="number"
                step="0.01"
                value={priceSettings.price || ''}
                onChange={(e) => setPriceSettings({...priceSettings, price: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="admin-submit-button">
              Set Base Price
            </button>
          </form>
        </div>

        <div className="credit-overview">
          <h3>Mine Credit Overview</h3>
          <table>
            <thead>
              <tr>
                <th>Mine</th>
                <th>Total Credits</th>
                <th>Emissions</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {creditData.map(mine => (
                <tr key={mine.administrator_id}>
                  <td>{mine.mine_name}</td>
                  <td>{mine.total_credits.toFixed(2)}</td>
                  <td>{mine.emissions.toFixed(2)}</td>
                  <td className={mine.available < 0 ? 'negative' : ''}>
                    {mine.available.toFixed(2)}
                    {mine.available < 0 && (
                      <span className="warning-tooltip">
                        Emissions exceed credits!
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCreditManagement;