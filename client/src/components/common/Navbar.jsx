import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getSettingsApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    getSettingsApi().then((res) => {
      setLogoUrl(res.data.settings.logo_url);
    }).catch(() => {});

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt="Booky Editing Services" />
          ) : (
            <span className="navbar__logo-text">Booky Editing Services</span>
          )}
        </Link>

        <button
          className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <li><NavLink to="/" end onClick={closeMenu}>Home</NavLink></li>
          <li><NavLink to="/about" onClick={closeMenu}>About</NavLink></li>
          <li><NavLink to="/services" onClick={closeMenu}>Services</NavLink></li>
          <li><NavLink to="/testimonials" onClick={closeMenu}>Testimonials</NavLink></li>
          <li><NavLink to="/blog" onClick={closeMenu}>Blog</NavLink></li>
          <li>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <span className="theme-toggle__track">
                <span className={`theme-toggle__thumb ${darkMode ? 'theme-toggle__thumb--right' : ''}`}></span>
              </span>
              <span className="theme-toggle__icon">{darkMode ? '🌙' : '☀️'}</span>
            </button>
          </li>
          <li>
            <Link to="/contact" className="navbar__cta btn btn-primary" onClick={closeMenu}>
              Get a Quote
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
