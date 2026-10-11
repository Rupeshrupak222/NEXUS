import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Video,
  PlayCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  ListChecks,
  CalendarClock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [joinResult, setJoinResult] = useState(null);

  useEffect(() => {
    async function fetchStudentDashboard() {
      try {
        const res = await api.get('/student/dashboard');
        if (res.success && res.data) {
          setDashboard(res.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentDashboard();
  }, []);

  // Secure Join Flow (Section 15, 16, 17)
  const handleJoinClass = async (sessionId) => {
    setJoining(true);
    try {
      const res = await api.get(`/student/sessions/${sessionId}/join`);
      if (res.success && res.data) {
        setJoinResult(res.data);
        setJoinModal(true);
        showToast('Authorized! Attendance recorded.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Unable to join session at this time.', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  const {
    studentName,
    enrolledCourses,
    nextSession,
    overallProgress,
    attendanceRate,
    certificateCount,
    stats,
    courseProgress,
    attendanceBreakdown,
    upcomingSessions,
    certificates,
    recentAttendance
  } = dashboard || {};
  const activeCourse = enrolledCourses && enrolledCourses.length > 0 ? enrolledCourses[0] : null;

  const totalAttend =
    (attendanceBreakdown?.present || 0) + (attendanceBreakdown?.partial || 0) + (attendanceBreakdown?.absent || 0);
  const attendSegments = [
    { label: 'Present', value: attendanceBreakdown?.present || 0, color: 'var(--mint)' },
    { label: 'Partial', value: attendanceBreakdown?.partial || 0, color: 'var(--warning, #f59e0b)' },
    { label: 'Absent', value: attendanceBreakdown?.absent || 0, color: 'var(--error, #ef4444)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header Welcome Greeting */}
      <div
        className="card"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--mint-dark)', fontWeight: 600, marginBottom: '6px' }}>
            <Sparkles size={16} /> Ready to continue your learning journey?
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Good day, {studentName || user?.name} 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Track your curriculum milestones, join live cohorts, and earn accredited credentials.
          </p>
        </div>

        {nextSession && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleJoinClass(nextSession.id)}
              className="btn btn-mint btn-lg"
              disabled={joining}
            >
              <Video size={18} /> {joining ? 'Authorizing Access...' : 'Join Next Live Class'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Metric Cards (full set) */}
      <div className="grid-metrics">
        <StatCard
          title="Enrolled Courses"
          value={stats?.totalCourses ?? enrolledCourses?.length ?? 0}
          icon={BookOpen}
          changeText={`${stats?.completedCourses || 0} completed • ${stats?.inProgressCourses || 0} in progress`}
          color="mint"
        />
        <StatCard
          title="Overall Progress"
          value={`${overallProgress?.overallPercentage || 0}%`}
          icon={TrendingUp}
          changeText={`${stats?.completedLessons || 0} of ${stats?.totalLessons || 0} lessons done`}
          color="mint"
        />
        <StatCard
          title="Lessons Completed"
          value={stats?.completedLessons || 0}
          icon={ListChecks}
          changeText={`${stats?.remainingLessons || 0} lessons remaining`}
          color="mint"
        />
        <StatCard
          title="My Attendance"
          value={`${attendanceRate ?? 100}%`}
          icon={Clock}
          changeText={`${totalAttend} live sessions attended`}
          color="mint"
        />
        <StatCard
          title="Live Classes"
          value={stats?.totalSessions || 0}
          icon={Video}
          changeText={`${stats?.upcomingSessionsCount || 0} upcoming`}
          color="mint"
        />
        <StatCard
          title="Earned Certificates"
          value={certificateCount || 0}
          icon={Award}
          changeText="Verified certifications"
          color="mint"
        />
      </div>

      {/* 3. Continue Learning & Next Live Class */}
      <div className="grid-cards-auto">
        {/* Continue Learning Card */}
        {activeCourse ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Continue Learning</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Pick up where you left off</p>
              </div>
              <Badge variant="mint">{activeCourse.batch_code}</Badge>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                <img
                  src={activeCourse.thumbnail}
                  alt={activeCourse.course_title}
                  style={{ width: '110px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {activeCourse.course_title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Last accessed: <strong>{activeCourse.last_completed_lesson_title || 'Module 1 Foundations'}</strong>
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span>Curriculum Progress</span>
                    <span style={{ fontWeight: 700, color: 'var(--mint-dark)' }}>
                      {Math.round(activeCourse.completion_percentage || 0)}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill mint"
                      style={{ width: `${Math.round(activeCourse.completion_percentage || 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/student/courses/${activeCourse.course_id}`} className="btn btn-mint">
                  Continue Learning <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>You are not enrolled in any course track yet.</p>
          </div>
        )}

        {/* Next Live Class Session Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Next Live Interactive Class</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Upcoming cohort broadcast</p>
            </div>
            {nextSession && (
              <Badge variant={nextSession.status === 'LIVE' ? 'mint' : 'primary'} pulse={nextSession.status === 'LIVE'}>
                {nextSession.status}
              </Badge>
            )}
          </div>
          <div className="card-body">
            {nextSession ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '17px', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {nextSession.title}
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Instructor: <strong>{nextSession.instructor_name}</strong> &bull; Cohort: <strong>{nextSession.batch_code}</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Calendar size={16} color="var(--mint)" /> {nextSession.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <Clock size={15} /> {nextSession.start_time} &ndash; {nextSession.end_time} (Doors open 15m prior)
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    onClick={() => handleJoinClass(nextSession.id)}
                    className="btn btn-mint"
                    disabled={joining}
                  >
                    <Video size={16} /> {joining ? 'Authorizing...' : 'Enter Live Classroom'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                No live classes scheduled for today. Check your calendar for upcoming dates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3b. Course Progress Breakdown + Attendance */}
      <div className="grid-cards-auto">
        {/* Per-course progress */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Course Progress Breakdown</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Lessons completed per enrolled course</p>
            </div>
            <Link to="/student/progress" className="btn btn-ghost btn-sm">
              Full Progress <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '360px', overflowY: 'auto' }}>
            {(!courseProgress || courseProgress.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No course progress yet</div>
            ) : (
              courseProgress.map((cp) => (
                <div key={cp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{cp.title}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {cp.completed_lessons || 0}/{cp.total_lessons || 0} lessons &bull; {Math.round(cp.completion_percentage || 0)}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill mint" style={{ width: `${Math.round(cp.completion_percentage || 0)}%` }} />
                  </div>
                  {cp.batch_code && (
                    <div style={{ fontSize: '11px', color: 'var(--mint-dark)', fontWeight: 600, marginTop: '4px' }}>{cp.batch_code}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance breakdown + recent attendance */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Attendance Overview</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Live session attendance record</p>
            </div>
            <Badge variant="mint">{attendanceRate ?? 100}%</Badge>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 22px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Attendance split</span>
                <span style={{ color: 'var(--text-secondary)' }}>{totalAttend} records</span>
              </div>
              <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
                {attendSegments.map((seg) =>
                  totalAttend > 0 && seg.value > 0 ? (
                    <div key={seg.label} style={{ width: `${(seg.value / totalAttend) * 100}%`, background: seg.color }} title={`${seg.label}: ${seg.value}`} />
                  ) : null
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                {attendSegments.map((seg) => (
                  <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: seg.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Recent sessions attended</div>
              {(!recentAttendance || recentAttendance.length === 0) ? (
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No attendance records yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentAttendance.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', padding: '8px 10px', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <CalendarClock size={13} /> {r.session_title || r.title || 'Live Session'}
                      </span>
                      <Badge variant={r.attendance_status === 'PRESENT' ? 'success' : r.attendance_status === 'PARTIAL' ? 'warning' : 'error'}>
                        {r.attendance_status || 'PRESENT'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3c. Upcoming Sessions + Earned Certificates */}
      <div className="grid-cards-auto">
        {/* Upcoming sessions list */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Upcoming Live Classes</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Your next scheduled cohort sessions</p>
            </div>
            <Link to="/student/live-classes" className="btn btn-secondary btn-sm">
              All Classes <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px' }}>
            {(!upcomingSessions || upcomingSessions.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No upcoming sessions scheduled</div>
            ) : (
              upcomingSessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: s.status === 'LIVE' ? 'var(--mint-light)' : 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: s.status === 'LIVE' ? 'var(--mint)' : 'var(--primary-light)', color: s.status === 'LIVE' ? '#fff' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {s.date} &bull; {s.start_time}-{s.end_time} &bull; {s.batch_code}
                      </div>
                    </div>
                  </div>
                  {s.status === 'LIVE' ? (
                    <button onClick={() => handleJoinClass(s.id)} className="btn btn-mint btn-sm" disabled={joining}>
                      Join
                    </button>
                  ) : (
                    <Badge variant="primary">{s.status}</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Earned certificates */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Earned Certificates</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Your verified, accredited credentials</p>
            </div>
            <Link to="/student/certificates" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', maxHeight: '360px', overflowY: 'auto' }}>
            {(!certificates || certificates.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                No certificates yet. Complete a course to earn one.
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--bg-subtle)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--mint-light)', color: 'var(--mint-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GraduationCap size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{cert.course_title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{cert.certificate_number}</span>
                      <span>&bull; {cert.issue_date}</span>
                      {cert.grade_or_score && <span>&bull; {cert.grade_or_score}</span>}
                    </div>
                  </div>
                  <Badge variant={cert.status === 'VALID' ? 'success' : 'error'}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldCheck size={12} /> {cert.status}
                    </span>
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Enrolled Courses Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>My Enrolled Courses</h3>
          <Link to="/student/courses" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--mint-dark)' }}>
            View All Courses &rarr;
          </Link>
        </div>

        <div className="grid-cards-auto">
          {enrolledCourses?.map((course) => (
            <div key={course.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
              <img
                src={course.thumbnail}
                alt={course.course_title}
                style={{ height: '140px', width: '100%', objectFit: 'cover' }}
              />
              <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <Badge variant="mint">{course.batch_code}</Badge>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{course.duration}</span>
                  </div>
                  <h4 style={{ fontSize: '15px', margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                    {course.course_title}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>{course.completed_lessons || 0} of {course.total_lessons || 0} lessons completed</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {Math.round(course.completion_percentage || 0)}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill mint"
                      style={{ width: `${Math.round(course.completion_percentage || 0)}%` }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to={`/student/courses/${course.course_id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    Open Curriculum
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JOIN SESSION MODAL WITH SECURE URL */}
      <Modal
        isOpen={joinModal}
        onClose={() => setJoinModal(false)}
        title="Live Classroom Access Granted"
        maxWidth="500px"
      >
        {joinResult && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle2 size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>
                {joinResult.sessionTitle}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                Instructor: {joinResult.instructor} &bull; Platform: {joinResult.meetingProvider}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Your attendance entry has been verified and registered on the academic attendance ledger.
            </div>

            <a
              href={joinResult.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-mint btn-lg"
              style={{ justifyContent: 'center', marginTop: '6px' }}
            >
              Launch Meeting &rarr;
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
