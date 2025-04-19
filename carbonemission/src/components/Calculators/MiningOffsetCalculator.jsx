import React, { useState } from 'react';
import './MiningOffsetCalculator.css';

const MiningOffsetCalculator = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [inputs, setInputs] = useState({
    tailingsVolume: 0,
    sequestrationRate: 0.04,
    methaneCaptured: 0,
    treesPlanted: 0,
    treeType: 'Neem',
    renewableEnergy: 0,
    ccsCaptured: 0,
    fuelSaved: 0
  });
  const [results, setResults] = useState(null);

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  const INDIA_CONSTANTS = {
    gridEF: 0.00082,
    methaneDensity: 0.716,
    methaneGWP: 28,
    dieselEF: 2.68,
    treeSpecies: {
      'Neem': 0.035 / 12,
      'Teak': 0.040 / 12,
      'Bamboo': 0.025 / 12,
      'Mixed Native': 0.030 / 12
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const calculateMonthlyOffsets = () => {
    const calc = {
      mineralization: inputs.tailingsVolume * inputs.sequestrationRate,
      methane: (inputs.methaneCaptured * INDIA_CONSTANTS.methaneDensity * INDIA_CONSTANTS.methaneGWP) / 1000,
      trees: inputs.treesPlanted * INDIA_CONSTANTS.treeSpecies[inputs.treeType],
      renewables: inputs.renewableEnergy * INDIA_CONSTANTS.gridEF,
      ccs: inputs.ccsCaptured,
      efficiency: inputs.fuelSaved * INDIA_CONSTANTS.dieselEF / 1000
    };

    const total = Object.values(calc).reduce((a, b) => a + b, 0);
    
    setResults({
      monthlyTotal: Number(total.toFixed(2)),
      annualEstimate: Number((total * 12).toFixed(2)),
      breakdown: Object.fromEntries(
        Object.entries(calc).map(([key, val]) => [key, Number(val.toFixed(2))])
      )
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file?.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setPdfFile(null);
      setError('Please upload a valid PDF file');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!pdfFile) throw new Error('PDF report is required');

      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);
      
      Object.entries(inputs).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch(`${apiBaseURL}/api/offset/store`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      setSuccess('Data stored successfully');
      setError('');
      setResults(null);
      setPdfFile(null);
    } catch (error) {
      setError(error.message);
      setSuccess('');
    }
  };

  return (
    <div className="calculator-container">
      <header>
        <h1>Monthly Mining Carbon Offset Calculator</h1>
        <p className="subtitle">India Specific · MoEFCC Compliant</p>
        
        <div className="period-selector">
          <div className="input-group">
            <label>
              Month:
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="input-group">
            <label>
              Year:
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="input-section">
        <h2>Carbon Mineralization</h2>
        <InputField
          label="Reactive Tailings (tonnes/month)"
          value={inputs.tailingsVolume}
          onChange={v => setInputs({...inputs, tailingsVolume: v})}
          tooltip="Monthly tailings production from processing reports"
        />
      </div>

      <div className="input-section">
        <h2>Methane Management</h2>
        <InputField
          label="Methane Captured (m³/month)"
          value={inputs.methaneCaptured}
          onChange={v => setInputs({...inputs, methaneCaptured: v})}
        />
      </div>

      <div className="input-section">
        <h2>Afforestation</h2>
        <div className="input-group">
          <label>Tree Species</label>
          <select value={inputs.treeType} onChange={e => setInputs({...inputs, treeType: e.target.value})}>
            {Object.keys(INDIA_CONSTANTS.treeSpecies).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <InputField
          label="Trees Planted (monthly)"
          value={inputs.treesPlanted}
          onChange={v => setInputs({...inputs, treesPlanted: v})}
        />
      </div>

      <div className="input-section">
        <h2>Energy Transition</h2>
        <InputField
          label="Renewable Energy (kWh/month)"
          value={inputs.renewableEnergy}
          onChange={v => setInputs({...inputs, renewableEnergy: v})}
        />
        <InputField
          label="Fuel Saved (liters/month)"
          value={inputs.fuelSaved}
          onChange={v => setInputs({...inputs, fuelSaved: v})}
        />
      </div>

      <div className="input-section">
        <h2>Carbon Capture</h2>
        <InputField
          label="CCS Captured (tonnes/month)"
          value={inputs.ccsCaptured}
          onChange={v => setInputs({...inputs, ccsCaptured: v})}
        />
      </div>

      <div className="input-group">
        <label>
          Upload Offset Report PDF:
          <input type="file" accept=".pdf" onChange={handleFileChange} required />
        </label>
      </div>

      <button className="calculate-btn" onClick={calculateMonthlyOffsets}>
        Calculate Monthly Offset
      </button>

      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      {results && (
        <div className="results-section">
          <div className="total-box">
            <h2>Monthly Carbon Offset</h2>
            <p className="total-number">{results.monthlyTotal.toFixed(2)}</p>
            <small>tonnes CO₂ equivalent</small>
            <div className="annual-projection">
              <h3>Annual Projection</h3>
              <p>{results.annualEstimate.toFixed(2)} tonnes</p>
            </div>
          </div>

          <div className="breakdown">
            <h3>Monthly Breakdown</h3>
            <table>
              <tbody>
                <tr><td>Mineralization</td><td>{results.breakdown.mineralization.toFixed(2)}</td></tr>
                <tr><td>Methane Capture</td><td>{results.breakdown.methane.toFixed(2)}</td></tr>
                <tr><td>Afforestation ({inputs.treeType})</td><td>{results.breakdown.trees.toFixed(2)}</td></tr>
                <tr><td>Renewable Energy</td><td>{results.breakdown.renewables.toFixed(2)}</td></tr>
                <tr><td>CCS</td><td>{results.breakdown.ccs.toFixed(2)}</td></tr>
                <tr><td>Fuel Efficiency</td><td>{results.breakdown.efficiency.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>

          <button onClick={handleSubmit} className="submit-btn">
            Save Monthly Offset
          </button>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, value, onChange, tooltip }) => (
  <div className="input-group">
    <label>
      {label}
      {tooltip && <span className="tooltip">ℹ️<span className="tooltip-text">{tooltip}</span></span>}
    </label>
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      min="0"
      step="any"
    />
  </div>
);

export default MiningOffsetCalculator;