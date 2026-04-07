import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Services.css';

const SERVICES = [
  {
    icon: '📋',
    title: 'General Manuscript Consultation',
    desc: 'A comprehensive written feedback document and walkthrough covering what your manuscript needs, what is working well, and the recommended next steps before further editing begins. Ideal for authors who need clarity before committing to a full edit.',
  },
  {
    icon: '✏️',
    title: 'Developmental Editing',
    desc: 'A structural and language-focused edit addressing flow, transitions, tone, style, dialogue, narrative pacing, characterisation, and vocabulary. Ensures the story works at a macro and scene level before line-level corrections are applied.',
  },
  {
    icon: '📝',
    title: 'Basic Copyediting',
    desc: 'Correction of typographical errors, spelling mistakes, grammatical errors, and punctuation. Targets mechanical accuracy while preserving the author\'s voice and style choices.',
  },
  {
    icon: '📖',
    title: 'Heavy Copyediting',
    desc: 'A word-by-word edit covering grammar, usage, style consistency, factual accuracy, flow, spelling, and overall clarity. Suitable for manuscripts requiring significant linguistic refinement beyond surface corrections.',
  },
  {
    icon: '🔍',
    title: 'Proofreading',
    desc: 'A final pre-publication check of spelling, punctuation, and grammatical errors. Applied after all editing rounds are complete — the last line of defence before submission or publication.',
  },
  {
    icon: '📚',
    title: 'Publishing Support',
    desc: 'Full manuscript formatting for print and digital publishing, book cover design consultation, and facilitation of online and print publishing processes. Supports authors through the technical submission and publication journey.',
  },
];

const Services = () => {
  useEffect(() => {
    document.title = 'Our Services — Booky Editing Services';
  }, []);

  return (
    <div className="services-page">
      <section className="page-hero">
        <div className="container">
          <h1>Our Editorial Services</h1>
          <p>Professional editing for every stage of your manuscript.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {SERVICES.map((service, index) => (
            <div key={service.title} className={`service-row ${index % 2 === 1 ? 'service-row--reverse' : ''}`}>
              <div className="service-row__icon-block">
                <span>{service.icon}</span>
              </div>
              <div className="service-row__content">
                <h2>{service.title}</h2>
                <p>{service.desc}</p>
                <Link to={`/contact?service=${encodeURIComponent(service.title)}`} className="btn btn-primary">Request This Service</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div className="container cta-banner__inner">
          <h2>Not sure which service you need?</h2>
          <p>Book a free consultation and we'll guide you to the right fit.</p>
          <Link to="/contact" className="btn btn-white" style={{ marginTop: '24px' }}>Book a Free Consultation</Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
