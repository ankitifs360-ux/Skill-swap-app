import { Code, MessageCircle, Briefcase, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      {/* Top gradient line */}
      <div className="footer-top-line" aria-hidden="true" />

      <div className="footer-inner max-w-7xl">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <div className="footer-logo-icon">✦</div>
            <span className="footer-logo">Skill<span className="footer-logo-accent">Swap</span></span>
          </div>
          <p className="footer-tagline">
            Empowering peer-to-peer learning — teach what you know, learn what you don't.
          </p>
          <div className="footer-badge">
            <span className="footer-badge-dot" />
            Free forever · No subscriptions
          </div>
        </div>

        {/* Navigate */}
        <nav className="footer-links">
          <span className="footer-links-title">Navigate</span>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/browse" className="footer-link">Browse Skills</Link>
          <Link to="/contact" className="footer-link">Contact</Link>
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="footer-link">Terms &amp; Conditions</Link>
        </nav>

        {/* Connect */}
        <div className="footer-social">
          <span className="footer-social-title">Connect</span>
          <div className="footer-social-icons">
            <a href="https://github.com/ankitifs360-ux" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
              <Code size={17} />
            </a>
            <a href="https://x.com/ANKITRAj487002" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Twitter / X">
              <MessageCircle size={17} />
            </a>
            <a href="https://www.linkedin.com/in/ankit-raj-b87268355/" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
              <Briefcase size={17} />
            </a>
          </div>
          <p className="footer-social-note">Open to collaborations &amp; feedback</p>
        </div>
      </div>

      <div className="footer-bottom max-w-7xl">
        <div className="footer-bottom-inner">
          <p className="footer-copy">
            © {new Date().getFullYear()} SkillSwap. All rights reserved.
          </p>
          <p className="footer-made">
            Built with <Heart size={12} className="heart-icon" /> for the community
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;