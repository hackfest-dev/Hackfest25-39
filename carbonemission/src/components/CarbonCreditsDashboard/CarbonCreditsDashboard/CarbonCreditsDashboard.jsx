import React, { useState, useEffect } from 'react';

const CarbonCreditsDashboard = () => {
  const [history, setHistory] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/offset/history');
      const data = await res.json();
      setHistory(data);
    };

    const fetchTotal = async () => {
      const res = await fetch('/api/offset/total');
      const data = await res.json();
      setTotalCredits(data.totalCredits);
    };

    fetchData();
    fetchTotal();
  }, []);

  return (
    <div className="dashboard">
      <h2>Carbon Neutrality Dashboard</h2>
      <div className="total-credits">
        <h3>Total Carbon Credits Earned</h3>
        <div className="credit-value">{totalCredits.toFixed(2)}</div>
      </div>

      <div className="offset-history">
        <h3>Monthly Offset History</h3>
        <table>
          <thead>
            <tr>
              <th>Month/Year</th>
              <th>Total Offset</th>
              <th>Credits Earned</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry => (
              <tr key={entry.id}>
                <td>{entry.month}/{entry.year}</td>
                <td>{entry.total_offset.toFixed(2)} t</td>
                <td>{entry.carbon_credits.toFixed(2)}</td>
                <td>
                  <button onClick={() => showDetails(entry)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CarbonCreditsDashboard;