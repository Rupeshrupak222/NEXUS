import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, X, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export function EmailOutboxDrawer({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchOutbox = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/outbox');
      if (res.success && res.data) {
        setEmails(res.data);
        if (res.data.length > 0 && !selectedEmail) {
          setSelectedEmail(res.data[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch outbox:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOutbox();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '860px', height: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px' }}>System Email Outbox & Dispatcher</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Inspect dispatched system emails, activation tokens, and reset links
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={fetchOutbox} className="btn btn-secondary btn-sm" title="Refresh emails">
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Email List Column */}
          <div style={{ width: '300px', borderRight: '1px solid var(--border-light)', overflowY: 'auto', background: 'var(--bg-subtle)' }}>
            {emails.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No emails dispatched yet
              </div>
            ) : (
              emails.map((em) => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmail(em)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    backgroundColor: selectedEmail?.id === em.id ? 'var(--bg-surface)' : 'transparent',
                    borderLeft: selectedEmail?.id === em.id ? '3px solid var(--primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '2px' }}>
                    {em.template_name}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {em.subject}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    To: {em.to_email}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(em.sent_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Email Preview Column */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#FFFFFF' }}>
            {selectedEmail ? (
              <div>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{selectedEmail.subject}</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>Recipient:</strong> {selectedEmail.to_email} &bull; <strong>Sent:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'var(--bg-app)'
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select an email from the left to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
