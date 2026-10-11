import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, CheckCircle2, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { EmailOutboxDrawer } from '../../components/EmailOutboxDrawer';

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outboxOpen, setOutboxOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Unable to process reset request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', padding: '36px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Reset Password</h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Recover access to your learning portal
            </p>
          </div>
        </div>

        {submitted ? (
          <div>
            <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                <CheckCircle2 size={18} /> Request Dispatched
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)' }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched to that inbox.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setOutboxOpen(true)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Inspect Dispatched Email in Outbox
              </button>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Send to another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter the registered email associated with your student or administrative account. We'll send you a single-use reset link.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Registered Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>

      <EmailOutboxDrawer isOpen={outboxOpen} onClose={() => setOutboxOpen(false)} />
    </div>
  );
}
