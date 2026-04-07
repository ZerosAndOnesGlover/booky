import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAboutApi, getSettingsApi } from '../../services/api';
import './About.css';

const About = () => {
  const [about, setAbout] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    document.title = 'About Us — Booky Editing Services';
    getAboutApi().then((res) => setAbout(res.data.about)).catch(() => {});
    getSettingsApi().then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  const values = about ? [
    { label: about.value_1_label, desc: about.value_1_description },
    { label: about.value_2_label, desc: about.value_2_description },
    { label: about.value_3_label, desc: about.value_3_description },
    { label: about.value_4_label, desc: about.value_4_description },
  ] : [];

  return (
    <div className="about-page">
      <section className="page-hero">
        <div className="container">
          <h1>About Booky Editing Services</h1>
          <p>The story behind our passion for helping authors create timeless books.</p>
        </div>
      </section>

      <section className="section">
        <div className="container about-founder">
          <div className="about-founder__image">
            {settings?.founder_photo_url ? (
              <img src={settings.founder_photo_url} alt="Booky Founder" />
            ) : (
              <div className="about-founder__placeholder"></div>
            )}
          </div>
          <div className="about-founder__content">
            <h2>Our Story</h2>
            <p>{about?.founder_story || 'We are a Lagos-based editorial brand dedicated to helping authors craft their best work.'}</p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-2 mission-vision">
            <div className="card">
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <h3>Our Mission</h3>
              <p>{about?.mission || 'Supporting authors in creating timeless books.'}</p>
            </div>
            <div className="card">
              <span style={{ fontSize: '2rem' }}>🌍</span>
              <h3>Our Vision</h3>
              <p>{about?.vision || 'Becoming a trusted global editing and publishing brand.'}</p>
            </div>
          </div>
        </div>
      </section>

      {values.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '48px' }}>Our Brand Values</h2>
            <div className="grid-4">
              {values.map((v) => (
                <div key={v.label} className="value-card card">
                  <h4>{v.label}</h4>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-banner">
        <div className="container cta-banner__inner">
          <h2>Ready to start your editing journey?</h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            <Link to="/services" className="btn btn-white">View Our Services</Link>
            <Link to="/contact" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>Get a Quote</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
