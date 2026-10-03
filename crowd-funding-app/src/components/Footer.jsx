import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-column brand-column">
          <h3 className="footer-brand">Crowd-Fund</h3>
          <p className="footer-description">
            Empowering creators and communities to bring their boldest ideas to life. 
            Back a project today.
          </p>
          <p>This website is developed to provide assistance and the fund to the people who needs in case of any emergency like flood, drought, tsunami, education fund, healthcare etc.</p>
            <p>You can support them by your small contribution.</p>
        </div>

        {/* Column 2: Navigation & Discovery */}
        <div className="footer-column">
          <h4>Explore</h4>
          <ul className="footer-links">
            <li><a href="/campaigns">All Programmes</a></li>
            <li><a href="/categories/tech">Technology</a></li>
            <li><a href="/categories/community">Community</a></li>
            <li><a href="/categories/creative">Creative Arts</a></li>
          </ul>
        </div>

        {/* Column 3: The Crucial Trust & Legal Links */}
        <div className="footer-column">
          <h4>Support & Legal</h4>
          <ul className="footer-links">
            <li><a href="/help">Connect</a></li>
            <li><a href="/trust-and-safety">Trust & Safety</a></li>
            <li><a href="/terms">Terms of Use</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Discreet Admin Link */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PlatformLogo Crowdfunding. All rights reserved.</p>
        
        {/* THE FIX: Admin login moved here, styled discreetly */}
        <a href="/admin-login" className="footer-admin-link">Admin Login</a>
      </div>
    </footer>
  );
};

export default Footer;