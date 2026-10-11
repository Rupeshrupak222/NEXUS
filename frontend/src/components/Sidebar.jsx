import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Radio,
  BarChart3,
  Calendar,
  Settings,
  GraduationCap,
  Award,
  TrendingUp,
  User,
  LogOut,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ role = 'ADMIN', isOpen = false, onClose = () => {} }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Batches', path: '/admin/batches', icon: Layers },
    { label: 'Sessions', path: '/admin/sessions', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const studentNavItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Live Classes', path: '/student/live-classes', icon: Radio },
    { label: 'Calendar', path: '/student/calendar', icon: Calendar },
    { label: 'My Progress', path: '/student/progress', icon: TrendingUp },
    { label: 'Certificates', path: '/student/certificates', icon: Award }
  ];

  const studentBottomItems = [
    { label: 'Profile', path: '/student/profile', icon: User },
    { label: 'Settings', path: '/student/settings', icon: Settings }
  ];

  const items = role === 'ADMIN' ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: role === 'ADMIN' ? 'var(--primary)' : 'var(--mint)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: role === 'ADMIN' ? '0 2px 8px var(--primary-glow)' : '0 2px 8px var(--mint-glow)'
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                NEXUS <span style={{ color: role === 'ADMIN' ? 'var(--primary)' : 'var(--mint)' }}>LMS</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {role === 'ADMIN' ? 'Administration' : 'Student Portal'}
              </div>
            </div>
          </div>

          {/* Close button on mobile screens */}
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '18px 14px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px 10px' }}>
            {role === 'ADMIN' ? 'Management' : 'Learning'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? (role === 'ADMIN' ? 'var(--primary)' : 'var(--mint-dark)') : 'var(--text-secondary)',
                    backgroundColor: isActive ? (role === 'ADMIN' ? 'var(--primary-light)' : 'var(--mint-light)') : 'transparent',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none'
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Student Bottom Navigation Section */}
          {role === 'STUDENT' && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px 10px' }}>
                Account
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {studentBottomItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13.5px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--mint-dark)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--mint-light)' : 'transparent',
                        transition: 'all var(--transition-fast)',
                        textDecoration: 'none'
                      })}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Logout Action */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border-light)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)', padding: '10px 14px', gap: '12px' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
