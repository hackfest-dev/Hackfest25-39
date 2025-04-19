import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Approvals.css';

const AdminApprovals = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getApiBaseUrl = () => {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : `http://${window.location.hostname}:5000`;
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/admin/pending-requests`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch requests');
      }

      const data = await response.json();
      setPendingRequests(data);
      setError('');
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Unauthorized')) {
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/approve-administrator/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process request');
      }

      await fetchPendingRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/check-session`, {
          credentials: 'include'
        });
        if (!response.ok) navigate('/admin-login');
      } catch (err) {
        navigate('/admin-login');
      }
    };
    
    checkSession().then(fetchPendingRequests);
  }, []);

  if (loading) {
    return <div className="loading-container">Loading pending requests...</div>;
  }

  return (
    <div className="aa-container">
      <h2 className="aa-heading">Pending Mine Administrator Approvals</h2>
      {error && <div className="aa-error">{error}</div>}
      
      {pendingRequests.length === 0 ? (
        <p className="aa-no-requests">No pending requests found</p>
      ) : (
        <div className="aa-requests-table">
          <div className="aa-table-header">
            <div>Administrator ID</div>
            <div>Mine Name</div>
            <div>Mine Location</div>
            <div>Mine Type</div>
            <div>License</div>
            <div>Actions</div>
          </div>
  
          {pendingRequests.map((request) => (
            <div className="aa-table-row" key={request.request_id}>
              <div data-label="Admin ID">{request.administrator_id}</div>
              <div data-label="Mine Name">{request.mine_name}</div>
              <div data-label="Location">{request.mine_location}</div>
              <div data-label="Type">{request.mine_type}</div>
              <div data-label="License">
                <a 
                  href={`${getApiBaseUrl()}/api/license/${request.administrator_id}`} 
                  className="aa-license-link"
                  // ... rest of anchor props
                >
                  View License
                </a>
              </div>
              <div data-label="Actions" className="aa-action-buttons">
                <button 
                  onClick={() => handleDecision(request.request_id, 'approve')}
                  className="aa-approve-btn"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleDecision(request.request_id, 'reject')}
                  className="aa-reject-btn"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;