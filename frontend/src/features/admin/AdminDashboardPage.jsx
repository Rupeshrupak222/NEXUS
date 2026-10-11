import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Radio,
  CheckCircle,
  ArrowUpRight,
  TrendingUp,
  Video,
  GraduationCap,
  Award,
  Layers,
  CalendarClock,
  UserCheck,
  Clock,
  PlayCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

// Lightweight inline area/line chart for the enrollment trend (no external deps)
function EnrollmentTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No enrollment data yet
      </div>
    );
  }

  const width = 520;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 26, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((d) => d.count));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.count / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    `${linePath} L${points[points.length - 1].x},${padding.top + innerH} L${points[0].x},${padding.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} role="img" aria-label="Student enrollment over the last 6 months">
      <defs>
        <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = padding.top + innerH - t * innerH;
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">
              {Math.round(t * max)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#enrollFill)" />
      <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--bg-surface)" stroke="var(--primary)" strokeWidth="2" />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-main)">
            {p.count}
          </text>
          <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton count={4} height="90px" />
      </div>
    );
  }

  const {
    metrics,
    recentStudents,
    upcomingClasses,
    recentActivity,
    coursePerformance,
    topCourses,
    enrollmentTrend,
    attendanceBreakdown,
    batchSummary
  } = data || {};

  const totalAttendance =
    (attendanceBreakdown?.present || 0) + (attendanceBreakdown?.partial || 0) + (attendanceBreakdown?.absent || 0);

  const attendanceSegments = [
    { label: 'Present', value: attendanceBreakdown?.present || 0, color: 'var(--mint)' },
    { label: 'Partial', value: attendanceBreakdown?.partial || 0, color: 'var(--warning, #f59e0b)' },
    { label: 'Absent', value: attendanceBreakdown?.absent || 0, color: 'var(--error, #ef4444)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Metric Overview Cards (full set) */}
      <div className="grid-metrics">
        <StatCard
          title="Total Students"
          value={metrics?.totalStudents || 0}
          icon={Users}
          changeText={`${metrics?.activeStudents || 0} active • ${metrics?.pendingStudents || 0} pending`}
          color="primary"
        />
        <StatCard
          title="Total Teachers"
          value={metrics?.totalTeachers || 0}
          icon={UserCheck}
          changeText="Distinct session instructors"
          color="mint"
        />
        <StatCard
          title="Active Courses"
          value={metrics?.totalCourses || 0}
          icon={BookOpen}
          changeText={`${metrics?.totalLessons || 0} lessons across curriculum`}
          color="primary"
        />
        <StatCard
          title="Total Classes"
          value={metrics?.totalSessions || 0}
          icon={Video}
          changeText={`${metrics?.sessionsConducted || 0} conducted • ${metrics?.upcomingSessions || 0} upcoming`}
          color="mint"
        />
        <StatCard
          title="Total Batches"
          value={metrics?.totalBatches || 0}
          icon={Layers}
          changeText={`${batchSummary?.active || 0} active cohorts`}
          color="primary"
        />
        <StatCard
          title="Total Enrollments"
          value={metrics?.totalEnrollments || 0}
          icon={GraduationCap}
          changeText="Across all courses & batches"
          color="mint"
        />
        <StatCard
          title="Average Attendance"
          value={`${metrics?.avgAttendance || 0}%`}
          icon={CheckCircle}
          changeText="Across all active cohorts"
          color="primary"
        />
        <StatCard
          title="Completion Rate"
          value={`${metrics?.completionRate || 0}%`}
          icon={TrendingUp}
          changeText="Graduation & milestone pacing"
          color="mint"
        />
        <StatCard
          title="Certificates Issued"
          value={metrics?.validCertificates || 0}
          icon={Award}
          changeText={`${metrics?.revokedCertificates || 0} revoked • ${metrics?.totalCertificates || 0} total`}
          color="primary"
        />
        <StatCard
          title="Upcoming Sessions"
          value={metrics?.upcomingSessions || 0}
          icon={Radio}
          changeText="Live classes scheduled"
          color="mint"
        />
      </div>

      {/* 2. Enrollment Trend + Attendance + Batch summary */}
      <div className="grid-cards-auto">
        {/* Enrollment trend chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Student Enrollment</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>New enrollments over the last 6 months</p>
            </div>
            <Link to="/admin/analytics" className="btn btn-ghost btn-sm">
              Analytics <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: '18px 22px' }}>
            <EnrollmentTrendChart data={enrollmentTrend} />
          </div>
        </div>

        {/* Attendance + batch breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Attendance & Cohorts</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Live session attendance split and batch status</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '18px 22px' }}>
            {/* Attendance stacked bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Attendance Records</span>
                <span>{totalAttendance} total</span>
              </div>
              <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
                {attendanceSegments.map((seg) =>
                  totalAttendance > 0 && seg.value > 0 ? (
                    <div
                      key={seg.label}
                      style={{ width: `${(seg.value / totalAttendance) * 100}%`, background: seg.color }}
                      title={`${seg.label}: ${seg.value}`}
                    />
                  ) : null
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                {attendanceSegments.map((seg) => (
                  <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: seg.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Active', value: batchSummary?.active || 0, color: 'var(--mint)' },
                { label: 'Upcoming', value: batchSummary?.upcoming || 0, color: 'var(--primary)' },
                { label: 'Completed', value: batchSummary?.completed || 0, color: 'var(--text-secondary)' }
              ].map((b) => (
                <div key={b.label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: b.color }}>{b.value}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{b.label} Batches</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Performing Courses */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Top Performing Courses</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Ranked by enrollment, with completion and certificates</p>
          </div>
          <Link to="/admin/courses" className="btn btn-secondary btn-sm">
            All Courses <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Enrolled</th>
                <th>Completed</th>
                <th>Certificates</th>
                <th>Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {(!topCourses || topCourses.length === 0) ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No course data yet</td>
                </tr>
              ) : (
                topCourses.map((cp, idx) => (
                  <tr key={cp.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{cp.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{cp.duration || '—'}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{cp.instructor || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{cp.enrolled_count}</td>
                    <td>{cp.completed_count}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={13} color="var(--primary)" /> {cp.certificates_issued}
                      </span>
                    </td>
                    <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-container" style={{ flex: 1 }}>
                          <div className="progress-bar-fill mint" style={{ width: `${Math.round(cp.avg_completion || 0)}%` }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '34px' }}>
                          {Math.round(cp.avg_completion || 0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Students + Upcoming Live Classes */}
      <div className="grid-cards-auto">
        {/* Recent Students Table Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Recent Student Enrollments</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Newly registered student accounts</p>
            </div>
            <Link to="/admin/students" className="btn btn-secondary btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course & Batch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents?.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students registered yet
                    </td>
                  </tr>
                ) : (
                  recentStudents?.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                        {s.student_id}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.course_title || 'Unassigned'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>{s.batch_code}</div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            s.status === 'ACTIVE' ? 'success' : s.status === 'PENDING_ACTIVATION' ? 'warning' : 'error'
                          }
                        >
                          {s.status === 'PENDING_ACTIVATION' ? 'Pending' : s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Live Sessions Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Upcoming Live Classes</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Scheduled broadcast sessions</p>
            </div>
            <Link to="/admin/sessions" className="btn btn-secondary btn-sm">
              Manage <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px' }}>
            {upcomingClasses?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                No live classes scheduled
              </div>
            ) : (
              upcomingClasses?.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: c.status === 'LIVE' ? 'var(--mint-light)' : 'var(--bg-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: c.status === 'LIVE' ? 'var(--mint)' : 'var(--primary-light)',
                        color: c.status === 'LIVE' ? '#FFFFFF' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Video size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.title}</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {c.date} &bull; {c.start_time} - {c.end_time} &bull; {c.batch_code}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarClock size={11} /> {c.instructor_name} &bull; {c.meeting_provider}
                      </div>
                    </div>
                  </div>
                  <Badge variant={c.status === 'LIVE' ? 'mint' : 'primary'} pulse={c.status === 'LIVE'}>
                    {c.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Full Course Performance + Recent Activity */}
      <div className="grid-cards-auto">
        {/* Course Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Course Performance Overview</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Enrollment depth and completion pacing (all courses)</p>
            </div>
            <Link to="/admin/courses" className="btn btn-ghost btn-sm">
              All Courses
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '420px', overflowY: 'auto' }}>
            {coursePerformance?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No courses yet</div>
            ) : (
              coursePerformance?.map((cp) => (
                <div key={cp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{cp.title}</span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {cp.enrolled_count} students &bull; {Math.round(cp.avg_completion || 0)}% avg progress
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill mint"
                      style={{ width: `${Math.round(cp.avg_completion || 0)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Recent System & Security Activity</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Real-time audit log stream</p>
            </div>
            <Link to="/admin/settings" className="btn btn-ghost btn-sm">
              Audit Logs
            </Link>
          </div>
          <div className="card-body" style={{ padding: '16px 22px', maxHeight: '420px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentActivity?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No activity recorded</div>
              ) : (
                recentActivity?.map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }} />
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{act.action}</span>
                      <span style={{ color: 'var(--text-secondary)' }}> &mdash; {act.actor_name}</span>
                      {act.resource_type && (
                        <span style={{ color: 'var(--text-muted)' }}> ({act.resource_type})</span>
                      )}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
