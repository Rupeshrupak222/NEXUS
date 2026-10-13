import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth & Public
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { ActivateAccountPage } from './features/auth/ActivateAccountPage';
import { VerifyCertificatePage } from './features/verification/VerifyCertificatePage';

// Admin Portal
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminStudentsPage } from './features/admin/AdminStudentsPage';
import { AdminStudentDetailPage } from './features/admin/AdminStudentDetailPage';
import { AdminCoursesPage } from './features/admin/AdminCoursesPage';
import { AdminCourseDetailPage } from './features/admin/AdminCourseDetailPage';
import { AdminBatchesPage } from './features/admin/AdminBatchesPage';
import { AdminSessionsPage } from './features/admin/AdminSessionsPage';
import { AdminCertificatesPage } from './features/admin/AdminCertificatesPage';
import { AdminAnalyticsPage } from './features/admin/AdminAnalyticsPage';
import { AdminCalendarPage } from './features/admin/AdminCalendarPage';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage';

// Student Portal
import { StudentLayout } from './features/student/StudentLayout';
import { StudentDashboardPage } from './features/student/StudentDashboardPage';
import { StudentCoursesPage } from './features/student/StudentCoursesPage';
import { StudentCoursePlayerPage } from './features/student/StudentCoursePlayerPage';
import { StudentLiveClassesPage } from './features/student/StudentLiveClassesPage';
import { StudentCalendarPage } from './features/student/StudentCalendarPage';
import { StudentProgressPage } from './features/student/StudentProgressPage';
import { StudentCertificatesPage } from './features/student/StudentCertificatesPage';
import { StudentProfilePage } from './features/student/StudentProfilePage';
import { StudentSettingsPage } from './features/student/StudentSettingsPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root Dispatcher */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public & Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/activate-account/:token" element={<ActivateAccountPage />} />
            <Route path="/verify-certificate/:certificateNumber" element={<VerifyCertificatePage />} />

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="students/:id" element={<AdminStudentDetailPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="courses/:id" element={<AdminCourseDetailPage />} />
              <Route path="batches" element={<AdminBatchesPage />} />
              <Route path="sessions" element={<AdminSessionsPage />} />
              <Route path="certificates" element={<AdminCertificatesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="calendar" element={<AdminCalendarPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Student Portal */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="courses" element={<StudentCoursesPage />} />
              <Route path="courses/:id" element={<StudentCoursePlayerPage />} />
              <Route path="live-classes" element={<StudentLiveClassesPage />} />
              <Route path="calendar" element={<StudentCalendarPage />} />
              <Route path="progress" element={<StudentProgressPage />} />
              <Route path="certificates" element={<StudentCertificatesPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
