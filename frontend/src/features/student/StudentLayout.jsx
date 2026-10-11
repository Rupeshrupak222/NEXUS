import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { MobileNav } from '../../components/MobileNav';
import { EmailOutboxDrawer } from '../../components/EmailOutboxDrawer';
import { useAuth } from '../../context/AuthContext';

export function StudentLayout() {
  const { user, loading } = useAuth();
  const [outboxOpen, setOutboxOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" style={{ width: '16px', height: '16px', color: 'var(--mint)' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/student/courses')) return { title: 'My Enrolled Courses', subtitle: 'Continue your learning and complete your lessons' };
    if (path.includes('/student/live-classes')) return { title: 'Live Interactive Classes', subtitle: 'Join your live sessions and review recorded lectures' };
    if (path.includes('/student/calendar')) return { title: 'Schedule & Calendar', subtitle: 'Upcoming live sessions, cohorts, and key dates' };
    if (path.includes('/student/progress')) return { title: 'Academic Progress', subtitle: 'Detailed breakdown of course completion and attendance' };
    if (path.includes('/student/certificates')) return { title: 'Verified Certificates', subtitle: 'View, verify, and download your accredited credentials' };
    if (path.includes('/student/profile')) return { title: 'Student Profile', subtitle: 'Manage your contact information and details' };
    if (path.includes('/student/settings')) return { title: 'Account Settings', subtitle: 'Update your security credentials and preferences' };
    return { title: 'Student Portal', subtitle: `Welcome back, ${user.name}` };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="portal-layout">
      <Sidebar role="STUDENT" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
      <MobileNav role="STUDENT" />
      <EmailOutboxDrawer isOpen={outboxOpen} onClose={() => setOutboxOpen(false)} />
    </div>
  );
}
