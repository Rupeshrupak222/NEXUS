import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mail, LogOut, User, Check, CheckCheck, ChevronDown, ExternalLink, Settings, Menu, Sparkles, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Badge } from './Badge';

export function Header({ title, subtitle, onOpenOutbox, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications for the current user
  const fetchNotifications = async () => {
    try {
      const endpoint = user?.role === 'STUDENT' ? '/student/notifications' : '/student/notifications';
      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/student/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      {/* Title / Hamburger for mobile */}
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          type="button"
        >
          <Menu size={20} />
        </button>

        <div className="header-titles">
          <h2 className="header-title">
            {title || 'Dashboard'}
          </h2>
          {subtitle && (
            <p className="header-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="header-right">
        {/* External quick-access: Adyapan AI & Study Material */}
        <a
          href="https://ai.adyapan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm adyapan-btn adyapan-ai-btn"
          title="Open Adyapan AI assistant"
        >
          <Sparkles size={15} />
          <span className="adyapan-btn-label">Adyapan AI</span>
          <ExternalLink size={12} className="adyapan-btn-ext" />
        </a>
        <a
          href="https://study.adyapan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm adyapan-btn adyapan-study-btn"
          title="Open Adyapan Study Material"
        >
          <GraduationCap size={15} />
          <span className="adyapan-btn-label">Study Material</span>
          <ExternalLink size={12} className="adyapan-btn-ext" />
        </a>

        {/* Email Outbox quick viewer */}
        <button
          onClick={onOpenOutbox}
          className="btn btn-secondary btn-sm outbox-header-btn"
          title="Inspect dispatched activation tokens & emails"
          type="button"
        >
          <Mail size={15} color="var(--primary)" />
          <span className="outbox-btn-label">Email Outbox</span>
        </button>

        {/* Notifications Center */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-ghost btn-icon"
            style={{ position: 'relative' }}
            aria-label="View notifications"
            type="button"
          >
            <Bell size={18} color="var(--text-secondary)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="header-dropdown notifications-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(340px, calc(100vw - 32px))',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 1100,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: n.is_read ? 'transparent' : 'var(--primary-light)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                      onClick={() => {
                        if (!n.is_read) handleMarkAsRead(n.id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px' }} />
                        )}
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'inline-block' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-profile-btn"
            type="button"
          >
            <div
              className="user-avatar-circle"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: user?.role === 'ADMIN' ? 'var(--primary)' : 'var(--mint)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="user-profile-text" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {user?.role === 'STUDENT' ? user.student?.studentId || 'STUDENT' : 'ADMINISTRATOR'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-secondary)" className="user-profile-chevron" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              className="header-dropdown user-menu-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(260px, calc(100vw - 32px))',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 1100,
                overflow: 'hidden'
              }}
            >
              {/* User Identity info */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {user?.email}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Badge variant={user?.role === 'ADMIN' ? 'primary' : 'mint'}>
                    {user?.role === 'ADMIN' ? 'Administrator' : `Student (${user.student?.studentId || 'ACTIVE'})`}
                  </Badge>
                </div>
              </div>

              {/* Navigation links */}
              <div style={{ padding: '6px' }}>
                {user?.role === 'STUDENT' ? (
                  <>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/student/profile'); }}
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 12px', fontSize: '13px', gap: '8px' }}
                    >
                      <User size={15} /> My Profile
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/student/settings'); }}
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 12px', fontSize: '13px', gap: '8px' }}
                    >
                      <Settings size={15} /> Account Settings
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/admin/settings'); }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 12px', fontSize: '13px', gap: '8px' }}
                  >
                    <Settings size={15} /> System Settings
                  </button>
                )}

                <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 12px', fontSize: '13px', gap: '8px', color: 'var(--error)' }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
