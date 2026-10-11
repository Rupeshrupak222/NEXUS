import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function ActivateAccountPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/activate-account', {
        token,
        newPassword: password
      });
      setActivated(true);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Activation link is invalid or expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '460px', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Welcome to Nexus Academy</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Activate your official student account
            </p>
          </div>
        </div>

        {activated ? (
          <div>
            <div style={{ backgroundColor: 'var(--mint-light)', border: '1px solid rgba(32,180,134,0.3)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--mint)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Account Successfully Activated!
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Your student profile is now verified and active. You can now sign in to start learning.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn btn-mint btn-lg"
              style={{ width: '100%' }}
            >
              Continue to Login <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleActivate}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '20px', fontSize: '13.5px', color: 'var(--text-main)' }}>
              Your student account has been created by the academy administration. Please establish a secure password to activate your access.
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Create Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-mint btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Activating Account...' : 'Activate Student Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
