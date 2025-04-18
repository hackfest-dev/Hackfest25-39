import React, { useState, useRef } from 'react';
import './WasteManagementCalculator.css';

const ExtractionCalculator = () => {
  const [inputs, setInputs] = useState({
    diesel: '',
    methane: '',
    electricity: ''
  });
  const [emissions, setEmissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);
  const pdfInputRef = useRef(null);

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' },
    { value: 3, name: 'March' }, { value: 4, name: 'April' },
    { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' },
    { value: 9, name: 'September' }, { value: 10, name: 'October' },
    { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const emissionFactors = {
    diesel: 2.68,
    gwpCH4: 28,
    electricity: 0.82
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setPdfFile(null);
      setError('Please upload a valid PDF file');
    }
  };

  const calculateEmissions = () => {
    const dieselVal = parseFloat(inputs.diesel) || 0;
    const methaneVal = parseFloat(inputs.methane) || 0;
    const electricityVal = parseFloat(inputs.electricity) || 0;

    const dieselCO2 = dieselVal * emissionFactors.diesel;
    const methaneCO2e = methaneVal * emissionFactors.gwpCH4;
    const electricityCO2 = electricityVal * emissionFactors.electricity;

    return {
      total: dieselCO2 + methaneCO2e + electricityCO2,
      breakdown: {
        diesel: dieselCO2,
        methane: methaneCO2e,
        electricity: electricityCO2
      },
      inputs: {
        diesel: dieselVal,
        methane: methaneVal,
        electricity: electricityVal
      }
    };
  };

  const handleCalculate = () => {
    try {
      const results = calculateEmissions();
      setEmissions(results);
      setError('');
    } catch (err) {
      setError('Invalid calculation parameters');
      setEmissions(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!pdfFile) {
        throw new Error('PDF file is required for submission');
      }

      const sectorRes = await fetch(`${apiBaseURL}/api/sector/check-session`, {
        credentials: 'include'
      });
      const sectorData = await sectorRes.json();

      if (!sectorData.authenticated || !sectorData.sector_id) {
        throw new Error('Sector authentication required');
      }

      const formData = new FormData();
      formData.append('sector_id', sectorData.sector_id);
      formData.append('sector_type', 'Extraction');
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);
      formData.append('inputs', JSON.stringify(emissions.inputs));
      formData.append('emissions', JSON.stringify({
        total: emissions.total,
        breakdown: emissions.breakdown
      }));
      formData.append('pdf', pdfFile);

      const response = await fetch(`${apiBaseURL}/api/emissions/store`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      setInputs({ diesel: '', methane: '', electricity: '' });
      setEmissions(null);
      setPdfFile(null);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
      setSuccess('Data and PDF submitted successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-container">
      <h2>Extraction Sector Emissions Calculator</h2>

      <div className="input-section">
        <div className="period-selector">
          <div className="input-group">
            <label>
              Month:
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="input-group">
            <label>
              Year:
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="input-group">
          <label>
            Diesel Consumed (liters):
            <input
              type="number"
              value={inputs.diesel}
              onChange={(e) => setInputs({...inputs, diesel: e.target.value})}
              placeholder="Enter diesel consumption"
              min="0"
              step="0.1"
            />
          </label>
        </div>

        <div className="input-group">
          <label>
            Methane Released (m³):
            <input
              type="number"
              value={inputs.methane}
              onChange={(e) => setInputs({...inputs, methane: e.target.value})}
              placeholder="Enter methane volume"
              min="0"
              step="0.1"
            />
          </label>
        </div>

        <div className="input-group">
          <label>
            Electricity Used (kWh):
            <input
              type="number"
              value={inputs.electricity}
              onChange={(e) => setInputs({...inputs, electricity: e.target.value})}
              placeholder="Enter electricity consumption"
              min="0"
              step="0.1"
            />
          </label>
        </div>

        <div className="input-group">
          <label>
            Upload Supporting PDF:
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={pdfInputRef}
                className="file-input"
                required
              />
              <span className="file-input-label">
                {pdfFile ? pdfFile.name : 'Choose PDF file'}
              </span>
              <button 
                type="button" 
                className="browse-btn"
                onClick={() => pdfInputRef.current.click()}
              >
                Browse
              </button>
            </div>
          </label>
          {pdfFile && (
            <div className="pdf-preview-info">
              <span>PDF ready for upload: {pdfFile.name}</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      <div className="action-buttons">
        {!emissions ? (
          <button 
            onClick={handleCalculate}
            className="calculate-btn"
            disabled={!inputs.diesel && !inputs.methane && !inputs.electricity}
          >
            Calculate Emissions
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setInputs({ diesel: '', methane: '', electricity: '' });
                setEmissions(null);
              }}
              className="recalculate-btn"
            >
              ↻ Recalculate
            </button>
            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={loading || !pdfFile}
            >
              {loading ? '⏳ Submitting...' : '📤 Submit Data'}
            </button>
          </>
        )}
      </div>

      {emissions && (
        <div className="results-section">
          <h3>Emission Results</h3>
          <div className="results-breakdown">
            <div className="result-item">
              <span className="result-label">Diesel Emissions:</span>
              <span className="result-value">
                {emissions.breakdown.diesel.toFixed(2)} kg CO₂
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Methane Emissions:</span>
              <span className="result-value">
                {emissions.breakdown.methane.toFixed(2)} kg CO₂e
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Electricity Emissions:</span>
              <span className="result-value">
                {emissions.breakdown.electricity.toFixed(2)} kg CO₂
              </span>
            </div>
            <div className="total-emissions">
              <span className="total-label">Total Emissions:</span>
              <span className="total-value">
                {emissions.total.toFixed(2)} kg CO₂e
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="emission-factors">
        <h4>Applied Emission Factors:</h4>
        <ul>
          <li>Diesel: {emissionFactors.diesel} kg CO₂/L</li>
          <li>Methane GWP: {emissionFactors.gwpCH4}</li>
          <li>Electricity: {emissionFactors.electricity} kg CO₂/kWh</li>
        </ul>
      </div>
    </div>
  );
};

export default ExtractionCalculator;