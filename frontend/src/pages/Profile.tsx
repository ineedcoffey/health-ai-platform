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
        const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/users/profile', {
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
      await axios.put('https://health-ai-platform-backend.onrender.com/api/users/profile', {
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

  const handleExportData = () => {
    toast.loading('Preparing your data export...', { id: 'export-toast' });
    axios.get('https://health-ai-platform-backend.onrender.com/api/users/me/export', {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my-health-ai-data-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data export complete!', { id: 'export-toast' });
    }).catch(() => {
      toast.error('Failed to export data.', { id: 'export-toast' });
    });
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
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Data & Privacy</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Download a copy of your personal data, posts, and meeting history in machine-readable format (JSON).
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleExportData}
              style={{ border: '1px solid var(--border-default)' }}
            >
              📥 Export My Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}