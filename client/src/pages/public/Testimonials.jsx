import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTestimonialsApi, submitPublicTestimonialApi } from '../../services/api';
import './Testimonials.css';

const StarPicker = ({ value, onChange }) => (
  <div className="star-picker">
    {[1,2,3,4,5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`star-picker__btn${n <= value ? ' star-picker__btn--active' : ''}`}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ client_name: '', quote: '', book_title: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    document.title = 'Testimonials — Booky Editing Services';
    getTestimonialsApi()
      .then((res) => setTestimonials(res.data.testimonials))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.quote.trim()) {
      setReviewError('Name and review are required.');
      return;
    }
    setSubmitting(true);
    setReviewError('');
    try {
      await submitPublicTestimonialApi(form);
      setReviewSubmitted(true);
    } catch {
      setReviewError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const renderStars = (rating = 5) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div className="testimonials-page">
      <section className="page-hero">
        <div className="container">
          <h1>What Our Authors Say</h1>
          <p>Real stories from writers we've had the privilege of working with.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="spinner"></div>
          ) : testimonials.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--color-grey)' }}>No testimonials yet. Check back soon!</p>
          ) : (
            <div className="grid-2">
              {testimonials.map((t) => (
                <div key={t.id} className="card testimonial-card">
                  <div className="testimonial-card__stars" style={{ color: '#F59E0B' }}>
                    {renderStars(t.rating)}
                  </div>
                  <p className="testimonial-card__quote">"{t.quote}"</p>
                  <div className="testimonial-card__author">
                    <strong>{t.client_name}</strong>
                    {t.book_title && <span>{t.book_title}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Public review submission */}
          <div className="review-form-section">
            <h3>Share Your Experience</h3>
            <p>Worked with us? We'd love to hear from you. Your review will appear after approval.</p>
            {reviewSubmitted ? (
              <div className="review-submitted">
                Thank you for your review! It will appear here once approved.
              </div>
            ) : (
              <form className="review-form" onSubmit={handleReviewSubmit} noValidate>
                {reviewError && <div className="form-error-banner">{reviewError}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      value={form.client_name}
                      onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))}
                      placeholder="e.g. Amara Nwosu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Book Title (optional)</label>
                    <input
                      type="text"
                      value={form.book_title}
                      onChange={(e) => setForm(f => ({ ...f, book_title: e.target.value }))}
                      placeholder="e.g. The Last Harmattan"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Rating</label>
                  <StarPicker value={form.rating} onChange={(n) => setForm(f => ({ ...f, rating: n }))} />
                </div>
                <div className="form-group">
                  <label>Your Review *</label>
                  <textarea
                    rows={4}
                    value={form.quote}
                    onChange={(e) => setForm(f => ({ ...f, quote: e.target.value }))}
                    placeholder="Tell us about your experience working with Booky Editing Services..."
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

          <div className="testimonials-cta">
            <h3>Ready to begin your own journey?</h3>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary">Get a Quote</Link>
              <Link to="/services" className="btn btn-outline">View Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Testimonials;
