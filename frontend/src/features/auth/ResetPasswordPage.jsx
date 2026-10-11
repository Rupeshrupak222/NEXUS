import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must contain at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setSuccess(true);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Password reset failed. Link may be expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', padding: '36px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Establish New Password</h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Choose a secure password for your account
            </p>
          </div>
        </div>

        {success ? (
          <div>
            <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                <CheckCircle2 size={18} /> Password Updated!
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)' }}>
                Your password has been successfully updated. You may now continue to log in.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Continue to Login <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Security Guidelines:</div>
              <ul style={{ paddingLeft: '18px', margin: 0 }}>
                <li>At least 8 characters in length</li>
                <li>Avoid using personal names or common words</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
