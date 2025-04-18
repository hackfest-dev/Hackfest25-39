import "./Login_opt.css";
import { NavLink, useLocation } from 'react-router-dom';

const Login_opt = () => {
  return (
    <div className="login-container">
      <h1 className="login_as">Login as </h1>

    <div className="main-boxxx">
      {/* card1 */}
      <div className="boxxx">
        <h3>ADMIN(Government)</h3>
        <p>View and approve the carbon emission data submitted by mine administrators. <br /><br />
Manage mine administrators and sector users. <br /><br />

Monitor the overall carbon footprint across all mines. <br /><br />
Access reports, simulate emission reduction strategies, and generate visualizations.</p>

    <NavLink to="/adminlogin" className="login-b">Proceed</NavLink>
      </div>
      {/* card1 end */}


      <div className="boxxx">
        <h3>Mine Administrator</h3>
        <p>Manage sectors and ensure timely submission of carbon emission data. <br /><br />

Calculate and review the carbon footprint of their mine.<br /><br />

Submit emission data to the Admin for approval.<br /><br />

Monitor historical emissions data and track improvements.</p>

<NavLink to="/administratorlogin" className="login-b">Proceed</NavLink>

      </div>


      <div className="boxxx">
        <h3>Site Manager</h3>
        <p>Provide accurate activity-based data (excavation, transport, machinery, etc.).<br /><br />

Calculate and submit the carbon footprint for their sector.<br /><br />

Ensure compliance with emission data standards.</p>

<NavLink to="/sectorlogin" className="login-b">Proceed</NavLink>

      </div>
    </div>



    </div>
    
  );
};

export default Login_opt;