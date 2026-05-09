import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendVerification(false);
    setResendSuccess(false);

    try {
      const response = await axios.post('https://health-ai-platform-backend.onrender.com/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);

      // Store user info for quick access
      if (response.data.user) {
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userName', response.data.user.full_name || '');
        localStorage.setItem('profileCompleted', response.data.user.profile_completed ? 'true' : 'false');
      }

      // Redirect based on profile completion status
      if (response.data.user?.profile_completed) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/complete-profile';
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || 'Login failed. Please check your credentials.');

      // Show resend verification button if email is not verified
      if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
        setShowResendVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      await axios.post('https://health-ai-platform-backend.onrender.com/api/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch {
      // Silently handle — the API always returns success to prevent enumeration
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👋</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your Health AI account</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {showResendVerification && (
          <div className="alert alert-info" style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <span>📧 Your email hasn't been verified yet.</span>
            {resendSuccess ? (
              <span style={{ color: 'var(--success-light)', fontWeight: 500 }}>
                ✅ Verification link sent! Check your inbox.
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{ alignSelf: 'flex-start' }}
              >
                {resendLoading ? '⏳ Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="form-stack">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--primary-light)',
                  opacity: 0.9,
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="form-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}