import React, { useEffect } from 'react';
import './Homepage.css';
import dalle from'./images/dalle.webp';
import card1 from './images/WhatsApp Image 2025-02-04 at 10.07.11_6af0d937.jpg';
import card2 from './images/WhatsApp Image 2025-02-04 at 10.07.19_b2d71017.jpg';
import card3 from './images/WhatsApp Image 2025-02-04 at 10.07.29_73b3a86b.jpg';
import sustain from './images/sustain.jpg'
import minecart from './images/mining-cart-svgrepo-com.svg'

const Homepage = () => {
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

  return (
    <div className="homepage">
      {/* Carousel Section */}
      <div className="carousel-wrapper">
        <div className="carou-left">
          <h1 className="animate__animated animate__fadeInLeftBig carousal-heading">
            Coal Emission Tracker
          </h1>
          <h2 className="animate__animated animate__fadeInLeft animate__delay-1s carousal-heading2">
            "Quantify. Neutralize. Sustain."
          </h2>
        </div>

        <div className="animate__animated animate__zoomInRight animate__delay-2s container-cor">
          <div className="carousel">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="carousel__face">
                <span className="carousal-span"></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="home-hero">
        <div className="home-hero2 animate__animated hidden">
          <img src={dalle} alt="Sustainable Mining" />
        </div>
        <div className="home-hero1 animate__animated hidden">
          <h1>Empowering Sustainable Mining</h1>
          <p>As the world moves towards a greener future, the coal mining industry must adopt sustainable practices to reduce its environmental impact. Our platform empowers mining operations to track, analyze, and minimize their carbon footprint through data-driven insights and advanced emission calculations. By leveraging real-time monitoring, regulatory compliance tools, and carbon credit strategies, we help mines transition towards eco-friendly operations without compromising efficiency. Together, we can build a more sustainable and responsible mining sector that balances energy demands with environmental stewardship.</p>
        </div>
      </div>

      {/* Sustainability Section */}
      <h1 className="driving animate__animated hidden">Driving Sustainability in Coal Mining</h1>
    <div className="container-1">


  <div className="card animate__animated hidden card-3">
    <div className="image-container">
      <img 
        src={card1} 
        className="card-img-top" 
        alt="Emission Tracking" 
      />
    </div>
    <div className="card-body">
      <h2>Real-Time Emission Tracking</h2>
      <p className="card-text">
        Monitor Carbon Footprint Instantly. Gain real-time insights into emissions from excavation, 
        transportation, and equipment usage. Our platform provides live tracking and detailed reports 
        to help mining operations stay informed and take immediate action.
      </p>
    </div>
  </div>

  <div className="card animate__animated hidden card-3">
    <div className="image-container">
      <img 
        src={card2} 
        className="card-img-top" 
        alt="Regulatory Compliance" 
      />
    </div>
    <div className="card-body">
      <h2>Regulatory Compliance & Reporting</h2>
      <p className="card-text">
        Stay Ahead of Environmental Regulations. Ensure compliance with national and global 
        environmental standards. Automate reporting, generate audit-ready documentation, and 
        streamline adherence to emission regulations for a hassle-free approval process.
      </p>
    </div>
  </div>

  <div className="card animate__animated hidden card-3">
    <div className="image-container">
      <img 
        src={card3} 
        className="card-img-top" 
        alt="Carbon Credits" 
      />
    </div>
    <div className="card-body">
      <h2>Carbon Credit Optimization</h2>
      <p className="card-text">
        Turn Sustainability into Savings. Offset carbon emissions through verified carbon credit 
        strategies. Our system identifies opportunities to reduce emissions and earn credits, 
        helping mines balance environmental responsibility with financial benefits.
      </p>
    </div>
  </div>
</div>

      {/* Revolution Section */}

    <h1 className="revol animate__animated hidden">Revolutionizing Mining with Sustainability and Innovation</h1>

    <div className="main-rev">
      <div className="rev-1 animate__animated hidden">
        <img src={sustain} alt="" width="300px"/>
      </div>

      <div className="rev-2 animate__animated hidden">
        <div className="rev-2inn">
          <img src={minecart} alt="" width="30px"/><p>As the world faces growing environmental challenges, the mining industry stands at a pivotal moment. The transition to sustainable mining practices is not just necessary but inevitable. Our platform offers a comprehensive approach to help mining operations reduce their carbon footprint while boosting productivity and maintaining profitability.</p>
        </div>
        <div className="rev-2inn animate__animated hidden"><img src="/src/components/HomePage/images/mining-helmet-svgrepo-com.svg" alt="" width="30px"/>
        <p>By integrating cutting-edge technologies such as real-time emissions tracking, predictive analytics, and automated reporting, we provide mines with the tools to monitor, manage, and minimize their environmental impact effectively. Additionally, our platform supports carbon offset programs, ensuring compliance with global sustainability standards and helping businesses unlock new revenue streams through carbon credits.</p>
      </div>
        <div className="rev-2inn animate__animated hidden"><img src="/src/components/HomePage/images/mining-work-zone-svgrepo-com.svg" alt="" width="30px"/>
        <p>Through smarter, data-driven decisions, we can reshape the mining industry into a more eco-conscious, efficient, and forward-thinking sector. With our support, mining operations can thrive in the face of evolving regulations, market demands, and environmental expectations, contributing to a sustainable future for both the industry and the planet.</p>
      </div>
      </div>
    </div>

      
    </div>
  );
};

export default Homepage;