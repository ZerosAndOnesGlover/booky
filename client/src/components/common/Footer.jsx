import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettingsApi } from '../../services/api';
import './Footer.css';

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettingsApi().then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Booky Editing Services" className="footer__logo" />
          ) : (
            <span className="footer__logo-text">Booky Editing Services</span>
          )}
          <p>Professional editing and publishing support for authors who want clarity, confidence, and excellence.</p>
        </div>

        <div className="footer__links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/testimonials">Testimonials</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/contact">Get a Quote</Link></li>
          </ul>
        </div>

        <div className="footer__contact">
          <h4>Contact</h4>
          {settings?.contact_email && (
            <p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>
          )}
          {settings?.whatsapp_number && (
            <p>
              <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </p>
          )}
          <div className="footer__social">
            {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {settings?.twitter_url && <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer">Twitter</a>}
            {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a>}
            {settings?.linkedin_url && <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>&copy; {new Date().getFullYear()} Booky Editing Services. All rights reserved.</p>
          <p className="footer__maker">
            Built by{' '}
            <a href="https://adebayoglover.vercel.app" target="_blank" rel="noopener noreferrer">
              Adebayo Glover
            </a>
            {' '}for GloverSoft Inc.
          </p>
          <Link to="/admin/login" className="footer__admin-link">Admin</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
