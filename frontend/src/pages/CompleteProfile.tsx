import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CompleteProfile() {
  const [formData, setFormData] = useState({
    full_name: '',
    institution: '',
    city: '',
    country: '',
    professional_summary: '',
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const { full_name, institution, city, country, professional_summary } = formData;
    if (!full_name.trim() || !institution.trim() || !city.trim() || !country.trim() || !professional_summary.trim()) {
      toast.error('All fields are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('https://health-ai-platform-backend.onrender.com/api/users/complete-profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local storage
      localStorage.setItem('profileCompleted', 'true');
      if (res.data.user?.full_name) {
        localStorage.setItem('userName', res.data.user.full_name);
      }

      toast.success('Profile completed! Welcome to Health AI 🎉');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const isEngineer = userRole === 'ENGINEER';

  return (
    <div className="complete-profile-container animate-fade-in">
      <div className="complete-profile-card">
        {/* Header */}
        <div className="complete-profile-header">
          <div className="complete-profile-icon">
            <span>{isEngineer ? '⚙️' : '🏥'}</span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Tell us about yourself so others can discover and collaborate with you</p>

          {/* Progress Steps */}
          <div className="profile-steps">
            <div className="profile-step completed">
              <div className="step-circle">✓</div>
              <span>Account Created</span>
            </div>
            <div className="profile-step-connector completed"></div>
            <div className="profile-step completed">
              <div className="step-circle">✓</div>
              <span>Email Verified</span>
            </div>
            <div className="profile-step-connector active"></div>
            <div className="profile-step active">
              <div className="step-circle">3</div>
              <span>Profile Setup</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="complete-profile-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              type="text"
              name="full_name"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Dr. Sarah Chen"
              required
              autoFocus
            />
          </div>

          {/* Institution */}
          <div className="form-group">
            <label className="form-label">Institution / Organization <span className="required">*</span></label>
            <input
              type="text"
              name="institution"
              className="form-input"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g. MIT, Stanford Health, Mayo Clinic"
              required
            />
            <span className="form-hint">Your university, hospital, or research institution</span>
          </div>

          {/* City & Country */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City <span className="required">*</span></label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Boston"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country <span className="required">*</span></label>
              <input
                type="text"
                name="country"
                className="form-input"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. United States"
                required
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div className="form-group">
            <label className="form-label">Professional Summary <span className="required">*</span></label>
            <textarea
              name="professional_summary"
              className="form-textarea"
              value={formData.professional_summary}
              onChange={handleChange}
              placeholder={isEngineer
                ? "Describe your technical background, areas of expertise, and what kind of healthcare collaboration you're seeking..."
                : "Describe your clinical or research background, areas of need, and what kind of technical collaboration you're seeking..."
              }
              required
              rows={5}
            />
            <span className="form-hint">This will be visible to potential collaborators</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Saving Profile...' : '🚀 Complete Profile & Enter Platform'}
          </button>
        </form>
      </div>
    </div>
  );
}
