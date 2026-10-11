import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Mail, Save, RefreshCw, Activity, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/audit-logs')
      ]);
      if (sRes.success) setSettings(sRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to load system settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.patch('/admin/settings', settings);
      showToast('Platform settings successfully saved.', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update platform settings.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      !logFilter ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.actor_name.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.resource_id && l.resource_id.toLowerCase().includes(logFilter.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Platform Configuration & Audit Trail</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage security parameters, live session gates, and inspect immutable system audit events
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="80px" />
      ) : (
        <>
          {/* Settings Form Card */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '16px' }}>System Configuration Parameters</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveSettings}>
                <div className="grid-cards-auto">
                  <div className="form-group">
                    <label className="form-label">Academy / Organization Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.organization_name || ''}
                      onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Administrative Support Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={settings.support_email || ''}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Academy Timezone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.timezone || ''}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Join Window (Minutes Before Start)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      className="form-input"
                      value={settings.session_join_window_minutes || '15'}
                      onChange={(e) => setSettings({ ...settings, session_join_window_minutes: e.target.value })}
                      required
                    />
                    <span className="form-hint">Allows students to enter live rooms X minutes before class</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Minimum Length</label>
                    <input
                      type="number"
                      min="8"
                      max="32"
                      className="form-input"
                      value={settings.password_min_length || '8'}
                      onChange={(e) => setSettings({ ...settings, password_min_length: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Active Session Expiry (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="form-input"
                      value={settings.session_timeout_days || '7'}
                      onChange={(e) => setSettings({ ...settings, session_timeout_days: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                    <Save size={16} /> {saveLoading ? 'Saving Settings...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Real-time System Audit Logs */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '16px' }}>Security & Administrative Audit Logs</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter audit logs..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    style={{ paddingLeft: '30px', padding: '6px 12px 6px 30px', fontSize: '12.5px', width: '200px' }}
                  />
                </div>
                <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh logs">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: log.action.includes('FAIL') || log.action.includes('BLOCKED') ? 'var(--error)' : 'var(--text-main)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.actor_name}</td>
                      <td>
                        <Badge variant={log.role === 'ADMIN' ? 'primary' : log.role === 'STUDENT' ? 'mint' : 'neutral'}>
                          {log.role}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {log.resource_type}: {log.resource_id || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details || '-'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.ip_address}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
