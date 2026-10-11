import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, PieChart } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/admin/analytics');
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  const { monthlyEnrollments, batchAttendance, courseBreakdown } = analytics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Academy Analytics & Reports</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Real-time metrics, cohort attendance compliance, and completion velocity
        </p>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid-cards-auto">
        {/* Monthly Enrollment Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Monthly Student Admissions</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Historical enrollment pace</p>
            </div>
            <TrendingUp size={18} color="var(--primary)" />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              {monthlyEnrollments?.map((item) => {
                const max = 70;
                const heightPercent = Math.round((item.count / max) * 100);
                return (
                  <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{item.count}</span>
                    <div
                      style={{
                        width: '32px',
                        height: `${heightPercent}%`,
                        backgroundColor: 'var(--primary)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 400ms ease'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Batch Attendance Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Cohort Attendance Compliance</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px' }}>Attendance rates per cohort batch</p>
            </div>
            <Users size={18} color="var(--mint)" />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {batchAttendance?.map((b) => {
              const rate = b.sessions_recorded > 0 ? Math.round((b.attended / b.sessions_recorded) * 100) : 95;
              return (
                <div key={b.batch_code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px' }}>{b.batch_code}</strong>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint-dark)' }}>{rate}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill mint" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Completion Velocity Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Curriculum Progression by Course Track</h3>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Enrolled Learners</th>
                <th>Graduated (Completed)</th>
                <th>Average Curriculum Pacing</th>
              </tr>
            </thead>
            <tbody>
              {courseBreakdown?.map((c) => (
                <tr key={c.title}>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{c.enrolled} students</td>
                  <td>
                    <span style={{ color: 'var(--mint-dark)', fontWeight: 600 }}>
                      {c.completed} completed
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar-container" style={{ width: '120px' }}>
                        <div className="progress-bar-fill" style={{ width: `${c.avg_progress || 0}%` }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.avg_progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
