import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../services/api';
import './Admin.css';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await forgotPasswordApi(data);
      setSubmitted(true);
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="admin-auth">
      <div className="admin-auth__box">
        <h1>Reset Password</h1>
        {submitted ? (
          <p>If that email exists, a reset link has been sent. Check your inbox.</p>
        ) : (
          <>
            <p>Enter your admin email to receive a reset link.</p>
            {serverError && <div className="admin-auth__error">{serverError}</div>}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className={errors.email ? 'error' : ''} {...register('email', { required: 'Email is required' })} />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <Link to="/admin/login" className="admin-auth__forgot">← Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
