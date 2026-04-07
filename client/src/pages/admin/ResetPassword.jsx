import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPasswordApi } from '../../services/api';
import './Admin.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await resetPasswordApi({ token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    }
  };

  if (!token) return (
    <div className="admin-auth">
      <div className="admin-auth__box">
        <p>Invalid reset link. <Link to="/admin/forgot-password">Request a new one.</Link></p>
      </div>
    </div>
  );

  return (
    <div className="admin-auth">
      <div className="admin-auth__box">
        <h1>Set New Password</h1>
        {success ? (
          <p>Password reset successfully. Redirecting to login...</p>
        ) : (
          <>
            {serverError && <div className="admin-auth__error">{serverError}</div>}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className={errors.newPassword ? 'error' : ''} {...register('newPassword', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                {errors.newPassword && <span className="error-message">{errors.newPassword.message}</span>}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" className={errors.confirm ? 'error' : ''} {...register('confirm', { validate: (val) => val === watch('newPassword') || 'Passwords do not match' })} />
                {errors.confirm && <span className="error-message">{errors.confirm.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
