import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
  DRAFT: { label: 'Draft', class: 'badge-ghost', icon: '📝' },
  ACTIVE: { label: 'Active', class: 'badge-success', icon: '🟢' },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', class: 'badge-info', icon: '📅' },
  PARTNER_FOUND: { label: 'Partner Found', class: 'badge-primary', icon: '🤝' },
  EXPIRED: { label: 'Expired', class: 'badge-warning', icon: '⏰' },
  REMOVED: { label: 'Removed', class: 'badge-danger', icon: '🚫' },
  ARCHIVED: { label: 'Archived', class: 'badge-ghost', icon: '📦' },
};

export default function MyPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const token = localStorage.getItem('token');

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/posts/my-posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data);
    } catch {
      toast.error('Failed to load your posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/posts/${postId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Post status updated to ${statusConfig[newStatus]?.label || newStatus}`);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const filteredPosts = filter === 'ALL' ? posts : posts.filter(p => p.status === filter);

  const counts = {
    ALL: posts.length,
    DRAFT: posts.filter(p => p.status === 'DRAFT').length,
    ACTIVE: posts.filter(p => p.status === 'ACTIVE').length,
    ARCHIVED: posts.filter(p => p.status === 'ARCHIVED').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>📋 My Posts</h1>
          <p>Manage your project listings — publish, archive, or find a partner.</p>
        </div>
        <Link to="/create-post" className="btn btn-primary">
          + New Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(key)}
          >
            {key === 'ALL' ? 'All' : statusConfig[key]?.label || key} ({count})
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="empty-state">
          <p>Loading your posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No posts found</h3>
          <p>{filter === 'ALL' ? "You haven't created any posts yet." : `No ${filter.toLowerCase()} posts.`}</p>
          <Link to="/create-post" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gap: '16px' }}>
          {filteredPosts.map((post: any) => {
            const cfg = statusConfig[post.status] || statusConfig.DRAFT;
            return (
              <div key={post.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ marginBottom: '6px' }}>{post.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge ${cfg.class}`}>{cfg.icon} {cfg.label}</span>
                      <span className="badge badge-ghost">{post.project_stage?.replace('_', ' ')}</span>
                      <span className="badge badge-ghost">📍 {post.city}, {post.country}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="card-body">
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Domain:</strong>{' '}
                    {post.working_domain} &nbsp;·&nbsp;
                    <strong style={{ color: 'var(--text-secondary)' }}>Expertise:</strong>{' '}
                    {post.required_expertise}
                  </p>
                  {post.short_explanation && (
                    <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                      {post.short_explanation.substring(0, 150)}
                      {post.short_explanation.length > 150 ? '...' : ''}
                    </p>
                  )}
                  {post.meeting_requests && post.meeting_requests.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span className="badge badge-accent">
                        📨 {post.meeting_requests.length} Meeting Request{post.meeting_requests.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  {/* Status Action Buttons based on current status */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {post.status === 'DRAFT' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusChange(post.id, 'ACTIVE')}
                      >
                        🚀 Publish
                      </button>
                    )}
                    {post.status === 'ACTIVE' && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleStatusChange(post.id, 'PARTNER_FOUND')}
                        >
                          🤝 Partner Found
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleStatusChange(post.id, 'ARCHIVED')}
                        >
                          📦 Archive
                        </button>
                      </>
                    )}
                    {post.status === 'ARCHIVED' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusChange(post.id, 'ACTIVE')}
                      >
                        🔄 Re-activate
                      </button>
                    )}
                  </div>

                  {/* Edit button — only for DRAFT or ACTIVE */}
                  {['DRAFT', 'ACTIVE'].includes(post.status) && (
                    <Link to={`/edit-post/${post.id}`} className="btn btn-ghost btn-sm">
                      ✏️ Edit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
