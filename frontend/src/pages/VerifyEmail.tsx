import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="form-container animate-fade-in">
      <div className="form-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="verify-email-icon">
              <div className="verify-spinner"></div>
            </div>
            <h2 style={{ marginBottom: '8px' }}>Verifying Your Email</h2>
            <p>Please wait while we confirm your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-email-icon verify-success-icon">
              <span>✓</span>
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--success-light)' }}>Email Verified!</h2>
            <p style={{ marginBottom: '24px' }}>{message}</p>
            <Link to="/login" className="btn btn-primary btn-lg btn-full">
              Sign In to Your Account
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-email-icon verify-error-icon">
              <span>✕</span>
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--danger-light)' }}>Verification Failed</h2>
            <p style={{ marginBottom: '24px' }}>{message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/login" className="btn btn-primary btn-full">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
