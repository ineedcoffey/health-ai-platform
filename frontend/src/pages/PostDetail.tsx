import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper: decode JWT
const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const stageLabels: Record<string, string> = {
  IDEA: '💡 Idea',
  CONCEPT_VALIDATION: '🔬 Concept Validation',
  PROTOTYPE: '🛠️ Prototype',
  PILOT_TESTING: '🧪 Pilot Testing',
  PRE_DEPLOYMENT: '🚀 Pre-Deployment',
};

const collabLabels: Record<string, string> = {
  ADVISOR: '📋 Advisor',
  COFOUNDER: '🤝 Co-Founder',
  RESEARCH_PARTNER: '🔬 Research Partner',
};

// Score color helper
const getScoreColor = (score: number) => {
  if (score >= 85) return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
  if (score >= 70) return { color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' };
  if (score >= 55) return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' };
  return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return 'Excellent Synergy';
  if (score >= 70) return 'Strong Potential';
  if (score >= 55) return 'Good Foundation';
  return 'Moderate Fit';
};

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = getUserFromToken();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`https://health-ai-platform-backend.onrender.com/api/posts/${postId}`);
        setPost(res.data);
      } catch {
        toast.error('Failed to load post details.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // Poll for AI insight if not yet available
  useEffect(() => {
    if (!post || (post.ai_score !== null && post.ai_score !== undefined)) return;

    setAiLoading(true);
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`https://health-ai-platform-backend.onrender.com/api/posts/${postId}/ai-insight`);
        if (res.data.status === 'complete') {
          setPost((prev: any) => ({
            ...prev,
            ai_score: res.data.ai_score,
            ai_insight: res.data.ai_insight,
          }));
          setAiLoading(false);
          clearInterval(interval);
        }
      } catch {
        // Silent retry
      }
    }, 2000);

    // Cleanup
    return () => clearInterval(interval);
  }, [post?.id, post?.ai_score]);

  // Re-analyze handler
  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await axios.post(
        `https://health-ai-platform-backend.onrender.com/api/posts/${postId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost((prev: any) => ({
        ...prev,
        ai_score: res.data.ai_score,
        ai_insight: res.data.ai_insight,
      }));
      toast.success('AI insights regenerated! ✨');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to re-analyze.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="verify-spinner" style={{ margin: '0 auto 16px' }} />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = currentUser?.id === post.user_id;
  const hasAI = post.ai_score !== null && post.ai_score !== undefined;
  const scoreColors = hasAI ? getScoreColor(post.ai_score) : null;

  // Calculate circumference for the score gauge
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = hasAI ? circumference - (post.ai_score / 100) * circumference : circumference;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
        >
          ← Back to Explore
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          POST DETAILS CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Header */}
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '1.6rem',
              color: 'var(--primary-light)',
              marginBottom: '12px',
              lineHeight: '1.3',
            }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{post.working_domain}</span>
              <span className="badge badge-ghost">
                {stageLabels[post.project_stage] || post.project_stage}
              </span>
              <span className="badge badge-ghost">
                {collabLabels[post.collaboration_type] || post.collaboration_type}
              </span>
              {post.confidentiality_level === 'MEETING_ONLY' && (
                <span className="badge badge-warning">🔒 NDA Required</span>
              )}
              <span className="badge badge-ghost">📍 {post.city}, {post.country}</span>
            </div>
          </div>
        </div>

        {/* Author */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: post.user?.role === 'ENGINEER'
              ? 'linear-gradient(135deg, var(--info), var(--primary))'
              : 'linear-gradient(135deg, var(--accent), var(--success))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', color: 'white', fontWeight: '700', flexShrink: 0,
          }}>
            {post.user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {post.user?.full_name || 'Anonymous User'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {post.user?.institution || 'Unknown Institution'}
              {' · '}{post.user?.role === 'ENGINEER' ? '⚙️ Engineer' : '🏥 Healthcare'}
              {' · 📍 '}{post.user?.city || post.city}
            </div>
          </div>
          {!isOwner && (
            <Link
              to={`/meeting-request/${post.id}`}
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              🤝 Request Meeting
            </Link>
          )}
        </div>

        {/* Description */}
        {post.short_explanation && (
          <div style={{ marginBottom: '20px' }}>
            <div className="section-title">Project Description</div>
            <p style={{
              fontSize: '0.92rem',
              lineHeight: '1.8',
              color: 'var(--text-secondary)',
            }}>
              {post.short_explanation}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <DetailItem label="Required Expertise" value={post.required_expertise} />
          {post.healthcare_expertise_needed && (
            <DetailItem label="Healthcare Expertise Needed" value={post.healthcare_expertise_needed} />
          )}
          {post.high_level_idea && (
            <DetailItem label="High-Level Idea" value={post.high_level_idea} />
          )}
          {post.desired_technical_expertise && (
            <DetailItem label="Desired Technical Expertise" value={post.desired_technical_expertise} />
          )}
          {post.level_of_commitment && (
            <DetailItem label="Commitment Level" value={post.level_of_commitment} />
          )}
          <DetailItem
            label="Confidentiality"
            value={post.confidentiality_level === 'PUBLIC_PITCH' ? '🌐 Public Pitch' : '🔒 Meeting Only'}
          />
          <DetailItem
            label="Posted"
            value={new Date(post.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          AI INSIGHT CARD — Sparkle/Glassmorphism Theme
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="ai-insight-card" id="ai-insight-section">
        {/* Card Header */}
        <div className="ai-insight-header">
          <div className="ai-insight-title">
            <span className="ai-sparkle-icon">✨</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                AI Match Insight
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Powered by Health AI Analysis Engine
              </p>
            </div>
          </div>
          {isOwner && hasAI && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              style={{ fontSize: '0.78rem' }}
            >
              {reanalyzing ? '⏳ Analyzing...' : '🔄 Re-analyze'}
            </button>
          )}
        </div>

        {/* AI Content */}
        {aiLoading || (!hasAI && post.status === 'ACTIVE') ? (
          /* ── Shimmer Loading State ─────────────────────────────────── */
          <div className="ai-shimmer-container">
            <div className="ai-shimmer-icon">
              <div className="verify-spinner" style={{
                width: '28px',
                height: '28px',
                borderWidth: '2px',
                borderTopColor: 'var(--primary-light)',
              }} />
            </div>
            <div className="ai-shimmer-text">
              <p style={{
                color: 'var(--primary-light)',
                fontWeight: '600',
                fontSize: '0.9rem',
                marginBottom: '6px',
              }}>
                Generating AI Insights...
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Analyzing interdisciplinary synergy potential
              </p>
            </div>
            <div className="ai-shimmer-bars">
              <div className="ai-shimmer-bar" style={{ width: '100%' }} />
              <div className="ai-shimmer-bar" style={{ width: '85%', animationDelay: '0.15s' }} />
              <div className="ai-shimmer-bar" style={{ width: '70%', animationDelay: '0.3s' }} />
            </div>
          </div>
        ) : hasAI ? (
          /* ── AI Results ────────────────────────────────────────────── */
          <div className="ai-insight-content">
            {/* Score Gauge */}
            <div className="ai-score-section">
              <div className="ai-score-gauge">
                <svg viewBox="0 0 100 100" className="ai-score-svg">
                  {/* Background circle */}
                  <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="6"
                  />
                  {/* Score arc */}
                  <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={scoreColors!.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={scoreOffset}
                    transform="rotate(-90 50 50)"
                    className="ai-score-arc"
                    style={{
                      filter: `drop-shadow(0 0 6px ${scoreColors!.color}50)`,
                    }}
                  />
                </svg>
                <div className="ai-score-value">
                  <span className="ai-score-number" style={{ color: scoreColors!.color }}>
                    {post.ai_score}
                  </span>
                  <span className="ai-score-percent" style={{ color: scoreColors!.color }}>%</span>
                </div>
              </div>
              <div className="ai-score-label" style={{ color: scoreColors!.color }}>
                {getScoreLabel(post.ai_score)}
              </div>
              <div className="ai-score-sublabel">Match Score</div>
            </div>

            {/* Recommendation */}
            <div className="ai-recommendation-section">
              <div className="ai-recommendation-label">
                <span style={{ fontSize: '0.85rem' }}>🧠</span>
                AI Recommendation
              </div>
              <p className="ai-recommendation-text">
                {post.ai_insight}
              </p>

              {/* Interdisciplinary badge */}
              <div className="ai-synergy-badge">
                <span>🔬</span>
                <span>Doctor-Engineer Synergy Analysis</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── No Analysis Available ────────────────────────────────── */
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
          }}>
            <p>AI analysis is available for active posts.</p>
            {isOwner && post.status === 'DRAFT' && (
              <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                Publish your post to generate AI insights.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {!isOwner && post.status === 'ACTIVE' && (
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Link
            to={`/meeting-request/${post.id}`}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '280px' }}
          >
            🤝 Request a Meeting with {post.user?.full_name?.split(' ')[0] || 'Author'}
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper component for detail items
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        fontSize: '0.72rem',
        fontWeight: '600',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.88rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
      }}>
        {value}
      </div>
    </div>
  );
}
