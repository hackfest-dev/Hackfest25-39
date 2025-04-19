import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './AdministratorDashboard.css';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdministratorDashboard = () => {
  const [emissionsData, setEmissionsData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [administratorInfo, setAdministratorInfo] = useState(null);
  const [submittedReports, setSubmittedReports] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessages, setSuccessMessages] = useState({});

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch(`${apiBaseURL}/api/administrator/check-session`, { 
          credentials: 'include' 
        });
        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          throw new Error('Administrator authentication required');
        }

        setAdministratorInfo({
          id: sessionData.administrator_id,
          mineName: sessionData.mine_name
        });

        const emissionsRes = await fetch(`${apiBaseURL}/api/administrator/emissions`, {
          credentials: 'include'
        });
        
        if (!emissionsRes.ok) throw new Error('Failed to fetch emissions data');
        
        const rawData = await emissionsRes.json();
        setEmissionsData(rawData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleVerifyEmission = async (emissionId) => {
    if (!window.confirm('Are you sure you want to verify this emission entry?')) return;
  
    try {
      const response = await fetch(`${apiBaseURL}/api/emissions/verify/${emissionId}`, {
        method: 'PUT',
        credentials: 'include'
      });
  
      if (!response.ok) throw new Error('Verification failed');
      
      setEmissionsData(prev => prev.map(sector => ({
        ...sector,
        emissions: sector.emissions.map(emission => 
          emission.id === emissionId ? { ...emission, verified: true } : emission
        )
      })));

      setSuccessMessages(prev => ({
        ...prev,
        [emissionId]: 'Entry verified successfully'
      }));
      
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[emissionId];
          return newMessages;
        });
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectEmission = async (entryId) => {
    if (!window.confirm('Are you sure you want to reject and delete this emission entry?')) return;
  
    try {
      const response = await fetch(`${apiBaseURL}/api/emissions/delete/${entryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
  
      if (!response.ok) throw new Error('Deletion failed');
      
      setEmissionsData(prev => prev.map(sector => ({
        ...sector,
        emissions: sector.emissions.filter(e => e.id !== entryId)
      })));
      
    } catch (err) {
      setError(err.message);
    }
  };
  
  const getVerifiedDataForChart = () => {
    const monthlyData = {};
  
    emissionsData.forEach(sector => {
      sector.emissions.forEach(entry => {
        if (entry.verified) {
          const key = `${entry.year}-${entry.month}`;
          if (!monthlyData[key]) {
            monthlyData[key] = {
              year: entry.year,
              month: entry.month,
              total: 0
            };
          }
          monthlyData[key].total += entry.total;
        }
      });
    });
  
    return Object.values(monthlyData).sort((a, b) => 
      b.year - a.year || b.month - a.month
    );
  };

  const getProcessedData = () => {
    const monthlyData = {};
  
    emissionsData.forEach(sector => {
      sector.emissions.forEach(entry => {
        const key = `${entry.year}-${entry.month}`;
        if (!monthlyData[key]) {
          monthlyData[key] = {
            year: entry.year,
            month: entry.month,
            total: 0,
            sectors: []
          };
        }
        
        monthlyData[key].total += entry.total;
        monthlyData[key].sectors.push({
          emissionId: entry.id,
          sectorId: sector.sector_id,
          sectorName: sector.sector_name,
          emission: entry.total,
          verified: entry.verified
        });
      });
    });
  
    return Object.values(monthlyData).sort((a, b) => 
      b.year - a.year || b.month - a.month
    );
  };

  const getYearlyTotals = () => {
    const years = {};
    getProcessedData().forEach(entry => {
      years[entry.year] = (years[entry.year] || 0) + entry.total;
    });
    return Object.entries(years).map(([year, total]) => ({
      year: Number(year),
      total
    })).sort((a, b) => b.year - a.year);
  };

  const chartData = {
    labels: Array.from({ length: 12 }, (_, i) => 
      new Date(0, i).toLocaleString('default', { month: 'short' })),
    datasets: [{
      label: 'Verified Monthly Emissions',
      data: Array(12).fill(0).map((_, i) => {
        const monthData = getVerifiedDataForChart().find(d => 
          d.month === i+1 && d.year === selectedYear
        );
        return monthData ? monthData.total : 0;
      }),
      borderColor: '#4bc0c0',
      tension: 0.2
    }]
  };

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;
  if (error) return <div className="admin-error">⚠️ {error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1 className="admin-title">{administratorInfo?.mineName} Emissions Overview</h1>
        <div className="admin-year-selector">
          <label>Select Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {getYearlyTotals().map(({ year }) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="admin-main-content">
        <div className="admin-chart-container">
          <Line 
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `Monthly Emissions Summary - ${selectedYear}`
                }
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'kg CO₂e'
                  }
                }
              }
            }}
          />
        </div>

        <div className="admin-monthly-summaries">
          {getProcessedData()
            .filter(entry => entry.year === selectedYear)
            .map(monthEntry => (
              <div key={`${monthEntry.year}-${monthEntry.month}`} className="admin-month-card">
                <div className="admin-card-header">
                  <h3 className="admin-month-title">
                    {new Date(monthEntry.year, monthEntry.month - 1)
                      .toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="admin-total-emission">
                    <span>Total: {monthEntry.total.toFixed(2)} kg CO₂e</span>
                    {submittedReports.some(r => 
                      r.year === monthEntry.year && 
                      r.month === monthEntry.month
                    ) ? (
                      <div className="admin-submission-status">
                        ✓ Submitted
                        {submittedReports
                          .filter(r => r.year === monthEntry.year && r.month === monthEntry.month)
                          .map(report => (
                            <button
                              key={report.id}
                              onClick={() => window.open(`${apiBaseURL}${report.report_url}`, '_blank')}
                              className="admin-view-report"
                            >
                              View Report
                            </button>
                          ))}
                      </div>
                    ) : (
                      <div className="admin-submission-controls">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="admin-file-input"
                        />
                        <button
                          className="admin-submit-button"
                          onClick={() => handleMonthlySubmit(monthEntry.month, monthEntry.year)}
                          disabled={monthEntry.sectors.some(s => !s.verified)}
                        >
                          Submit Monthly Report
                        </button>
                        {monthEntry.sectors.some(s => !s.verified) && (
                          <span className="admin-verification-warning">
                            All entries must be verified before submission
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-sectors-list">
                  {monthEntry.sectors.map(sector => (
                    <div key={sector.sectorId} className="admin-sector-item">
                      <div className="admin-sector-info">
                        <span className="admin-sector-id">{sector.sectorId}</span>
                        <span className="admin-sector-name">{sector.sectorName}</span>
                      </div>
                      <div className="admin-sector-emission">
                        {sector.emission.toFixed(2)} kg CO₂e
                        {!sector.verified && (
                          <button 
                            onClick={() => handleRejectEmission(sector.emissionId)}
                            className="admin-reject-button"
                            title="Reject this entry"
                          >
                            🗑️ Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleVerifyEmission(sector.emissionId)}
                          className={`admin-verify-button ${sector.verified ? 'verified' : ''}`}
                          title={sector.verified ? 'Verified entry' : 'Verify this entry'}
                          disabled={sector.verified}
                        >
                          {sector.verified ? '✅ Verified' : 'Verify'}
                        </button>
                        {successMessages[sector.emissionId] && (
                          <div className="admin-success-message">
                            {successMessages[sector.emissionId]}
                          </div>
                        )}
                      </div>
                      <a 
                        href={`/administratordashboardsector/${sector.sectorId}`}
                        className="admin-view-dashboard-link"
                      >
                        View Dashboard →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="admin-yearly-summary">
          <h2>Annual Emissions Overview</h2>
          <div className="admin-yearly-bars">
            {getYearlyTotals().map(({ year, total }) => (
              <div key={year} className="admin-year-bar">
                <div className="admin-bar-label">{year}</div>
                <div className="admin-bar-container">
                  <div 
                    className="admin-bar-fill"
                    style={{ height: `${(total / 1000) * 2}px` }}
                  ></div>
                </div>
                <div className="admin-bar-value">{(total/1000).toFixed(1)} tonnes</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboard;