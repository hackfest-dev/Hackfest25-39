import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Homepage from './components/Homepage/Homepage';
import Login_opt from './components/Login/Login_opt/Login_opt'
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        
        <Route path="/" element={<Homepage />} />
        <Route path="/login_opt" element={<Login_opt />} />
        

      </Routes>
    </Router>
  );
}

export default App;