import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginApi, verifyOtpApi } from '../../services/api';
import './Admin.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await loginApi(data);
      if (res.data.requiresOtp) {
        setPendingEmail(data.email);
        setOtpStep(true);
      } else {
        login(res.data.token, res.data.user);
        navigate('/admin');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setOtpError('Please enter the 6-digit code.');
      return;
    }
    setOtpSubmitting(true);
    try {
      const res = await verifyOtpApi({ email: pendingEmail, otp });
      if (res.data.deviceToken) {
        localStorage.setItem('booky_device_id', res.data.deviceToken);
      }
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please try again.');
    }
    setOtpSubmitting(false);
  };

  if (otpStep) {
    return (
      <div className="admin-auth">
        <div className="admin-auth__box">
          <h1>Verify Your Identity</h1>
          <p>A 6-digit code was sent to <strong>bookyeditingservices@gmail.com</strong>. Enter it below to continue.</p>

          {otpError && <div className="admin-auth__error">{otpError}</div>}

          <form onSubmit={onOtpSubmit} noValidate>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' }}
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={otpSubmitting}>
              {otpSubmitting ? 'Verifying...' : 'Verify →'}
            </button>
          </form>

          <button
            type="button"
            className="admin-auth__forgot"
            style={{ marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => { setOtpStep(false); setOtp(''); setOtpError(''); }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth__box">
        <h1>Booky Admin</h1>
        <p>Sign in to manage your website</p>

        {serverError && <div className="admin-auth__error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className={errors.email ? 'error' : ''}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="admin-auth__password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className={errors.password ? 'error' : ''}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="admin-auth__eye"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login →'}
          </button>
        </form>

        <Link to="/admin/forgot-password" className="admin-auth__forgot">Forgot password?</Link>
      </div>
    </div>
  );
};

export default Login;
