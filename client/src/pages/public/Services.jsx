import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettingsApi } from '../../services/api';
import { setSEO } from '../../utils/seo';
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
  const [inquiryFormUrl, setInquiryFormUrl] = useState(null);

  useEffect(() => {
    getSettingsApi().then((res) => {
      const { manuscript_inquiry_form_url, manuscript_inquiry_form_enabled } = res.data.settings;
      setInquiryFormUrl(manuscript_inquiry_form_enabled !== false && manuscript_inquiry_form_url ? manuscript_inquiry_form_url : null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSEO({
      title: 'Editorial Services',
      subtitle: 'Manuscript Editing & Publishing Support',
      description: 'Explore our full range of editorial services — manuscript consultation, developmental editing, copyediting, proofreading, and publishing support tailored for every author.',
      keywords: 'manuscript consultation, developmental editing, copyediting, proofreading, book formatting, publishing support, editorial services Nigeria, book editor Lagos',
    });
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
          {inquiryFormUrl ? (
            <>
              <p>Choose how you'd like to get started:</p>
              <div className="cta-options">
                <div className="cta-option">
                  <span className="cta-option__icon">📋</span>
                  <h3>Manuscript Inquiry Form</h3>
                  <p>Answer a few questions about your manuscript and we'll recommend the right service for you.</p>
                  <a href={inquiryFormUrl} target="_blank" rel="noopener noreferrer" className="btn btn-white">Start Your Inquiry</a>
                </div>
                <div className="cta-options__divider">or</div>
                <div className="cta-option">
                  <span className="cta-option__icon">💬</span>
                  <h3>Book a Free Consultation</h3>
                  <p>Prefer to talk it through? Submit a quote request and we'll guide you to the right fit.</p>
                  <Link to="/contact" className="btn btn-white">Get in Touch</Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Book a free consultation and we'll guide you to the right fit.</p>
              <Link to="/contact" className="btn btn-white" style={{ marginTop: '24px' }}>Book a Free Consultation</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;
