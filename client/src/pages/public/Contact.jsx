import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitQuoteApi } from '../../services/api';
import './Contact.css';

const EDITING_TYPES = [
  'General Manuscript Consultation',
  'Developmental Editing',
  'Basic Copyediting',
  'Heavy Copyediting',
  'Proofreading',
  'Publishing Support',
];

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  useEffect(() => {
    document.title = 'Get a Quote — Booky Editing Services';
  }, []);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { editing_type: EDITING_TYPES.includes(preselectedService) ? preselectedService : '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'manuscript') {
          if (data.manuscript?.[0]) formData.append('manuscript', data.manuscript[0]);
        } else if (key !== 'website') {
          formData.append(key, data[key]);
        }
      });
      formData.append('website', ''); // honeypot — always empty for real users

      await submitQuoteApi(formData);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="contact-page">
      <section className="page-hero">
        <div className="container">
          <h1>Get a Quote</h1>
          <p>Tell us about your manuscript and we'll get back to you within 24–48 hours.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-inner">
          {submitted ? (
            <div className="contact-success">
              <span>✅</span>
              <h2>Thank you!</h2>
              <p>We'll get back to you within 24–48 hours.</p>
            </div>
          ) : (
            <form className="quote-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {serverError && <div className="form-error-banner">{serverError}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" className={errors.full_name ? 'error' : ''} {...register('full_name', { required: 'Full name is required' })} />
                  {errors.full_name && <span className="error-message">{errors.full_name.message}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" className={errors.email ? 'error' : ''} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
                  {errors.email && <span className="error-message">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label>Phone / WhatsApp Number *</label>
                  <input type="tel" className={errors.phone ? 'error' : ''} {...register('phone', { required: 'Phone number is required' })} />
                  {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                </div>

                <div className="form-group">
                  <label>Book Title *</label>
                  <input type="text" className={errors.book_title ? 'error' : ''} {...register('book_title', { required: 'Book title is required' })} />
                  {errors.book_title && <span className="error-message">{errors.book_title.message}</span>}
                </div>

                <div className="form-group">
                  <label>Genre *</label>
                  <input type="text" placeholder="e.g. Literary Fiction, Romance, Non-fiction" className={errors.genre ? 'error' : ''} {...register('genre', { required: 'Genre is required' })} />
                  {errors.genre && <span className="error-message">{errors.genre.message}</span>}
                </div>

                <div className="form-group">
                  <label>Word Count *</label>
                  <input type="number" min="1" className={errors.word_count ? 'error' : ''} {...register('word_count', { required: 'Word count is required', min: { value: 1, message: 'Must be at least 1' } })} />
                  {errors.word_count && <span className="error-message">{errors.word_count.message}</span>}
                </div>

                <div className="form-group">
                  <label>Type of Editing Needed *</label>
                  <select className={errors.editing_type ? 'error' : ''} {...register('editing_type', { required: 'Please select a service' })}>
                    <option value="">-- Select a service --</option>
                    {EDITING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.editing_type && <span className="error-message">{errors.editing_type.message}</span>}
                </div>

                <div className="form-group">
                  <label>Deadline *</label>
                  <input type="date" min={today} className={errors.deadline ? 'error' : ''} {...register('deadline', { required: 'Deadline is required' })} />
                  {errors.deadline && <span className="error-message">{errors.deadline.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Upload Your Manuscript (optional — .doc, .docx, .pdf, max 20MB)</label>
                <input type="file" accept=".doc,.docx,.pdf" {...register('manuscript')} />
              </div>

              {/* Honeypot */}
              <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" {...register('website')} />

              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '8px' }}>
                {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Contact;
