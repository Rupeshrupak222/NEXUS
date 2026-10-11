import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, ShieldCheck, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmailOutboxDrawer } from '../../components/EmailOutboxDrawer';

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [outboxOpen, setOutboxOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please provide both your email/student ID and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* LEFT COLUMN: Visual Brand Experience */}
      <div
        style={{
          flex: '1 1 50%',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-light)',
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="login-left-banner"
      >
        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              NEXUS <span style={{ color: 'var(--primary)' }}>ACADEMY</span>
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Enterprise Education & LMS Platform
            </p>
          </div>
        </div>

        {/* Center Educational Showcase */}
        <div style={{ maxWidth: '480px', margin: '40px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <Sparkles size={16} /> Empowering Future Engineers
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Transforming education through modern technology.
          </h2>

          <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Access live cohort classes, hands-on software curriculum, real-time attendance analytics, and cryptographically verified certifications.
          </p>

          {/* Value Props */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ fontSize: '14.5px', color: 'var(--text-main)', fontWeight: 500 }}>
                Interactive live sessions with Zoom, Meet & Teams integration
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ fontSize: '14.5px', color: 'var(--text-main)', fontWeight: 500 }}>
                Server-verified course progress and tamper-proof attendance
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ fontSize: '14.5px', color: 'var(--text-main)', fontWeight: 500 }}>
                Official accredited certificates with public QR verification
              </span>
            </div>
          </div>
        </div>

        {/* Footer info & Outbox shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} color="var(--mint)" />
            <span>256-Bit TLS Encryption &bull; RBAC Protected</span>
          </div>
          <button
            onClick={() => setOutboxOpen(true)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12.5px', gap: '4px' }}
          >
            Review Outbox Emails &rarr;
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Card */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Mobile Brand Logo (visible on tablets/phones) */}
          <div className="login-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                NEXUS <span style={{ color: 'var(--primary)' }}>ACADEMY</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome back 👋
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
              Continue your learning journey.
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">
                Email / Student ID
              </label>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder="e.g. rahul@example.com or STU-2026-001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Remember session
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="pulse-dot" style={{ color: '#FFFFFF' }} /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Have an activation token?{' '}
            <Link to="/activate-account/token_marcus_activation_demo2026" style={{ fontWeight: 600 }}>
              Activate Account
            </Link>
          </div>
        </div>
      </div>

      <EmailOutboxDrawer isOpen={outboxOpen} onClose={() => setOutboxOpen(false)} />
    </div>
  );
}
