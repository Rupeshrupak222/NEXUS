import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Clock, Award, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentProgressPage() {
  const [progress, setProgress] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, aRes] = await Promise.all([
          api.get('/student/progress'),
          api.get('/student/attendance')
        ]);
        if (pRes.success) setProgress(pRes.data);
        if (aRes.success) setAttendance(aRes.data);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  const { overall, courses } = progress || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>My Academic Progress</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Review your lesson completions, cohort participation, and curriculum milestones
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Overall Completion"
          value={`${overall?.overallPercentage || 0}%`}
          icon={TrendingUp}
          changeText="Across all enrolled courses"
          color="mint"
        />
        <StatCard
          title="Completed Lessons"
          value={overall?.totalLessonsCompleted || 0}
          icon={CheckCircle2}
          changeText="Verified modules"
          color="mint"
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendance?.attendanceRate || 100}%`}
          icon={Clock}
          changeText={`${attendance?.records?.length || 0} live sessions attended`}
          color="mint"
        />
        <StatCard
          title="Completed Tracks"
          value={overall?.completedCourses || 0}
          icon={Award}
          changeText={`Out of ${overall?.totalEnrolled || 0} tracks`}
          color="mint"
        />
      </div>

      {/* Course-by-Course Progress Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Course Breakdown</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {courses?.map((c) => (
            <div key={c.id} style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15.5px' }}>{c.title}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Batch: <strong>{c.batch_code}</strong> &bull; {c.completed_lessons} of {c.total_lessons} lessons completed
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--mint-dark)' }}>
                  {Math.round(c.completion_percentage)}%
                </div>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill mint"
                  style={{ width: `${Math.round(c.completion_percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
