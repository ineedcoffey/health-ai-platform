import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ENGINEER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
        role
      });

      setSuccess('Registration successful! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🩺</div>
          <h2>Join Health AI</h2>
          <p>Create your account to start collaborating</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {success}</div>}

        <form onSubmit={handleRegister} className="form-stack">
          <div className="form-group">
            <label className="form-label">Academic Email <span className="required">*</span></label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
            />
            <span className="form-hint">Only .edu email addresses are accepted</span>
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">I am a... <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${role === 'ENGINEER' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRole('ENGINEER')}
                style={{ padding: '16px', flexDirection: 'column', gap: '4px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                <span>Engineer</span>
              </button>
              <button
                type="button"
                className={`btn ${role === 'HEALTHCARE' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setRole('HEALTHCARE')}
                style={{ padding: '16px', flexDirection: 'column', gap: '4px' }}
              >
                <span style={{ fontSize: '1.5rem' }}>🏥</span>
                <span>Healthcare</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success btn-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="form-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}