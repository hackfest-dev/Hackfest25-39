import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedAdministratorRoute = ({ children }) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isAdministrator: false
  });

  const apiBaseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const verifyAdministrator = async () => {
      try {
        const response = await fetch(`${apiBaseURL}/api/administrator/check-session`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Session check failed');
        
        const data = await response.json();
        setAuthStatus({ 
          loading: false, 
          isAdministrator: data.authenticated 
        });
      } catch (error) {
        setAuthStatus({ 
          loading: false, 
          isAdministrator: false 
        });
      }
    };
    
    verifyAdministrator();
  }, [location]); // Removed apiBaseURL from dependencies

  if (authStatus.loading) return <div>Loading...</div>;
  
  return authStatus.isAdministrator 
    ? children 
    : <Navigate to="/login_opt" state={{ from: location }} replace />; // Changed redirect target
};

export default ProtectedAdministratorRoute;