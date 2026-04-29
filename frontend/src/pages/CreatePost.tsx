import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper: decode JWT to get user role
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

export default function CreatePost() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = getUserFromToken();
  const userRole: string = user?.role || 'ENGINEER';

  // Form state
  const [title, setTitle] = useState('');
  const [workingDomain, setWorkingDomain] = useState('');
  const [requiredExpertise, setRequiredExpertise] = useState('');
  const [shortExplanation, setShortExplanation] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState('PUBLIC_PITCH');
  const [collaborationType, setCollaborationType] = useState('ADVISOR');
  const [projectStage, setProjectStage] = useState('IDEA');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  // Engineer-specific fields
  const [healthcareExpertiseNeeded, setHealthcareExpertiseNeeded] = useState('');
  const [highLevelIdea, setHighLevelIdea] = useState('');

  // Healthcare-specific fields
  const [desiredTechnicalExpertise, setDesiredTechnicalExpertise] = useState('');
  const [levelOfCommitment, setLevelOfCommitment] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Pre-fill location from profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.city) setCity(res.data.city);
        if (res.data.country) setCountry(res.data.country);
      } catch {
        // Silent fail — user can fill manually
      }
    };
    fetchProfile();
  }, [token]);

  const handleSubmit = async (saveAsDraft: boolean) => {
    if (!title.trim() || !workingDomain.trim() || !requiredExpertise.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/posts', {
        title,
        working_domain: workingDomain,
        required_expertise: requiredExpertise,
        short_explanation: confidentialityLevel === 'MEETING_ONLY' ? null : shortExplanation,
        confidentiality_level: confidentialityLevel,
        collaboration_type: collaborationType,
        project_stage: projectStage,
        city: city || 'Online',
        country: country || 'Not specified',
        auto_close_enabled: autoClose,
        expiry_date: autoClose && expiryDate ? expiryDate : null,
        status: saveAsDraft ? 'DRAFT' : 'ACTIVE',
        // Role-conditional fields
        healthcare_expertise_needed: userRole === 'ENGINEER' ? healthcareExpertiseNeeded : null,
        high_level_idea: userRole === 'ENGINEER' ? highLevelIdea : null,
        desired_technical_expertise: userRole === 'HEALTHCARE' ? desiredTechnicalExpertise : null,
        level_of_commitment: userRole === 'HEALTHCARE' ? levelOfCommitment : null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(saveAsDraft ? 'Post saved as draft!' : 'Post published successfully! 🚀');
      navigate(saveAsDraft ? '/my-posts' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container animate-fade-in" style={{ maxWidth: '680px' }}>
      <div className="form-card">
        {/* Header */}
        <div className="form-card-header">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚀</div>
          <h2>Create New Post</h2>
          <p>Share your project idea and find the perfect collaborator</p>
          <div style={{ marginTop: '12px' }}>
            <span className={`badge ${userRole === 'ENGINEER' ? 'badge-info' : 'badge-accent'}`}>
              {userRole === 'ENGINEER' ? '⚙️ Engineer' : '🏥 Healthcare'} Mode
            </span>
          </div>
        </div>

        <div className="form-stack">
          {/* ── Basic Information ────────────────────────────────────────── */}
          <div className="section-title">Basic Information</div>

          <div className="form-group">
            <label className="form-label">Project Title <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="e.g., AI-Powered ECG Anomaly Detection"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Working Domain <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="e.g., Cardiology, Radiology"
                value={workingDomain}
                onChange={e => setWorkingDomain(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Required Expertise <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="e.g., Deep Learning, Clinical Trials"
                value={requiredExpertise}
                onChange={e => setRequiredExpertise(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ── Confidentiality & Details ─────────────────────────────── */}
          <hr className="form-divider" />
          <div className="section-title">Confidentiality & Details</div>

          <div className="form-group">
            <label className="form-label">Confidentiality Level</label>
            <select
              className="form-select"
              value={confidentialityLevel}
              onChange={e => setConfidentialityLevel(e.target.value)}
            >
              <option value="PUBLIC_PITCH">🌐 Public Pitch — Visible to everyone</option>
              <option value="MEETING_ONLY">🔒 Meeting Only — Details shared after NDA</option>
            </select>
            <span className="form-hint">
              {confidentialityLevel === 'MEETING_ONLY'
                ? 'Your short explanation will be hidden. Details shared only after an NDA meeting.'
                : 'Your pitch will be publicly visible to all platform users.'}
            </span>
          </div>

          {/* Short Explanation — hidden when MEETING_ONLY */}
          {confidentialityLevel === 'PUBLIC_PITCH' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Short Explanation</label>
              <textarea
                className="form-textarea"
                placeholder="Briefly describe your project idea, goals, and what you're looking for..."
                value={shortExplanation}
                onChange={e => setShortExplanation(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* ── Role-Specific Fields ─────────────────────────────────── */}
          <hr className="form-divider" />
          <div className="section-title">
            {userRole === 'ENGINEER' ? '⚙️ Engineer-Specific Details' : '🏥 Healthcare-Specific Details'}
          </div>

          {userRole === 'ENGINEER' ? (
            <>
              <div className="form-group animate-fade-in">
                <label className="form-label">Healthcare Expertise Needed</label>
                <textarea
                  className="form-textarea"
                  placeholder="What kind of medical/clinical expertise are you looking for? (e.g., Cardiologist for clinical validation)"
                  value={healthcareExpertiseNeeded}
                  onChange={e => setHealthcareExpertiseNeeded(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group animate-fade-in">
                <label className="form-label">High-Level Idea</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your technical approach or innovation at a high level..."
                  value={highLevelIdea}
                  onChange={e => setHighLevelIdea(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group animate-fade-in">
                <label className="form-label">Desired Technical Expertise</label>
                <textarea
                  className="form-textarea"
                  placeholder="What technical skills do you need? (e.g., ML Engineer with NLP experience)"
                  value={desiredTechnicalExpertise}
                  onChange={e => setDesiredTechnicalExpertise(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group animate-fade-in">
                <label className="form-label">Level of Commitment Required</label>
                <select
                  className="form-select"
                  value={levelOfCommitment}
                  onChange={e => setLevelOfCommitment(e.target.value)}
                >
                  <option value="">Select commitment level...</option>
                  <option value="part-time">Part-time (~10 hrs/week)</option>
                  <option value="half-time">Half-time (~20 hrs/week)</option>
                  <option value="full-time">Full-time (~40 hrs/week)</option>
                  <option value="flexible">Flexible / Negotiable</option>
                </select>
              </div>
            </>
          )}

          {/* ── Project Configuration ────────────────────────────────── */}
          <hr className="form-divider" />
          <div className="section-title">Project Configuration</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project Stage</label>
              <select
                className="form-select"
                value={projectStage}
                onChange={e => setProjectStage(e.target.value)}
              >
                <option value="IDEA">💡 Idea</option>
                <option value="CONCEPT_VALIDATION">🔬 Concept Validation</option>
                <option value="PROTOTYPE">🛠️ Prototype</option>
                <option value="PILOT_TESTING">🧪 Pilot Testing</option>
                <option value="PRE_DEPLOYMENT">🚀 Pre-Deployment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Collaboration Type</label>
              <select
                className="form-select"
                value={collaborationType}
                onChange={e => setCollaborationType(e.target.value)}
              >
                <option value="ADVISOR">📋 Advisor</option>
                <option value="COFOUNDER">🤝 Co-Founder</option>
                <option value="RESEARCH_PARTNER">🔬 Research Partner</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                placeholder="e.g., Ankara"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="form-input"
                placeholder="e.g., Turkey"
                value={country}
                onChange={e => setCountry(e.target.value)}
              />
            </div>
          </div>

          {/* ── Auto-Close ───────────────────────────────────────────── */}
          <hr className="form-divider" />
          <div className="section-title">Auto-Close Settings</div>

          <div className="toggle-wrapper">
            <input
              type="checkbox"
              className="toggle"
              checked={autoClose}
              onChange={e => setAutoClose(e.target.checked)}
              id="autoCloseToggle"
            />
            <label htmlFor="autoCloseToggle" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
              Enable auto-close on expiry date
            </label>
          </div>

          {autoClose && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Expiry Date</label>
              <input
                type="datetime-local"
                className="form-input"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
              <span className="form-hint">Post will automatically expire and close at this date.</span>
            </div>
          )}

          {/* ── Action Buttons ───────────────────────────────────────── */}
          <hr className="form-divider" />
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              📝 Save as Draft
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? '⏳ Publishing...' : '🚀 Publish Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}