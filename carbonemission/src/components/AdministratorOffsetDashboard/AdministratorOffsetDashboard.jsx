import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './AdministratorOffsetDashboard.css'

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdministratorOffsetDashboard = () => {
  const [offsetData, setOffsetData] = useState([]);
  const [creditsData, setCreditsData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCredits, setTotalCredits] = useState(0);

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offsetsRes, creditsRes, totalRes] = await Promise.all([
          fetch(`${apiBaseURL}/api/administrator/offsets`, { credentials: 'include' }),
          fetch(`${apiBaseURL}/api/administrator/carbon-credits`, { credentials: 'include' }),
          fetch(`${apiBaseURL}/api/administrator/total-credits`, { credentials: 'include' })
        ]);

        // Handle HTTP errors
        if (!offsetsRes.ok) throw new Error('Failed to fetch offset data');
        if (!creditsRes.ok) throw new Error('Failed to fetch credit data');
        if (!totalRes.ok) throw new Error('Failed to fetch total credits');

        // Parse JSON responses
        const [offsets, credits, total] = await Promise.all([
          offsetsRes.json(),
          creditsRes.json(),
          totalRes.json()
        ]);

        // Process offsets data
        const parsedOffsets = offsets.map(offset => ({
          ...offset,
          total_offset: Number(offset.total_offset) || 0,
          month: Number(offset.month) || 1,
          year: Number(offset.year) || new Date().getFullYear(),
          credits_issued: Number(offset.credits_issued) || 0
        }));

        // Process credits data
        const parsedCredits = credits.map(credit => ({
          ...credit,
          credits_issued: Number(credit.credits_issued) || 0,
          month: Number(credit.month) || 1,
          year: Number(credit.year) || new Date().getFullYear()
        }));

        // Update state
        setOffsetData(parsedOffsets);
        setCreditsData(parsedCredits);
        setTotalCredits(Number(total.total) || 0);
        setLoading(false);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getChartData = () => {
    const monthlyCredits = Array(12).fill(0);
    creditsData.forEach(entry => {
      if (entry.year === selectedYear) {
        const monthIndex = Math.max(0, Math.min(11, entry.month - 1));
        monthlyCredits[monthIndex] += Number(entry.credits_issued) || 0;
      }
    });

    return {
      labels: Array.from({ length: 12 }, (_, i) => 
        new Date(0, i).toLocaleString('default', { month: 'short' })),
      datasets: [{
        label: 'Carbon Credits Earned',
        data: monthlyCredits,
        backgroundColor: '#2ecc71',
        borderColor: '#27ae60',
        borderWidth: 1
      }]
    };
  };

  const getYearOptions = () => {
    const years = new Set([
      ...offsetData.map(entry => entry.year),
      ...creditsData.map(entry => entry.year)
    ]);
    return Array.from(years).sort((a, b) => b - a);
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="administrator-dashboard">
      <header className="dashboard-header">
        <h1>Carbon Credits Dashboard</h1>
        <div className="credits-summary">
          <div className="total-credits">
            <h3>Total Credits Owned</h3>
            <div className="credits-value">
              {typeof totalCredits === 'number' ? totalCredits.toFixed(2) : '0.00'}
            </div>
            <small>tonnes CO₂e</small>
          </div>
          <div className="year-selector">
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
        </div>
      </header>

      <div className="main-content">
        <div className="chart-container">
          <Bar 
            data={getChartData()}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `Monthly Carbon Credits - ${selectedYear}`
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

        <div className="credits-list">
          <h2>Offset Entries</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Offset</th>
                <th>Status</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {offsetData
                .filter(entry => entry.year === selectedYear)
                .sort((a, b) => b.month - a.month)
                .map(entry => (
                  <tr key={entry.id}>
                    <td>
                      {new Date(entry.year, entry.month - 1)
                        .toLocaleString('default', { month: 'long' })}
                    </td>
                    <td>{(entry.total_offset || 0).toFixed(2)} t</td>
                    <td className={`status ${entry.verified ? 'verified' : 'pending'}`}>
                      {entry.verified ? '✓ Verified' : '⏳ Pending'}
                    </td>
                    <td>
                      {entry.verified ? 
                        `${(entry.credits_issued || 0).toFixed(2)} t` : 
                        '–'}
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

export default AdministratorOffsetDashboard;