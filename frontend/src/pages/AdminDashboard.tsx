import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Status config reused
const postStatusConfig: Record<string, { label: string; class: string; icon: string }> = {
  DRAFT: { label: 'Draft', class: 'badge-ghost', icon: '📝' },
  ACTIVE: { label: 'Active', class: 'badge-success', icon: '🟢' },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', class: 'badge-info', icon: '📅' },
  PARTNER_FOUND: { label: 'Partner Found', class: 'badge-primary', icon: '🤝' },
  EXPIRED: { label: 'Expired', class: 'badge-warning', icon: '⏰' },
  REMOVED: { label: 'Removed', class: 'badge-danger', icon: '🚫' },
  ARCHIVED: { label: 'Archived', class: 'badge-ghost', icon: '📦' },
};

type AdminTab = 'overview' | 'posts' | 'users' | 'logs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Data state
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/filter state
  const [postSearch, setPostSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // ── Data Fetchers ────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/admin/stats', { headers });
      setStats(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load stats.');
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/admin/posts', { headers });
      setPosts(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/admin/users', { headers });
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://health-ai-platform-backend.onrender.com/api/admin/logs', { headers });
      setLogs(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') fetchPosts();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  // ── Actions ──────────────────────────────────────────────────────────
  const handleRemovePost = async (postId: string, title: string) => {
    if (!confirm(`Remove post "${title}"? This will set its status to REMOVED.`)) return;
    try {
      await axios.patch(`https://health-ai-platform-backend.onrender.com/api/admin/posts/${postId}/remove`, {}, { headers });
      toast.success('Post removed successfully.');
      fetchPosts();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove post.');
    }
  };

  const handleSuspendUser = async (userId: string, email: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'suspend' : 'reactivate';
    if (!confirm(`${currentlyActive ? 'Suspend' : 'Reactivate'} user "${email}"?`)) return;
    try {
      await axios.patch(`https://health-ai-platform-backend.onrender.com/api/admin/users/${userId}/suspend`, {}, { headers });
      toast.success(`User ${action}d successfully.`);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} user.`);
    }
  };

  const handleDownloadCSV = () => {
    window.open('https://health-ai-platform-backend.onrender.com/api/admin/logs/csv', '_blank');
    // Note: This will fail without auth. Let's use fetch instead:
    axios.get('https://health-ai-platform-backend.onrender.com/api/admin/logs/csv', {
      headers,
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    }).catch(() => {
      toast.error('Failed to download CSV.');
    });
  };

  // ── Filtered data ────────────────────────────────────────────────────
  const filteredPosts = posts.filter(p => {
    const term = postSearch.toLowerCase();
    return !term ||
      p.title?.toLowerCase().includes(term) ||
      p.user?.email?.toLowerCase().includes(term) ||
      p.user?.full_name?.toLowerCase().includes(term);
  });

  const filteredUsers = users.filter(u => {
    const term = userSearch.toLowerCase();
    return !term ||
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term) ||
      u.institution?.toLowerCase().includes(term);
  });

  const filteredLogs = logs.filter(l => {
    const term = logSearch.toLowerCase();
    return !term ||
      l.action_type?.toLowerCase().includes(term) ||
      l.user?.email?.toLowerCase().includes(term) ||
      l.user?.full_name?.toLowerCase().includes(term);
  });

  // ── Tab Configuration ────────────────────────────────────────────────
  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'posts', label: 'Post Moderation', icon: '📋' },
    { key: 'users', label: 'User Management', icon: '👥' },
    { key: 'logs', label: 'Audit Logs', icon: '📜' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Platform administration & moderation panel</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px',
        background: 'var(--bg-card)', padding: '4px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW — Statistics Cards
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {!stats ? (
            <div className="empty-state"><p>Loading statistics...</p></div>
          ) : (
            <>
              {/* User Stats */}
              <div className="section-title">User Statistics</div>
              <div className="grid-3" style={{ marginBottom: '24px' }}>
                <StatCard icon="👥" label="Total Users" value={stats.users.total} color="var(--primary)" />
                <StatCard icon="⚙️" label="Engineers" value={stats.users.engineers} color="var(--info)" />
                <StatCard icon="🏥" label="Healthcare" value={stats.users.healthcarePros} color="var(--accent)" />
                <StatCard icon="✅" label="Active Users" value={stats.users.active} color="var(--success)" />
                <StatCard icon="🚫" label="Suspended" value={stats.users.suspended} color="var(--danger)" />
              </div>

              {/* Post Stats */}
              <div className="section-title">Post Statistics</div>
              <div className="grid-3" style={{ marginBottom: '24px' }}>
                <StatCard icon="📋" label="Total Posts" value={stats.posts.total} color="var(--primary)" />
                <StatCard icon="🟢" label="Active Posts" value={stats.posts.active} color="var(--success)" />
                <StatCard icon="📝" label="Drafts" value={stats.posts.draft} color="var(--text-muted)" />
                <StatCard icon="📦" label="Archived" value={stats.posts.archived} color="var(--warning)" />
                <StatCard icon="🚫" label="Removed" value={stats.posts.removed} color="var(--danger)" />
              </div>

              {/* Meeting Stats */}
              <div className="section-title">Meeting Statistics</div>
              <div className="grid-3">
                <StatCard icon="🤝" label="Total Meetings" value={stats.meetings.total} color="var(--primary)" />
                <StatCard icon="⏳" label="Pending" value={stats.meetings.pending} color="var(--warning)" />
                <StatCard icon="🎉" label="Completed" value={stats.meetings.completed} color="var(--success)" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: POST MODERATION
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'posts' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '16px' }}>
            <input
              className="form-input"
              placeholder="🔍  Search posts by title, author name, or email..."
              value={postSearch}
              onChange={e => setPostSearch(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {filteredPosts.length} posts found
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading posts...</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Author</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Domain</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post: any) => {
                    const cfg = postStatusConfig[post.status] || postStatusConfig.DRAFT;
                    return (
                      <tr key={post.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {post.title?.substring(0, 40)}{post.title?.length > 40 ? '...' : ''}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {post.user?.full_name || 'N/A'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {post.user?.email}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span className={`badge ${cfg.class}`}>{cfg.icon} {cfg.label}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: 'var(--text-secondary)' }}>{post.working_domain}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {post.status !== 'REMOVED' ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemovePost(post.id, post.title)}
                            >
                              🚫 Remove
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Removed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3: USER MANAGEMENT
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '16px' }}>
            <input
              className="form-input"
              placeholder="🔍  Search users by name, email, or institution..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {filteredUsers.length} users found
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading users...</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Institution</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Posts</th>
                    <th style={thStyle}>Joined</th>
                    <th style={thStyle}>Last Login</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      opacity: user.is_active ? 1 : 0.6,
                    }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: user.role === 'ENGINEER'
                              ? 'linear-gradient(135deg, var(--info), var(--primary))'
                              : user.role === 'ADMIN'
                                ? 'linear-gradient(135deg, var(--warning), var(--danger))'
                                : 'linear-gradient(135deg, var(--accent), var(--success))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', color: 'white', fontWeight: '700',
                          }}>
                            {user.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {user.full_name || 'No Name'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-warning' :
                            user.role === 'ENGINEER' ? 'badge-info' : 'badge-accent'
                          }`}>
                          {user.role === 'ADMIN' ? '🛡️' : user.role === 'ENGINEER' ? '⚙️' : '🏥'} {user.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {user.institution || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {user.is_active ? (
                          <span className="badge badge-success">✅ Active</span>
                        ) : (
                          <span className="badge badge-danger">🚫 Suspended</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)' }}>{user._count?.posts || 0}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {user.role !== 'ADMIN' ? (
                          <button
                            className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleSuspendUser(user.id, user.email, user.is_active)}
                          >
                            {user.is_active ? '⏸️ Suspend' : '▶️ Reactivate'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 4: AUDIT LOGS
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              placeholder="🔍  Search logs by action type, user email, or name..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              style={{ flex: 1, minWidth: '250px' }}
            />
            <button className="btn btn-primary" onClick={handleDownloadCSV}>
              📥 Download CSV
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {filteredLogs.length} log entries
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading audit logs...</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th style={thStyle}>Timestamp</th>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Target</th>
                    <th style={thStyle}>Result</th>
                    <th style={thStyle}>IP Address</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {log.user?.full_name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {log.user?.email || ''}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span className="badge badge-ghost" style={{ fontSize: '0.7rem' }}>
                          {log.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.78rem',
                          color: 'var(--primary-light)',
                          background: 'var(--primary-glow)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}>
                          {log.action_type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.target_entity_type && `${log.target_entity_type}: `}
                          {log.target_entity_id?.substring(0, 8) || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${log.result_status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}
                          style={{ fontSize: '0.7rem' }}>
                          {log.result_status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {log.ip_address}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.details?.substring(0, 50)}{log.details?.length > 50 ? '...' : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable Stat Card Component ─────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize: '2rem', fontWeight: '700',
        color, lineHeight: 1, marginBottom: '6px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
        {label}
      </div>
    </div>
  );
}

// ── Table Styles ──────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '0.78rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  verticalAlign: 'middle',
};
