import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css'; // Optional: for styling

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Determine your API base URL based on the environment
  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${apiBaseURL}/api/admin/dashboard-reports`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await res.json();
        setReports(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchReports();
  }, [apiBaseURL]);
  
  const handleVerify = async (reportId) => {
    try {
      const res = await fetch(`${apiBaseURL}/api/admin/verify-report/${reportId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        throw new Error('Failed to verify report');
      }
      // Update the local state to reflect the verification
      const updatedReports = reports.map(report => 
        report.id === reportId ? { ...report, verified: 1 } : report
      );
      setReports(updatedReports);
    } catch (err) {
      console.error(err);
      alert('Verification failed');
    }
  };
  
  // Only use verified reports for the chart data
  const verifiedReports = reports.filter(r => Number(r.verified) === 1);
  
  // For the chart, let's focus on the current year emissions
  const currentYear = new Date().getFullYear();
  const reportsForYear = verifiedReports.filter(r => r.year === currentYear);
  
  // Sum up totals per month (month indexed 0–11)
  const totalsByMonth = Array(12).fill(0);
  reportsForYear.forEach(report => {
    const monthIndex = report.month - 1;
    totalsByMonth[monthIndex] += parseFloat(report.total_emissions);
  });
  
  const chartData = {
    labels: Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString('default', { month: 'short' })
    ),
    datasets: [{
      label: `Verified Emissions in ${currentYear}`,
      data: totalsByMonth,
      borderColor: '#4bc0c0',
      fill: false,
      tension: 0.1
    }]
  };
  
  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="ad-container">
      <h1 className="ad-heading">Government Dashboard</h1>
      
      {error && <div className="ad-error">{error}</div>}
  
      <div className="ad-chart-section">
        <Line 
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Monthly Verified Emissions Overview for ${currentYear}`
              }
            }
          }}
        />
      </div>
      
      <div className="ad-report-list">
        <h2>Monthly Reports</h2>
        <table className="ad-table">
          <thead>
            <tr>
              <th>Administrator ID</th>
              <th>Mine Name</th>
              <th>Month</th>
              <th>Year</th>
              <th>Total Emissions</th>
              <th>Report</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td>{report.administrator_id}</td>
                <td>{report.mine_name}</td>
                <td>{new Date(report.year, report.month - 1).toLocaleString('default', { month: 'long' })}</td>
                <td>{report.year}</td>
                <td>{Number(report.total_emissions).toFixed(2)} kg</td>
                <td>
                  {report.report_path ? (
                    <a 
                      href={`${apiBaseURL}/api/monthly-pdf/${report.report_path}`} 
                      className="ad-pdf-link"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  ) : 'No Report'}
                </td>
                <td>
                  {report.verified ? (
                    <span className="ad-badge verified">Verified</span>
                  ) : (
                    <span className="ad-badge unverified">Unverified</span>
                  )}
                </td>
                <td>
                  {!report.verified && (
                    <button 
                      onClick={() => handleVerify(report.id)}
                      className="ad-action-btn"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
