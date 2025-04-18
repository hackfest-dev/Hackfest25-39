import React, { useEffect } from 'react';

import './Aboutus.css';

const Aboutus = () =>{

    useEffect(() => {
        const elements = document.querySelectorAll('.hidden');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('show');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
    
        elements.forEach((el) => observer.observe(el));
      }, []);


return(
    <div className="Aboutus">
        
        <div className='abt-sec1'>
            <h1 className='abt-heading animate__animated animate__fadeInLeft'>“Empowering Mines</h1>
            <h1 className='abt-heading animate__animated animate__fadeInLeft animate__delay-1s'> for Carbon-Free </h1>
            <h1 className='abt-heading animate__animated animate__fadeInLeft animate__delay-2s'> Tomorrow” </h1>

        </div>

        <h1 className='what_we_do hidden' >What we do?</h1>

        <div className='missi hidden'>
            <h1>Our Mission:</h1>
            <p>Our mission is to provide Indian coal mines with an advanced platform that quantifies their carbon footprint in real time and offers actionable insights to reduce emissions. we strive to facilitate informed decision-making, optimize energy use, and unlock pathways to carbon neutrality, aligning the mining sector with India’s broader climate goals.</p>
        </div>



        {/* carousdaal circle */}


<div className="container2 hidden">

  <div className="corossal1">
    <div className="aboutUs-void" id="aboutUs-void">
        <div className="aboutUs-crop">
        <ul id="aboutUs-card-ul" style={{"--count": 6}}>
            
            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >Our Mission</span><br />
                        <span>Building a platform to measure and reduce carbon emissions.</span>
                    </a>
                </div>
            </li>

            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >Why It Matters</span><br/>
                        <span>Coal mining emissions harm the environment; we provide solutions.</span>
                    </a>
                </div>
            </li>

            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >How We Help</span><br/>
                        <span>Track emissions in real-time and find reduction pathways.</span>
                    </a>
                </div>
            </li>

            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >Key Features</span><br/>
                        <span>Emission tracking, neutrality pathways, and compliance tools.</span>
                    </a>
                </div>
            </li>

            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >Innovation</span><br/>
                        <span>AI-driven analysis for carbon reduction strategies.</span>
                    </a>
                </div>
            </li>

            <li className="aboutUs-card-li">
                <div className="aboutUs-card">
                    <a href="" className="aboutUs-a">
                        <span className="aboutUs-card-title" >Our Vision</span><br/>
                        <span>Helping coal mines achieve a carbon-neutral future.</span>
                    </a>
                </div>
            </li>
            
        </ul>
        <div className="corossal-circles">
          <div className="last-circle"></div>
          <div className="second-circle"></div>
          </div>
          {/* <!-- <div className="mask"></div> --> */}
          <div className="center-circle"></div>
        </div>
    </div>
  

  </div>
  
  {/* <!-- about us vision --> */}
  <div className='vissi'>
            <h1>Our Vision:</h1>
            <p>🔹 Carbon Footprint Tracking – Measure emissions from excavation, transportation, and machinery in real time for precise tracking of direct and indirect CO2 output.  
        <br/><br/>🔹 Neutrality Pathways – Suggest customized strategies like afforestation, renewable energy, and carbon credit optimization based on mine-specific data.  
        <br/><br/>🔹 Real-time Monitoring & Reporting – Visualize emissions with interactive dashboards, predictive analytics, and dynamic graphs for informed decision-making.  
        <br/><br/>🔹 Automated Alerts & Insights – Receive instant notifications for emission breaches and AI-driven recommendations for optimized operations.  
        <br/><br/>🔹 Carbon Credit & Sustainability Benefits – Track carbon credit eligibility, explore financial incentives, and assess long-term sustainability impacts.  </p>
        </div>


  {/* <!-- corossal code  --> */}

</div>


<div className='eissi hidden'>
            <h1>Empowering Coal Mines for a Greener Future:</h1>
            <p>
            At CarbonNeutralMines, we are dedicated to transforming the coal mining industry by leveraging a data-driven approach to carbon neutrality. Our platform empowers coal mines to quantify carbon emissions, monitor environmental impact, and implement actionable sustainability strategies for a low-carbon future.</p>
        </div>


    </div>



);
};
export default Aboutus ;