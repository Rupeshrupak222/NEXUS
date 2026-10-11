import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Activity,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  KeyRound
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminStudentDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/students/${id}`);
        if (res.success && res.data) {
          setStudent(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load student details.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id, showToast]);

  const handleSendReset = async () => {
    try {
      const res = await api.post(`/admin/students/${student.id}/send-reset-link`);
      showToast(res.data?.message || 'Password reset link sent to student email.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reset link.', 'error');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={5} height="60px" />;
  }

  if (!student) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Student profile not found</h3>
        <Link to="/admin/students" className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to Students
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'courses', label: 'Enrolled Courses', icon: BookOpen },
    { key: 'progress', label: 'Curriculum Progress', icon: TrendingUp },
    { key: 'attendance', label: 'Session Attendance', icon: Clock },
    { key: 'certificates', label: 'Certificates', icon: Award },
    { key: 'activity', label: 'Audit Activity', icon: Activity }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <Link to="/admin/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back to Student Directory
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {student.name[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 800 }}>{student.name}</h1>
                <Badge variant={student.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {student.status}
                </Badge>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>{student.student_id}</span> &bull; {student.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSendReset} className="btn btn-secondary btn-sm">
              <KeyRound size={14} /> Send Password Reset Link
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', overflowX: 'auto' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid-cards-auto">
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '15px' }}>Academic & Personal Information</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Legal Name</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>{student.name}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Student Identification Code</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{student.student_id}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Verified Email</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>{student.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone Contact</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>{student.phone || 'Not provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Admitted Date</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>{student.joining_date}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Last Active Login</span>
                <div style={{ fontSize: '14.5px', fontWeight: 600 }}>
                  {student.last_login_at ? new Date(student.last_login_at).toLocaleString() : 'Never logged in'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '15px' }}>Enrollment Snapshot</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {student.enrollments?.map((e) => (
                <div key={e.id} style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{e.course_title}</div>
                    <Badge variant="primary">{e.batch_code}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Pacing & Completion</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.round(e.completion_percentage)}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill mint" style={{ width: `${Math.round(e.completion_percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Courses */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {student.enrollments?.map((e) => (
            <div key={e.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{e.course_title}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Batch: <strong>{e.batch_name} ({e.batch_code})</strong> &bull; Enrolled on {e.enrolled_at}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mint-dark)' }}>{Math.round(e.completion_percentage)}%</div>
                <Badge variant={e.status === 'COMPLETED' ? 'success' : 'mint'}>{e.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Progress */}
      {activeTab === 'progress' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '15px' }}>Completed Curriculum Lessons</h3>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Lesson Title</th>
                  <th>Module</th>
                  <th>Course Track</th>
                  <th>Type</th>
                  <th>Completed Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {student.completedLessons?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No completed lessons yet</td>
                  </tr>
                ) : (
                  student.completedLessons?.map((cl) => (
                    <tr key={cl.id}>
                      <td style={{ fontWeight: 600 }}>{cl.lesson_title}</td>
                      <td>{cl.module_title}</td>
                      <td>{cl.course_title}</td>
                      <td><Badge variant="neutral">{cl.lesson_type}</Badge></td>
                      <td>{new Date(cl.completed_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '15px' }}>Live Class Attendance Log</h3>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Live Session</th>
                  <th>Date & Time</th>
                  <th>Join Timestamp</th>
                  <th>Duration</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {student.attendance?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No session attendance recorded yet</td>
                  </tr>
                ) : (
                  student.attendance?.map((sa) => (
                    <tr key={sa.id}>
                      <td style={{ fontWeight: 600 }}>{sa.session_title}</td>
                      <td>{sa.session_date} ({sa.start_time})</td>
                      <td>{sa.joined_at ? new Date(sa.joined_at).toLocaleTimeString() : '-'}</td>
                      <td>{Math.round(sa.duration_seconds / 60)} minutes</td>
                      <td>
                        <Badge variant={sa.attendance_status === 'PRESENT' ? 'success' : 'warning'}>
                          {sa.attendance_status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Certificates */}
      {activeTab === 'certificates' && (
        <div className="grid-cards-auto">
          {student.certificates?.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', width: '100%' }}>
              No certificates issued for this student yet.
            </div>
          ) : (
            student.certificates?.map((cert) => (
              <div key={cert.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{cert.course_title}</h4>
                    <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>
                      {cert.certificate_number}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Awarded on {cert.issue_date} &bull; Standing: {cert.grade_or_score}
                </div>
                <Link
                  to={`/verify-certificate/${cert.certificate_number}`}
                  target="_blank"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View Public Verification Seal &rarr;
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Activity */}
      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '15px' }}>Student Audit Records</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {student.activity?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No audit events logged</div>
            ) : (
              student.activity?.map((act) => (
                <div key={act.id} style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <strong>{act.action}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {act.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
