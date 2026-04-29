import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState({
    full_name: '', institution: '', city: '', country: '', professional_summary: '', email: '', role: '', profile_completed: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/users/profile', {
        full_name: profile.full_name,
        city: profile.city,
        country: profile.country,
        institution: profile.institution,
        professional_summary: profile.professional_summary
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully! ✨');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="form-container animate-fade-in" style={{ maxWidth: '640px' }}>
      <div className="form-card">
        <div className="form-card-header">
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px',
            background: profile.role === 'ENGINEER'
              ? 'linear-gradient(135deg, var(--info), var(--primary))'
              : 'linear-gradient(135deg, var(--accent), var(--success))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', color: 'white', fontWeight: '700'
          }}>
            {profile.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2>My Profile</h2>
          <p>{profile.email}</p>
          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${profile.role === 'ENGINEER' ? 'badge-info' : 'badge-accent'}`}>
              {profile.role === 'ENGINEER' ? '⚙️ Engineer' : '🏥 Healthcare'}
            </span>
            {profile.profile_completed && (
              <span className="badge badge-success" style={{ marginLeft: '6px' }}>✅ Complete</span>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdate} className="form-stack">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Dr. Jane Smith"
              value={profile.full_name || ''}
              onChange={e => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Institution</label>
            <input
              className="form-input"
              placeholder="University / Hospital / Research Center"
              value={profile.institution || ''}
              onChange={e => setProfile({ ...profile, institution: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                placeholder="e.g., Ankara"
                value={profile.city || ''}
                onChange={e => setProfile({ ...profile, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="form-input"
                placeholder="e.g., Turkey"
                value={profile.country || ''}
                onChange={e => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Professional Summary</label>
            <textarea
              className="form-textarea"
              placeholder="Tell others about your expertise, research interests, and what kind of collaboration you're looking for..."
              value={profile.professional_summary || ''}
              onChange={e => setProfile({ ...profile, professional_summary: e.target.value })}
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={saving}
          >
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}