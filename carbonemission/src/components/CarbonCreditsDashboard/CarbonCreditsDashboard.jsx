// CarbonCreditsDashboard.jsx
import React, { useState, useEffect } from 'react';

const CarbonCreditsDashboard = () => {
  const [netCredits, setNetCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const fetchNetCredits = async () => {
      try {
        const res = await fetch(`${apiBaseURL}/api/admin/net-credits`, {
          credentials: 'include'
        });
        const data = await res.json();
        setNetCredits(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching net credits:', error);
        setLoading(false);
      }
    };
    fetchNetCredits();
  }, []);

  return (
    <div className="dashboard">
      <h2>Net Carbon Credits Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>Mine</th>
            <th>Total Credits</th>
            <th>Emissions (Credits)</th>
            <th>Net Available</th>
          </tr>
        </thead>
        <tbody>
          {netCredits.map(mine => (
            <tr key={mine.administrator_id}>
              <td>{mine.mine_name}</td>
              <td>{mine.total_credits.toFixed(2)}</td>
              <td>{(mine.emissions / 1000).toFixed(2)}</td>
              <td>{mine.net_available.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CarbonCreditsDashboard;