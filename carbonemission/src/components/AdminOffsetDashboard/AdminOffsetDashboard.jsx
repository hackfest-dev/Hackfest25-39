import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminOffsetDashboard = () => {
  const [offsetData, setOffsetData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessages, setSuccessMessages] = useState({});

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchOffsetData = async () => {
      try {
        const response = await fetch(`${apiBaseURL}/api/admin/administrator-offsets`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch offset data');
        
        const data = await response.json();
        setOffsetData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchOffsetData();
  }, []);

  const handleVerifyOffset = async (offsetId) => {
    if (!window.confirm('Are you sure you want to verify this offset entry?')) return;

    try {
      const response = await fetch(`${apiBaseURL}/api/admin/verify-offset/${offsetId}`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Verification failed');
      
      const data = await response.json();
      
      setOffsetData(prev => prev.map(offset => 
        offset.id === offsetId ? { ...offset, verified: true } : offset
      ));

      setSuccessMessages(prev => ({
        ...prev,
        [offsetId]: 'Offset verified successfully'
      }));
      
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[offsetId];
          return newMessages;
        });
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectOffset = async (offsetId) => {
    if (!window.confirm('Are you sure you want to reject this offset entry?')) return;

    try {
      const response = await fetch(`${apiBaseURL}/api/admin/offset/${offsetId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Deletion failed');
      
      setOffsetData(prev => prev.filter(offset => offset.id !== offsetId));
      
    } catch (err) {
      setError(err.message);
    }
  };

  const getChartData = () => {
    const monthlyData = Array(12).fill(0);
    offsetData.forEach(entry => {
      if (entry.verified && entry.year === selectedYear) {
        monthlyData[entry.month - 1] += entry.total_offset;
      }
    });

    return {
      labels: Array.from({ length: 12 }, (_, i) => 
        new Date(0, i).toLocaleString('default', { month: 'short' })),
      datasets: [{
        label: 'Verified Carbon Offsets',
        data: monthlyData,
        borderColor: '#27ae60',
        tension: 0.2,
        fill: true,
        backgroundColor: 'rgba(39, 174, 96, 0.2)'
      }]
    };
  };

  const getYearOptions = () => {
    const years = new Set(offsetData.map(entry => entry.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  if (loading) return <div className="admin-loading">Loading offset data...</div>;
  if (error) return <div className="admin-error">⚠️ {error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1 className="admin-title">Carbon Offset Management</h1>
        <div className="admin-year-selector">
          <label>Select Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {getYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="admin-main-content">
        <div className="admin-chart-container">
          <Line 
            data={getChartData()}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `Monthly Offset Summary - ${selectedYear}`
                }
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'tonnes CO₂e'
                  }
                }
              }
            }}
          />
        </div>

        <div className="admin-monthly-summaries">
          {offsetData
            .filter(entry => entry.year === selectedYear)
            .sort((a, b) => b.month - a.month)
            .map(entry => (
              <div key={entry.id} className="admin-month-card">
                <div className="admin-card-header">

                <div className="admin-mine-info">
                  <h3 className="admin-mine-id">
                    Mine Administrator ID: {entry.administrator_id}
                  </h3>
                  <h3 className="admin-month-title">
                    {new Date(entry.year, entry.month - 1)
                      .toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                  
                  <div className="admin-total-emission">
                    <span>Total Offset: {entry.total_offset?.toFixed(2) || '0.00'} tonnes CO₂e</span>
                    <div className="admin-submission-status">
                      {entry.verified ? (
                        <span className="verified-status">✓ Verified</span>
                      ) : (
                        <span className="pending-status">⏳ Pending Verification</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-sectors-list">
                  <div className="offset-details">
                  <div className="offset-details">
                    <div className="detail-item">
                      <span>Tailings Mineralization:</span>
                      <span>{entry.tailings_volume} tonnes</span>
                    </div>
                    <div className="detail-item">
                      <span>Methane Captured:</span>
                      <span>{entry.methane_captured} m³</span>
                    </div>
                    <div className="detail-item">
                      <span>Trees Planted:</span>
                      <span>{entry.trees_planted} ({entry.tree_type})</span>
                    </div>
                    <div className="detail-item">
                      <span>Renewable Energy:</span>
                      <span>{entry.renewable_energy} kWh</span>
                    </div>
                    <div className="detail-item">
                      <span>CCS Captured:</span>
                      <span>{entry.ccs_captured} tonnes</span>
                    </div>
                    <div className="detail-item">
                      <span>Fuel Saved:</span>
                      <span>{entry.fuel_saved} liters</span>
                    </div>
                  </div>
                  </div>

                  <div className="admin-actions">
                    <button
                      onClick={() => window.open(`${apiBaseURL}/api/offset-pdf/${entry.pdf_path}`, '_blank')}
                      className="admin-view-report"
                    >
                      View PDF Report
                    </button>
                    
                    {!entry.verified && (
                      <>
                        <button
                          onClick={() => handleVerifyOffset(entry.id)}
                          className="admin-verify-button"
                        >
                          Verify Offset
                        </button>
                        <button
                          onClick={() => handleRejectOffset(entry.id)}
                          className="admin-reject-button"
                        >
                          Reject Entry
                        </button>
                      </>
                    )}

                    {successMessages[entry.id] && (
                      <div className="admin-success-message">
                        {successMessages[entry.id]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOffsetDashboard;