import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

import { useParams } from 'react-router-dom';
// import './SectorDashboard.css';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdministratorDashboardSector = () => {
  const [emissionsData, setEmissionsData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSector, setCurrentSector] = useState(null);
  const verifiedEmissionsData = emissionsData.filter(entry => entry.verified);


  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  const sectorConfig = {
    'Extraction': {
      inputs: {
        diesel: { label: 'Diesel Consumed', unit: 'L' },
        methane: { label: 'Methane Released', unit: 'm³' },
        electricity: { label: 'Electricity Used', unit: 'kWh' }
      },
      breakdown: {
        diesel: { label: 'Diesel Emissions' },
        methane: { label: 'Methane Emissions' },
        electricity: { label: 'Electricity Emissions' }
      }
    },
    'Coal Dispatch': {
      inputs: {
        truckDistance: { label: 'Truck Distance', unit: 'km' },
        railTonKm: { label: 'Rail Transport', unit: 'tonne-km' }
      },
      breakdown: {
        truck: { label: 'Truck Emissions' },
        rail: { label: 'Rail Emissions' }
      }
    },
    'Waste Management': {
      inputs: {
        tailings: { label: 'Tailings Volume', unit: 'm³' },
        transportDiesel: { label: 'Transport Diesel', unit: 'L' }
      },
      breakdown: {
        tailings: { label: 'Tailings Emissions' },
        transport: { label: 'Transport Emissions' }
      }
    },
    'OB Removal': {
      inputs: {
        diesel: { label: 'Diesel Used', unit: 'L' },
        explosives: { label: 'Explosives Used', unit: 'kg' },
        obHauled: { label: 'OB Hauled', unit: 'tonnes' },
        distance: { label: 'Transport Distance', unit: 'km' }
      },
      breakdown: {
        diesel: { label: 'Diesel Emissions' },
        explosives: { label: 'Explosives Emissions' },
        hauling: { label: 'Hauling Emissions' }
      }
    },
    'Rehabilitation': {
      inputs: {
        dieselUsed: { label: 'Diesel Used', unit: 'L' },
        treesPlanted: { label: 'Trees Planted', unit: 'trees' }
      },
      breakdown: {
        diesel: { label: 'Diesel Emissions' },
        sequestration: { label: 'Carbon Sequestration' }
      }
    }
  };

  
    const { sectorId } = useParams();
    const [sectorInfo, setSectorInfo] = useState(null);
  
    // Replace the session check with sector ID from URL
    useEffect(() => {
        const fetchData = async () => {
          try {
            const emissionsRes = await fetch(`${apiBaseURL}/api/emissions/${sectorId}`, { 
              credentials: 'include' 
            });
            
            if (!emissionsRes.ok) throw new Error('Failed to fetch data');
            
            const emissionsData = await emissionsRes.json();
            setEmissionsData(emissionsData);
            setLoading(false);
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        };
    
        fetchData();
      }, [sectorId]);

  const getFilteredData = () => {
    return emissionsData
      .filter(entry => entry.year === selectedYear)
      .sort((a, b) => a.month - b.month);
  };

  const getYearlyTotals = () => {
    const years = [...new Set(emissionsData.map(entry => entry.year))];
    return years.map(year => ({
      year,
      total: emissionsData
        .filter(entry => entry.year === year)
        .reduce((sum, entry) => sum + entry.emission_data.total, 0)
    })).sort((a, b) => b.year - a.year);
  };

  const chartData = {
  labels: Array.from({ length: 12 }, (_, i) => 
    new Date(0, i).toLocaleString('default', { month: 'short' })),
  datasets: [{
    label: 'Verified Monthly Emissions',
    data: Array(12).fill(0).map((_, i) => {
      const entry = verifiedEmissionsData.find(e => 
        e.month === i+1 && e.year === selectedYear
      );
      return entry ? entry.emission_data.total : 0;
    }),
    borderColor: '#4bc0c0',
    tension: 0.2
  }]
};

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="sector-dashboard">
      <header>
        <h1>{currentSector?.type || 'Sector'} Emissions Dashboard</h1>
        <div className="year-selector">
          <label>Select Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[...new Set(emissionsData.map(entry => entry.year))]
              .sort((a, b) => b - a)
              .map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
          </select>
        </div>
      </header>

      <div className="main-content">
        <div className="chart-container">
          <Line 
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `Monthly Emissions Overview - ${selectedYear}`
                }
              }
            }}
          />
        </div>

        <div className="emissions-list">
          {getFilteredData().map(entry => {
            const config = sectorConfig[entry.sector_type] || {};
            
            return (
              <div key={`${entry.year}-${entry.month}`} className="emission-card">
               <div className="card-header">
  <h3>
    {new Date(entry.year, entry.month - 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' })}
  </h3>
  <div className={`verification-badge ${entry.verified ? 'verified' : 'unverified'}`}>
    {entry.verified ? '✅ Verified' : '⚠️ Unverified'}
  </div>
  {entry.pdf_path && (
    <a
      href={`${apiBaseURL}/api/pdf/${entry.pdf_path}`}
      target="_blank"
      rel="noopener noreferrer"
      className="pdf-link"
    >
      View PDF Report
    </a>
  )}
</div>

                <div className="card-body">
                  <div className="input-metrics">
                    <h4>Input Metrics</h4>
                    {Object.entries(config.inputs || {}).map(([key, { label, unit }]) => (
                      entry.input_data[key] !== undefined && (
                        <div key={key} className="metric">
                          <span className="label">{label}:</span>
                          <span className="value">
                            {entry.input_data[key]} {unit}
                          </span>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="emission-metrics">
                    <h4>Emission Breakdown</h4>
                    {Object.entries(config.breakdown || {}).map(([key, { label }]) => (
                      entry.emission_data.breakdown[key] !== undefined && (
                        <div key={key} className="metric">
                          <span className="label">{label}:</span>
                          <span className="value">
                            {entry.emission_data.breakdown[key].toFixed(2)} kg CO₂e
                          </span>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="total-emission">
                    <div className="metric total">
                      <span className="label">Total Emissions:</span>
                      <span className="value">
                        {entry.emission_data.total.toFixed(2)} kg CO₂e
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="yearly-summary">
          <h2>Yearly Emissions Summary</h2>
          <div className="yearly-bars">
            {getYearlyTotals().map(({ year, total }) => (
              <div key={year} className="year-bar">
                <div className="bar-label">{year}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ height: `${(total / 1000) * 2}px` }} // Adjust scaling as needed
                  ></div>
                </div>
                <div className="bar-value">{total.toFixed(2)} kg</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboardSector;