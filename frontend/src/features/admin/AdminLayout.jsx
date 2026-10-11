import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { MobileNav } from '../../components/MobileNav';
import { EmailOutboxDrawer } from '../../components/EmailOutboxDrawer';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export function AdminLayout() {
  const { user, loading } = useAuth();
  const [outboxOpen, setOutboxOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Security: RBAC check
  if (user.role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--error-bg)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>403 — Unauthorized Administrative Access</h2>
        <p style={{ maxWidth: '420px', marginBottom: '20px' }}>
          Your account is authorized as a Student. Administrative operations require privileged access.
        </p>
        <a href="/student/dashboard" className="btn btn-primary">
          Return to Student Dashboard
        </a>
      </div>
    );
  }

  // Route title mapping
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/admin/students')) return { title: 'Students Directory', subtitle: 'Manage academic profiles, enrollments, and activation' };
    if (path.includes('/admin/courses')) return { title: 'Courses & Curriculum', subtitle: 'Design courses, modules, lessons, and syllabi' };
    if (path.includes('/admin/batches')) return { title: 'Academic Batches', subtitle: 'Track cohorts, schedules, and class groupings' };
    if (path.includes('/admin/sessions')) return { title: 'Live Class Sessions', subtitle: 'Schedule, broadcast, and monitor attendance' };
    if (path.includes('/admin/analytics')) return { title: 'Platform Analytics', subtitle: 'Comprehensive metrics, attendance, and progress KPIs' };
    if (path.includes('/admin/calendar')) return { title: 'Master Academic Calendar', subtitle: 'Live sessions, deadlines, and milestones' };
    if (path.includes('/admin/settings')) return { title: 'Platform Settings & Audit', subtitle: 'System configuration, join windows, and audit records' };
    return { title: 'Administrative Dashboard', subtitle: 'Welcome to the Nexus Academy management console' };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="portal-layout">
      <Sidebar role="ADMIN" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenOutbox={() => setOutboxOpen(true)}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
      <MobileNav role="ADMIN" />
      <EmailOutboxDrawer isOpen={outboxOpen} onClose={() => setOutboxOpen(false)} />
    </div>
  );
}
