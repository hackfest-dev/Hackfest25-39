import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedSectorRoute = ({ children }) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isSectorAuthenticated: false
  });

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const verifySector = async () => {
      try {
        const response = await fetch(`${apiBaseURL}/api/sector/check-session`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Session check failed');
        
        const data = await response.json();
        setAuthStatus({ 
          loading: false,
          isSectorAuthenticated: data.authenticated
        });
      } catch (error) {
        setAuthStatus({ 
          loading: false,
          isSectorAuthenticated: false
        });
      }
    };
    
    verifySector();
  }, [location]); // Re-validate when location changes

  if (authStatus.loading) return <div>Loading...</div>;

  return authStatus.isSectorAuthenticated 
    ? children 
    : <Navigate to="/" state={{ from: location }} replace />;
};

export default ProtectedSectorRoute;