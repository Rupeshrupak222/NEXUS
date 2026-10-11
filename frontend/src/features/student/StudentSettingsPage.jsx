import React, { useState } from 'react';
import { KeyRound, Shield, Bell, Check, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function StudentSettingsPage() {
  const { showToast } = useToast();

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwLoading, setPwLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    liveClassReminders: true,
    newRecordingAlerts: true,
    courseAnnouncements: true
  });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPwLoading(true);
    try {
      const res = await api.patch('/student/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      showToast(res.message || 'Password successfully updated!', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    showToast('Notification preferences updated.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Account Settings & Security</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage your password and communications preferences
        </p>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="var(--mint)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Change Account Password</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-type new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-mint" disabled={pwLoading}>
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--mint)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notification Preferences</h3>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={notifications.liveClassReminders}
                onChange={(e) => setNotifications({ ...notifications, liveClassReminders: e.target.checked })}
                style={{ accentColor: 'var(--mint)', width: '16px', height: '16px' }}
              />
              <span>Live class start time reminders (15m before broadcast)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={notifications.newRecordingAlerts}
                onChange={(e) => setNotifications({ ...notifications, newRecordingAlerts: e.target.checked })}
                style={{ accentColor: 'var(--mint)', width: '16px', height: '16px' }}
              />
              <span>New recorded lecture archive notifications</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={notifications.courseAnnouncements}
                onChange={(e) => setNotifications({ ...notifications, courseAnnouncements: e.target.checked })}
                style={{ accentColor: 'var(--mint)', width: '16px', height: '16px' }}
              />
              <span>Course curriculum milestone and certificate alerts</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="btn btn-secondary btn-sm">
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
