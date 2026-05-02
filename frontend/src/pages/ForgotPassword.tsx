import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="form-container animate-fade-in">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div className="verify-email-icon" style={{ background: 'var(--info-bg)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <span style={{ color: 'var(--info)' }}>📧</span>
          </div>
          <h2 style={{ marginBottom: '8px' }}>Check Your Email</h2>
          <p style={{ marginBottom: '8px' }}>
            If an account with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> exists, we've sent a password reset link.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            The link will expire in 1 hour. Check your spam folder if you don't see it.
          </p>
          <Link to="/login" className="btn btn-ghost btn-full">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔐</div>
          <h2>Forgot Password?</h2>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              autoFocus
            />
            <span className="form-hint">Enter the email address associated with your account</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="form-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
