import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Homepage from './components/Homepage/Homepage';
import Aboutus from './components/Aboutus/Aboutus';
import Login_opt from './components/Login/Login_opt/Login_opt';
import Adminlogin from './components/Login/Admin/Adminlogin';
import AdminApprovals from './components/Approvals/AdminApprovals';
import ProtectedRoute from './components/ProtectedRoute';
import AdministratorLogin from './components/Login/Administrator/AdministratorLogin';
import AdministratorSignup from './components/Login/Administrator/AdministratorSignup';
import ProtectedAdministratorRoute from './components/ProtectedAdministratorRoute';
import ManageSectors from './components/Managesectors/ManageSectors';
import SectorLogin from './components/Login/Sectorlogin/SectorLogin';
import ProtectedSectorRoute from './components/ProtectedSectorRoute';
import ExtractionCalculator from './components/Calculators/ExtractionCalculator';
import OBRemovalCalculator from './components/Calculators/OBRemovalCalculator';
import ProcessingCalculator from './components/Calculators/ProcessingCalculator';
import WasteManagementCalculator from './components/Calculators/WasteManagementCalculator';
import CoalDispatchCalculator from './components/Calculators/CoalDispatchCalculator';
import ExplorationCalculator from './components/Calculators/ExplorationCalculator';
import RehabilitationCalculator from './components/Calculators/RehabilitationCalculator';
import SupportInfrastructureCalculator from './components/Calculators/SupportInfrastructureCalculator';
import SectorDashboard from './components/Sectordashboard/SectorDashboard';
import AdministratorDashboard from './components/Administratordashboard/AdministratorDashboard';
import AdministratorDashboardSector from './components/Administratordashboard/AdministratorDashboardSector';
import AdminDashboard from './components/Admindashboard/AdminDashboard';
import MiningOffsetCalculator from './components/Calculators/MiningOffsetCalculator';
import CarbonCreditsDashboard from './components/CarbonCreditsDashboard/CarbonCreditsDashboard';
import AdminOffsetDashboard from './components/AdminOffsetDashboard/AdminOffsetDashboard';
import AdministratorOffsetDashboard from './components/AdministratorOffsetDashboard/AdministratorOffsetDashboard';
import AdministratorMarketplace from './components/AdministratorMarketplace/AdministratorMarketplace';
import AdminCreditManagement from './components/AdminCreditManagement/AdminCreditManagement';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/aboutus" element={<Aboutus />} />
        <Route path="/login_opt" element={<Login_opt />} />
        <Route path="/adminlogin" element={<Adminlogin />} />
        <Route path="/administratorlogin" element={<AdministratorLogin />} />
        <Route path="/administratorsignup" element={<AdministratorSignup />} />
        <Route path="/sectorlogin" element={<SectorLogin />} />
        <Route path="/carboncreditsdashboard" element={<CarbonCreditsDashboard />} />
        <Route path="/admincreditmanagement" element={<AdminCreditManagement />} />
        <Route path="/administratormarketplace" element={<AdministratorMarketplace />} />

        <Route path="/adminapprovals" element={
          <ProtectedRoute>
            <AdminApprovals />
          </ProtectedRoute>
        } />


        <Route path="/admindashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/adminoffsetdashboard" element={
          <ProtectedRoute>
            <AdminOffsetDashboard />
          </ProtectedRoute>
        } />

        <Route 
          path="/managesectors" 
          element={
            <ProtectedAdministratorRoute>
              <ManageSectors />
            </ProtectedAdministratorRoute>
          }
        />

        <Route 
          path="/administratordashboard" 
          element={
            <ProtectedAdministratorRoute>
              <AdministratorDashboard />
            </ProtectedAdministratorRoute>
          }
        />

        <Route 
          path="/miningoffsetcalculator" 
          element={
            <ProtectedAdministratorRoute>
              <MiningOffsetCalculator />
            </ProtectedAdministratorRoute>
          }
        />

        <Route 
          path="/administratoroffsetdashboard" 
          element={
            <ProtectedAdministratorRoute>
              <AdministratorOffsetDashboard />
            </ProtectedAdministratorRoute>
          }
        />

        <Route 
          path="/administratordashboardsector/:sectorId" 
          element={
            <ProtectedAdministratorRoute>
              <AdministratorDashboardSector />
            </ProtectedAdministratorRoute>
          }
        />
        
        <Route 
          path="/extractioncalculator" 
          element={
            <ProtectedSectorRoute>
              <ExtractionCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/processingcalculator" 
          element={
            <ProtectedSectorRoute>
              <ProcessingCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/OBRemovalCalculator" 
          element={
            <ProtectedSectorRoute>
              <OBRemovalCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/wastemanagementcalculator" 
          element={
            <ProtectedSectorRoute>
              <WasteManagementCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/coaldispatchcalculator" 
          element={
            <ProtectedSectorRoute>
              <CoalDispatchCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/explorationcalculator" 
          element={
            <ProtectedSectorRoute>
              <ExplorationCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/rehabilitationcalculator" 
          element={
            <ProtectedSectorRoute>
              <RehabilitationCalculator />
            </ProtectedSectorRoute>
          }
        />
        <Route 
          path="/supportinfrastructurecalculator" 
          element={
            <ProtectedSectorRoute>
              <SupportInfrastructureCalculator />
            </ProtectedSectorRoute>
          }
        />

        <Route 
          path="/sectordashboard" 
          element={
            <ProtectedSectorRoute>
              <SectorDashboard />
            </ProtectedSectorRoute>
          }
        />

        

      </Routes>
    </Router>
  );
}

export default App;