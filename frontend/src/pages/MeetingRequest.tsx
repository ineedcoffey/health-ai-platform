import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MeetingRequest() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nda, setNda] = useState(false);

  // Exactly 3 time slots as required by SRS
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/${postId}`);
        setPost(res.data);
      } catch {
        toast.error('Failed to load post details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async () => {
    // Validate NDA
    if (!nda) {
      toast.error('You must accept the Non-Disclosure Agreement to proceed.');
      return;
    }

    // Validate all 3 time slots
    if (!slot1 || !slot2 || !slot3) {
      toast.error('Please propose exactly 3 time slots for the meeting.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/meetings', {
        post_id: postId,
        nda_accepted: true,
        proposed_time_slots: [
          { datetime: slot1, label: `Option 1: ${new Date(slot1).toLocaleString()}` },
          { datetime: slot2, label: `Option 2: ${new Date(slot2).toLocaleString()}` },
          { datetime: slot3, label: `Option 3: ${new Date(slot3).toLocaleString()}` },
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Meeting request sent successfully! 🎉');
      navigate('/inbox');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send meeting request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading post details...</p>
      </div>
    );
  }

  return (
    <div className="form-container animate-fade-in" style={{ maxWidth: '640px' }}>
      <div className="form-card">
        {/* Header */}
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🤝</div>
          <h2>Request a Meeting</h2>
          <p>Submit a collaboration meeting request</p>
        </div>

        {/* Post Preview Card */}
        {post && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <h4 style={{ color: 'var(--primary-light)', marginBottom: '6px' }}>{post.title}</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span className="badge badge-primary">{post.working_domain}</span>
              <span className="badge badge-ghost">📍 {post.city}, {post.country}</span>
              {post.confidentiality_level === 'MEETING_ONLY' && (
                <span className="badge badge-warning">🔒 NDA Required</span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Posted by {post.user?.full_name || 'Anonymous'} · {post.user?.institution || 'Unknown Institution'}
            </p>
          </div>
        )}

        <div className="form-stack">
          {/* ── NDA Section ─────────────────────────────────────────── */}
          <div className="section-title">Non-Disclosure Agreement (NDA)</div>

          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              By accepting this Non-Disclosure Agreement, you agree to the following terms:
            </p>
            <ul style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              paddingLeft: '20px',
              marginBottom: '16px',
            }}>
              <li>All information shared during this meeting is <strong style={{ color: 'var(--text-primary)' }}>strictly confidential</strong></li>
              <li>You will <strong style={{ color: 'var(--text-primary)' }}>not disclose, share, or reproduce</strong> any project details to third parties</li>
              <li>This agreement remains in effect for a period of <strong style={{ color: 'var(--text-primary)' }}>2 years</strong> from the meeting date</li>
              <li>Violation of this agreement may result in <strong style={{ color: 'var(--danger-light)' }}>legal action</strong> and <strong style={{ color: 'var(--danger-light)' }}>platform suspension</strong></li>
            </ul>

            <label className="checkbox-label" style={{
              padding: '12px 16px',
              background: nda ? 'var(--success-bg)' : 'transparent',
              border: `1px solid ${nda ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)',
            }}>
              <input
                type="checkbox"
                checked={nda}
                onChange={e => setNda(e.target.checked)}
              />
              <span style={{ color: nda ? 'var(--success-light)' : 'var(--text-secondary)' }}>
                I have read and accept the Non-Disclosure Agreement. I understand that unauthorized sharing of confidential information will result in legal consequences.
              </span>
            </label>
          </div>

          {/* ── Time Slot Proposal ───────────────────────────────────── */}
          <hr className="form-divider" />
          <div className="section-title">Propose 3 Time Slots</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Suggest exactly 3 available time slots. The post owner will select one.
          </p>

          <div className="form-group">
            <label className="form-label">
              <span style={{
                background: 'var(--primary-glow)',
                color: 'var(--primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginRight: '8px',
              }}>
                Slot 1
              </span>
              First Preference <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={slot1}
              onChange={e => setSlot1(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{
                background: 'var(--accent-glow)',
                color: 'var(--accent-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginRight: '8px',
              }}>
                Slot 2
              </span>
              Second Preference <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={slot2}
              onChange={e => setSlot2(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{
                background: 'var(--success-bg)',
                color: 'var(--success-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginRight: '8px',
              }}>
                Slot 3
              </span>
              Third Preference <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={slot3}
              onChange={e => setSlot3(e.target.value)}
              required
            />
          </div>

          {/* ── Action Buttons ───────────────────────────────────────── */}
          <hr className="form-divider" />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <button
              className="btn btn-success btn-lg"
              style={{ flex: 2 }}
              onClick={handleSubmit}
              disabled={submitting || !nda}
            >
              {submitting ? '⏳ Sending...' : '🤝 Sign NDA & Send Request'}
            </button>
          </div>

          {!nda && (
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              ⚠️ You must accept the NDA before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  );
}