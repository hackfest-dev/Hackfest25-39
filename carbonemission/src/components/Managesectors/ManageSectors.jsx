import React, { useState, useEffect } from 'react';
import './ManageSectors.css';

const ManageSectors = () => {
  const [sectors, setSectors] = useState([]);
  const [formData, setFormData] = useState({
    sector_id: '',
    sector_category: '',
    sector_email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sectorCategories = [
    'Extraction Sector',
    'Overburden (OB) Removal Sector',
    'Coal Processing & Handling Sector',
    'Waste Management Sector',
    'Support Infrastructure Sector',
    'Coal Dispatch Sector',
    'Rehabilitation Sector',
    'Exploration Sector'
  ];



export default ManageSectors;