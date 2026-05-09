import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

// Compute a dummy match score based on various factors
const computeMatchScore = (post: any, userCity: string, userRole: string): number => {
  let score = 50; // Base score

  // City proximity bonus
  if (userCity && post.city && userCity.toLowerCase() === post.city.toLowerCase()) {
    score += 25;
  }

  // Cross-role bonus: Engineer users benefit from Healthcare posts and vice versa
  if (post.user?.role && post.user.role !== userRole) {
    score += 15;
  }

  // Project stage bonus — earlier stages need more help
  if (post.project_stage === 'IDEA') score += 5;
  if (post.project_stage === 'CONCEPT_VALIDATION') score += 3;

  // Public pitch bonus — easier to evaluate
  if (post.confidentiality_level === 'PUBLIC_PITCH') score += 5;

  // Cap at 100
  return Math.min(score, 100);
};

const getMatchColor = (score: number) => {
  if (score >= 85) return '#34d399';
  if (score >= 70) return '#22d3ee';
  if (score >= 55) return '#818cf8';
  return 'var(--text-muted)';
};

const getMatchLabel = (score: number, isAI: boolean) => {
  const prefix = isAI ? '✨ ' : '';
  if (score >= 85) return `${prefix}Excellent Match`;
  if (score >= 70) return `${prefix}Good Match`;
  if (score >= 55) return `${prefix}Moderate Match`;
  return `${prefix}Low Match`;
};

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const currentUser = getUserFromToken();
  const token = localStorage.getItem('token');

  // Fetch user profile for proximity matching
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(res.data);
      } catch {
        // Silent fail
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('https://health-ai-platform-backend.onrender.com/api/posts');
        setPosts(response.data);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Client-side filtering
  const filteredPosts = posts.filter((post: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      post.title?.toLowerCase().includes(term) ||
      post.working_domain?.toLowerCase().includes(term) ||
      post.required_expertise?.toLowerCase().includes(term) ||
      (post.short_explanation && post.short_explanation.toLowerCase().includes(term));
    const matchesRole = roleFilter === 'all' || post.user?.role === roleFilter;
    const matchesDomain = !domainFilter || post.working_domain?.toLowerCase().includes(domainFilter.toLowerCase());
    const matchesExpertise = !expertiseFilter || post.required_expertise?.toLowerCase().includes(expertiseFilter.toLowerCase());
    const matchesCity = !cityFilter || post.city?.toLowerCase().includes(cityFilter.toLowerCase());
    const matchesCountry = !countryFilter || post.country?.toLowerCase().includes(countryFilter.toLowerCase());
    const matchesStage = !stageFilter || post.project_stage === stageFilter;

    return matchesSearch && matchesRole && matchesDomain && matchesExpertise && matchesCity && matchesCountry && matchesStage;
  });

  // Sort by match score (highest first)
  const userCity = userProfile?.city || '';
  const userRole = currentUser?.role || '';
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    return computeMatchScore(b, userCity, userRole) - computeMatchScore(a, userCity, userRole);
  });

  // Extract unique values for filter dropdowns
  const uniqueDomains = [...new Set(posts.map((p: any) => p.working_domain).filter(Boolean))];
  const uniqueCountries = [...new Set(posts.map((p: any) => p.country).filter(Boolean))];
  const uniqueCities = [...new Set(posts.map((p: any) => p.city).filter(Boolean))];

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setDomainFilter('');
    setExpertiseFilter('');
    setCityFilter('');
    setCountryFilter('');
    setStageFilter('');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || domainFilter || expertiseFilter || cityFilter || countryFilter || stageFilter;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>🔍 Explore Projects</h1>
          <p>Discover collaboration opportunities across healthcare and engineering</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🎯 Filters {hasActiveFilters ? '•' : ''}
          </button>
          <Link to="/create-post" className="btn btn-primary">
            + New Post
          </Link>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍  Search by title, domain, expertise, or keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '16px', fontSize: '0.95rem' }}
            />
          </div>
          <select
            className="form-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="all">All Roles</option>
            <option value="ENGINEER">⚙️ Engineers</option>
            <option value="HEALTHCARE">🏥 Healthcare</option>
          </select>
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card animate-fade-in" style={{ marginBottom: '16px', padding: '20px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>Advanced Filters</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Domain</label>
              <select
                className="form-select"
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
              >
                <option value="">All Domains</option>
                {uniqueDomains.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Required Expertise</label>
              <input
                className="form-input"
                placeholder="e.g., Machine Learning"
                value={expertiseFilter}
                onChange={e => setExpertiseFilter(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select
                className="form-select"
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value)}
              >
                <option value="">All Countries</option>
                {uniqueCountries.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select
                className="form-select"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="">All Cities</option>
                {uniqueCities.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Project Stage</label>
              <select
                className="form-select"
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
              >
                <option value="">All Stages</option>
                <option value="IDEA">💡 Idea</option>
                <option value="CONCEPT_VALIDATION">🔬 Concept Validation</option>
                <option value="PROTOTYPE">🛠️ Prototype</option>
                <option value="PILOT_TESTING">🧪 Pilot Testing</option>
                <option value="PRE_DEPLOYMENT">🚀 Pre-Deployment</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div style={{
        marginBottom: '16px',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Showing {sortedPosts.length} of {posts.length} active projects</span>
        {userProfile?.city && (
          <span style={{ color: 'var(--accent-light)', fontSize: '0.8rem' }}>
            📍 Your location: {userProfile.city}, {userProfile.country}
          </span>
        )}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="empty-state">
          <p>Loading projects...</p>
        </div>
      ) : sortedPosts.length > 0 ? (
        <div className="stagger-children" style={{ display: 'grid', gap: '16px' }}>
          {sortedPosts.map((post: any) => {
            const isOwnPost = post.user_id === currentUser?.id;
            const hasAIScore = post.ai_score !== null && post.ai_score !== undefined;
            const matchScore = hasAIScore ? post.ai_score : computeMatchScore(post, userCity, userRole);
            const isLocalMatch = userCity && post.city && userCity.toLowerCase() === post.city.toLowerCase();

            return (
              <div
                key={post.id}
                className="card"
                style={{
                  borderColor: isLocalMatch ? 'rgba(6, 182, 212, 0.3)' : undefined,
                  boxShadow: isLocalMatch ? '0 0 20px rgba(6, 182, 212, 0.08)' : undefined,
                }}
              >
                {/* Local Match Banner */}
                {isLocalMatch && (
                  <div style={{
                    background: 'var(--accent-glow)',
                    color: 'var(--accent-light)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    marginBottom: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                  }}>
                    📍 Local Match — Same city as you!
                  </div>
                )}

                <div className="card-header">
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '8px' }}>
                      <Link
                        to={`/post/${post.id}`}
                        style={{
                          color: 'var(--primary-light)',
                          textDecoration: 'none',
                          transition: 'color 150ms ease',
                        }}
                        onMouseOver={e => (e.currentTarget.style.color = 'var(--accent-light)')}
                        onMouseOut={e => (e.currentTarget.style.color = 'var(--primary-light)')}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{post.working_domain}</span>
                      <span className="badge badge-ghost">{stageLabels[post.project_stage] || post.project_stage}</span>
                      <span className="badge badge-ghost">{collabLabels[post.collaboration_type] || post.collaboration_type}</span>
                      {post.confidentiality_level === 'MEETING_ONLY' && (
                        <span className="badge badge-warning">🔒 NDA Required</span>
                      )}
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '70px',
                  }}>
                    <div className={hasAIScore ? 'ai-sparkle-badge-wrapper' : ''} style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: getMatchColor(matchScore),
                      border: `2px solid ${getMatchColor(matchScore)}`,
                      background: `${getMatchColor(matchScore)}15`,
                      position: 'relative',
                    }}>
                      {matchScore}%
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      color: getMatchColor(matchScore),
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      {getMatchLabel(matchScore, hasAIScore)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {post.short_explanation && (
                  <div className="card-body">
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.7' }}>
                      {post.short_explanation.substring(0, 200)}
                      {post.short_explanation.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: post.user?.role === 'ENGINEER'
                        ? 'linear-gradient(135deg, var(--info), var(--primary))'
                        : 'linear-gradient(135deg, var(--accent), var(--success))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', color: 'white', fontWeight: '700', flexShrink: 0,
                    }}>
                      {post.user?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {post.user?.full_name || 'Anonymous User'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {post.user?.institution || 'Unknown Institution'}
                        {' · '}{post.user?.role === 'ENGINEER' ? '⚙️' : '🏥'}
                        {' · 📍'}{post.city}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge badge-ghost" style={{ fontSize: '0.7rem' }}>
                      {post.required_expertise}
                    </span>
                    {isOwnPost ? (
                      <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', opacity: 0.5 }}>
                        Your Post
                      </span>
                    ) : (
                      <Link to={`/meeting-request/${post.id}`} className="btn btn-primary btn-sm">
                        🤝 Request Meeting
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matching projects found</h3>
          <p>Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button className="btn btn-ghost" onClick={clearFilters} style={{ marginTop: '12px' }}>
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}