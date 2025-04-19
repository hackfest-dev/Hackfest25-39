import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const apiBaseURL = window.location.hostname === 'localhost'
          ? 'http://localhost:5000'
          : `http://${window.location.hostname}:5000`;

        const response = await fetch(`${apiBaseURL}/api/admin/check-session`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Session check failed');
        
        const data = await response.json();
        setAuthStatus({ loading: false, isAdmin: data.isAdmin });
      } catch (error) {
        setAuthStatus({ loading: false, isAdmin: false });
      }
    };
    
    verifyAdmin();
  }, [location]);

  if (authStatus.loading) return <div>Loading...</div>;
  
  return authStatus.isAdmin 
    ? children 
    : <Navigate to="/adminlogin" state={{ from: location }} replace />;
};

export default ProtectedRoute;