import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Homepage from './components/Homepage/Homepage';
import Aboutus from './components/Aboutus/Aboutus';
import Login_opt from './components/Login/Login_opt/Login_opt';
import Adminlogin from './components/Login/Admin/Adminlogin';
import AdministratorLogin from './components/Login/Administrator/AdministratorLogin';
<<<<<<< HEAD
=======
import AdministratorSignup from './components/Login/Administrator/AdministratorSignup';
>>>>>>> 9782da061ae7cd176f8e7fac035680241eca09ed
import Sectorlogin from './components/Login/Sectorlogin/Sectorlogin';

import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/aboutus" element={<Aboutus />} />        
        <Route path="/adminlogin" element={<Adminlogin />} />
        <Route path="/login_opt" element={<Login_opt />} />
        <Route path="/administratorlogin" element={<AdministratorLogin />} />
        <Route path="/sectorlogin" element={<Sectorlogin />} />
      </Routes>
    </Router>
  );
}

export default App;