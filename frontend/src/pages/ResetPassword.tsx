import { useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Show error if no token in URL
  if (!token) {
    return (
      <div className="form-container animate-fade-in">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div className="verify-email-icon verify-error-icon">
            <span>✕</span>
          </div>
          <h2 style={{ marginBottom: '8px', color: 'var(--danger-light)' }}>Invalid Reset Link</h2>
          <p style={{ marginBottom: '24px' }}>No reset token was found. Please request a new password reset.</p>
          <Link to="/forgot-password" className="btn btn-primary btn-full">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        password
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-container animate-fade-in">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div className="verify-email-icon verify-success-icon">
            <span>✓</span>
          </div>
          <h2 style={{ marginBottom: '8px', color: 'var(--success-light)' }}>Password Reset!</h2>
          <p style={{ marginBottom: '24px' }}>
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg btn-full">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔑</div>
          <h2>Set New Password</h2>
          <p>Choose a strong password for your account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">New Password <span className="required">*</span></label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password <span className="required">*</span></label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              required
              minLength={8}
            />
          </div>

          {/* Password strength indicator */}
          <div className="password-strength">
            <div className="password-strength-bar">
              <div
                className={`password-strength-fill ${
                  password.length === 0 ? '' :
                  password.length < 8 ? 'strength-weak' :
                  password.length < 12 ? 'strength-medium' :
                  'strength-strong'
                }`}
                style={{
                  width: password.length === 0 ? '0%' :
                         password.length < 8 ? '33%' :
                         password.length < 12 ? '66%' : '100%'
                }}
              ></div>
            </div>
            <span className="password-strength-label">
              {password.length === 0 ? '' :
               password.length < 8 ? 'Weak — needs 8+ characters' :
               password.length < 12 ? 'Good' :
               'Strong'}
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
