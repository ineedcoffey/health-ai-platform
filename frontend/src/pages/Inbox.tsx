import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
  PENDING: { label: 'Pending', class: 'badge-warning', icon: '⏳' },
  ACCEPTED: { label: 'Accepted', class: 'badge-success', icon: '✅' },
  DECLINED: { label: 'Declined', class: 'badge-danger', icon: '❌' },
  SCHEDULED: { label: 'Scheduled', class: 'badge-info', icon: '📅' },
  COMPLETED: { label: 'Completed', class: 'badge-primary', icon: '🎉' },
  CANCELLED: { label: 'Cancelled', class: 'badge-ghost', icon: '🚫' },
};

export default function Inbox() {
  const [requests, setRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const token = localStorage.getItem('token');

  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Decline modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/meetings/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch {
      toast.error('Failed to load meeting requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // ── Accept Flow ──────────────────────────────────────────────────────
  const openAcceptModal = (req: any) => {
    setSelectedRequest(req);
    setSelectedSlot('');
    setAcceptModalOpen(true);
  };

  const handleAccept = async () => {
    if (!selectedSlot) {
      toast.error('Please select one of the proposed time slots.');
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/api/meetings/${selectedRequest.id}/status`, {
        status: 'ACCEPTED',
        selected_time_slot: selectedSlot,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Meeting request accepted! 🎉');
      setAcceptModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  // ── Decline Flow ─────────────────────────────────────────────────────
  const openDeclineModal = (req: any) => {
    setSelectedRequest(req);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const handleDecline = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/meetings/${selectedRequest.id}/status`, {
        status: 'DECLINED',
        decline_reason: declineReason || 'No reason provided.',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Meeting request declined.');
      setDeclineModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decline request.');
    }
  };

  // ── Cancel Flow ──────────────────────────────────────────────────────
  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this meeting request?')) return;

    try {
      await axios.put(`http://localhost:5000/api/meetings/${requestId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Meeting request cancelled.');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  // ── Format time slots from JSON ──────────────────────────────────────
  const formatSlots = (slots: any[]): string[] => {
    if (!Array.isArray(slots)) return [];
    return slots.map((slot: any) => {
      if (typeof slot === 'string') return slot;
      if (slot.datetime) return slot.datetime;
      if (slot.label) return slot.label;
      return JSON.stringify(slot);
    });
  };

  const currentList = activeTab === 'incoming' ? requests.incoming : requests.outgoing;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>📥 Meeting Inbox</h1>
          <p>Manage your incoming and outgoing meeting requests</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <button
          className={`btn btn-sm ${activeTab === 'incoming' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('incoming')}
          style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
        >
          📥 Incoming ({requests.incoming.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'outgoing' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('outgoing')}
          style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}
        >
          📤 Sent ({requests.outgoing.length})
        </button>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="empty-state">
          <p>Loading requests...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{activeTab === 'incoming' ? '📥' : '📤'}</div>
          <h3>No {activeTab} requests</h3>
          <p>{activeTab === 'incoming' ? 'No one has requested a meeting yet.' : "You haven't sent any meeting requests yet."}</p>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gap: '14px' }}>
          {currentList.map((req: any) => {
            const cfg = statusConfig[req.status] || statusConfig.PENDING;
            const slots = formatSlots(req.proposed_time_slots);
            const isIncoming = activeTab === 'incoming';
            const canRespond = isIncoming && req.status === 'PENDING';
            const canCancel = ['PENDING', 'ACCEPTED', 'SCHEDULED'].includes(req.status);

            return (
              <div key={req.id} className="card" style={{
                borderColor: req.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : undefined,
              }}>
                {/* Header Row */}
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ marginBottom: '6px', color: 'var(--primary-light)' }}>
                      {req.post?.title || 'Unknown Post'}
                    </h4>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${cfg.class}`}>{cfg.icon} {cfg.label}</span>
                      {req.nda_accepted && (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>🔒 NDA Signed</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {new Date(req.created_at).toLocaleDateString()}
                    <br />
                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Person Info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', color: 'white', fontWeight: '700', flexShrink: 0,
                  }}>
                    {isIncoming
                      ? req.requester?.full_name?.[0]?.toUpperCase() || '?'
                      : req.post?.user?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {isIncoming
                        ? `${req.requester?.full_name || 'Anonymous'}`
                        : `${req.post?.user?.full_name || 'Anonymous'}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isIncoming
                        ? `${req.requester?.role === 'ENGINEER' ? '⚙️ Engineer' : '🏥 Healthcare'} · ${req.requester?.institution || ''}`
                        : `Post Owner · ${req.post?.user?.role === 'ENGINEER' ? '⚙️ Engineer' : '🏥 Healthcare'}`}
                    </div>
                  </div>
                </div>

                {/* Proposed Time Slots */}
                {slots.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Proposed Time Slots
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {slots.map((slot: string, idx: number) => {
                        const isSelected = req.selected_time_slot && new Date(req.selected_time_slot).toISOString() === new Date(slot).toISOString();
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.82rem',
                              fontWeight: '500',
                              border: `1px solid ${isSelected ? 'var(--success)' : 'var(--border-default)'}`,
                              background: isSelected ? 'var(--success-bg)' : 'var(--bg-elevated)',
                              color: isSelected ? 'var(--success-light)' : 'var(--text-secondary)',
                            }}
                          >
                            {isSelected && '✅ '}
                            📅 {new Date(slot).toLocaleString([], {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Time Slot */}
                {req.selected_time_slot && (
                  <div className="alert alert-success" style={{ marginBottom: '12px' }}>
                    📅 Scheduled: {new Date(req.selected_time_slot).toLocaleString()}
                  </div>
                )}

                {/* Decline Reason */}
                {req.decline_reason && req.status === 'DECLINED' && (
                  <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                    💬 Reason: {req.decline_reason}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {canRespond && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => openAcceptModal(req)}
                      >
                        ✅ Accept & Select Slot
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeclineModal(req)}
                      >
                        ❌ Decline
                      </button>
                    </>
                  )}
                  {canCancel && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCancel(req.id)}
                    >
                      🚫 Cancel Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ACCEPT MODAL — Select one of the 3 proposed time slots
         ════════════════════════════════════════════════════════════════ */}
      {acceptModalOpen && selectedRequest && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 'var(--z-modal)' as any, padding: '20px',
        }}
          onClick={() => setAcceptModalOpen(false)}
        >
          <div
            className="form-card animate-slide-up"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="form-card-header">
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <h2>Accept Meeting Request</h2>
              <p>Select one of the proposed time slots</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: 'var(--primary-light)' }}>
                {selectedRequest.post?.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Requested by {selectedRequest.requester?.full_name || 'Anonymous'}
              </p>
            </div>

            <div className="section-title">Choose a Time Slot</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {formatSlots(selectedRequest.proposed_time_slots).map((slot: string, idx: number) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedSlot === slot ? 'var(--success)' : 'var(--border-default)'}`,
                    background: selectedSlot === slot ? 'var(--success-bg)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot}
                    checked={selectedSlot === slot}
                    onChange={() => setSelectedSlot(slot)}
                    style={{ accentColor: 'var(--success)', width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      Option {idx + 1}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      📅 {new Date(slot).toLocaleString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setAcceptModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                style={{ flex: 2 }}
                onClick={handleAccept}
                disabled={!selectedSlot}
              >
                ✅ Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DECLINE MODAL — Provide a reason
         ════════════════════════════════════════════════════════════════ */}
      {declineModalOpen && selectedRequest && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 'var(--z-modal)' as any, padding: '20px',
        }}
          onClick={() => setDeclineModalOpen(false)}
        >
          <div
            className="form-card animate-slide-up"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="form-card-header">
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❌</div>
              <h2>Decline Meeting Request</h2>
              <p>Optionally provide a reason for declining</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: 'var(--primary-light)' }}>
                {selectedRequest.post?.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Requested by {selectedRequest.requester?.full_name || 'Anonymous'}
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Reason for Declining</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Schedule conflict, looking for a different expertise area..."
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={3}
              />
              <span className="form-hint">This will be shared with the requester.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setDeclineModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 2 }}
                onClick={handleDecline}
              >
                ❌ Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}