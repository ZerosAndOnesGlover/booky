import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettingsApi, getTestimonialsApi, getAboutApi } from '../../services/api';
import './Home.css';

const SERVICES = [
  { icon: '📋', title: 'General Manuscript Consultation', desc: 'Written feedback and walkthrough covering what your manuscript needs and recommended next steps.' },
  { icon: '✏️', title: 'Developmental Editing', desc: 'Structural and language edit covering flow, transitions, tone, style, dialogue, and characterisation.' },
  { icon: '📝', title: 'Basic Copyediting', desc: 'Correction of typographical, spelling, grammatical errors, and punctuation.' },
  { icon: '📖', title: 'Heavy Copyediting', desc: 'Word-by-word edit covering grammar, usage, style, factual consistency, flow, and clarity.' },
  { icon: '🔍', title: 'Proofreading', desc: 'Final check of spelling, punctuation, and grammatical errors before publication.' },
  { icon: '📚', title: 'Publishing Support', desc: 'Manuscript formatting, book cover design, and online and print publishing facilitation.' },
];

const WHY_CHOOSE = [
  { icon: '✅', title: 'Attention to Detail', desc: 'Every word matters. We review your manuscript with meticulous care.' },
  { icon: '🎨', title: "Preserves Author's Voice", desc: 'We enhance your writing without erasing what makes it uniquely yours.' },
  { icon: '⏰', title: 'Professional & Timely', desc: 'We deliver on time, every time, without compromising on quality.' },
  { icon: '💡', title: 'Personalised Approach', desc: 'Every author is different. Your editing experience is tailored to your needs.' },
];

const Home = () => {
  const [settings, setSettings] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [about, setAbout] = useState(null);

  useEffect(() => {
    document.title = 'Booky Editing Services — Professional Editing & Publishing Support';
    getSettingsApi().then((res) => setSettings(res.data.settings)).catch(() => {});
    getTestimonialsApi().then((res) => setTestimonials(res.data.testimonials)).catch(() => {});
    getAboutApi().then((res) => setAbout(res.data.about)).catch(() => {});
  }, []);

  const whatsappHref = settings?.whatsapp_number
    ? 'https://wa.me/' + settings.whatsapp_number.replace(/\D/g, '') + '?text=' + encodeURIComponent("Hello! I'd like to book a consultation with Booky Editing Services.")
    : '#';

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <h1>Helping Authors Create Timeless Books</h1>
            <p>Professional editing and publishing support for authors who want clarity, confidence, and excellence.</p>
            <div className="hero__ctas">
              <Link to="/contact" className="btn btn-primary">Get a Quote</Link>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Book a Consultation
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container about-preview">
          <div className="about-preview__image">
            {settings?.founder_photo_url
              ? <img src={settings.founder_photo_url} alt="Booky Founder" />
              : <div className="about-preview__placeholder"></div>
            }
          </div>
          <div className="about-preview__content">
            <h2>About Booky Editing Services</h2>
            <p>{about?.founder_story || 'We are a Lagos-based editorial brand serving authors locally and internationally with passion, precision, and personalised care.'}</p>
            <Link to="/about" className="btn btn-outline">Learn More About Us</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '48px' }}>Our Editorial Services</h2>
          <div className="grid-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="card service-card">
                <span className="service-card__icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <Link to={`/contact?service=${encodeURIComponent(s.title)}`} className="service-card__link">Get a Quote</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '48px' }}>Why Choose Booky Editing Services?</h2>
          <div className="grid-4">
            {WHY_CHOOSE.map((w) => (
              <div key={w.title} className="why-card">
                <span className="why-card__icon">{w.icon}</span>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '48px' }}>What Our Authors Say</h2>
            <div className="grid-2">
              {testimonials.slice(0, 4).map((t) => (
                <div key={t.id} className="card testimonial-card">
                  <p className="testimonial-card__quote">"{t.quote}"</p>
                  <div className="testimonial-card__author">
                    <strong>{t.client_name}</strong>
                    {t.book_title && <span>{t.book_title}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-banner">
        <div className="container cta-banner__inner">
          <h2>Ready to refine your manuscript?</h2>
          <p>Let us work together to bring your story to its full potential.</p>
          <Link to="/contact" className="btn btn-white">Get Started</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
