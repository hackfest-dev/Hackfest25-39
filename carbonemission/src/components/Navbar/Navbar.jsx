import React, { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdministratorLoggedIn, setIsAdministratorLoggedIn] = useState(false);
  const [currentSector, setCurrentSector] = useState(null);
  const location = useLocation();

  const apiBaseURL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  // Session check functions
  const checkAdminSession = async () => {
    try {
      const response = await fetch(`${apiBaseURL}/api/admin/check-session`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Session check failed');
      const data = await response.json();
      setIsAdminLoggedIn(data.isAdmin);
    } catch (error) {
      setIsAdminLoggedIn(false);
    }
  };

  const checkAdministratorSession = async () => {
    try {
      const response = await fetch(`${apiBaseURL}/api/administrator/check-session`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Session check failed');
      const data = await response.json();
      setIsAdministratorLoggedIn(data.authenticated);
    } catch (error) {
      setIsAdministratorLoggedIn(false);
    }
  };

  const checkSectorSession = async () => {
    try {
      const response = await fetch(`${apiBaseURL}/api/sector/check-session`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Session check failed');
      
      const data = await response.json();
      console.log('Sector Session Response:', data); // Add this
      
      setCurrentSector(data.authenticated ? {
        id: data.sector_id,
        category: data.sector_name?.trim()
      } : null);
    } catch (error) {
      console.error('Sector session check error:', error);
      setCurrentSector(null);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };

    const initialize = async () => {
      checkMobile();
      await checkAdminSession();
      await checkAdministratorSession();
      await checkSectorSession();
    };

    initialize();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    checkAdminSession();
    checkAdministratorSession();
    checkSectorSession();
  }, [location]);

  const handleLogout = async () => {
    try {
      let logoutEndpoint = '/api/admin/logout';
      if (isAdministratorLoggedIn) logoutEndpoint = '/api/administrator/logout';
      if (currentSector) logoutEndpoint = '/api/sector/logout';

      const response = await fetch(`${apiBaseURL}${logoutEndpoint}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setIsAdminLoggedIn(false);
        setIsAdministratorLoggedIn(false);
        setCurrentSector(null);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCalculatorRoute = () => {
    if (!currentSector) return null;
    
    const calculatorRoutes = {
      'Waste Management Sector': '/wastemanagementcalculator',
      'Extraction Sector': '/extractioncalculator',
      'Overburden (OB) Removal Sector': '/obremovalcalculator',
      'Coal Processing & Handling Sector': '/processingcalculator',
      'Coal Dispatch Sector': '/coaldispatchcalculator',  // Removed trailing space
      'Exploration Sector': '/explorationcalculator',     // Removed trailing space
      'Rehabilitation Sector': '/rehabilitationcalculator',
      'Support Infrastructure Sector': '/supportinfrastructurecalculator',  // Removed leading space
    };
  
    console.log('Current Sector:', currentSector.category);
    console.log('Mapped Route:', calculatorRoutes[currentSector.category]);
    
    return calculatorRoutes[currentSector.category] || null;
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    ...(currentSector && getCalculatorRoute() ? [
      { 
        name: 'Calculator', 
        path: getCalculatorRoute(),
        className: 'calculator-link' 
      }
    ] : []),
    ...(currentSector ? [{ name: 'Sector Dashboard', path: '/sectordashboard' }] : []),
    { name: 'Reports', path: '/reports' },
    { name: 'About Us', path: '/Aboutus' },
    ...(isAdminLoggedIn ? [{ name: 'Approval Requests', path: '/adminapprovals' },
      { name: 'Admin Dashboard', path: '/admindashboard' },
    { name: 'Offset Dashboard', path:'/adminoffsetdashboard'},  
    { name: 'CreditManagement', path:'/admincreditmanagement'}
  ] : []),
    
    ...(isAdministratorLoggedIn ? [{ name: 'Manage Sectors', path: '/managesectors' },
    { name: 'Administrator dashboard', path: '/administratordashboard' },
     {name: 'Offsetcalculator', path: '/miningoffsetcalculator' },
    {name: 'Offset Dashboard', path: '/administratoroffsetdashboard'},
    {name: 'Marketplace', path: '/administratormarketplace'}
  ] : []),
  ];

  // Debug logging
  console.log('Navbar state:', {
    isAdminLoggedIn,
    isAdministratorLoggedIn,
    currentSector,
    navItems
  });

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/">
            <img
              src="/logo.jpg"
              alt="Logo"
              width={50}
              height={50}
              className='nav-logo'
            />
          </NavLink>
        </div>

        <div className={`nav-items ${isOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''} ${item.className || ''}`
              }
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
          
          {(isAdminLoggedIn || isAdministratorLoggedIn || currentSector) ? (
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              LOGOUT
            </button>
          ) : (
            <NavLink 
              to="/login_opt" 
              className="login-btn mobile-login"
              onClick={() => setIsOpen(false)}
            >
              LOGIN
            </NavLink>
          )}
        </div>

        {!(isAdminLoggedIn || isAdministratorLoggedIn || currentSector) && (
          <NavLink to="/login_opt" className="login-btn desktop-login">
            LOGIN
          </NavLink>
        )}

        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;