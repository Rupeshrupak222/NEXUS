import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEnrolled() {
      try {
        const res = await api.get('/student/courses');
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('Failed to load student courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEnrolled();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>My Enrolled Courses</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Curriculum tracks and modules assigned to your student profile
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="120px" />
      ) : courses.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>You are not currently enrolled in any academic tracks.</p>
        </div>
      ) : (
        <div className="grid-cards-auto">
          {courses.map((course) => (
            <div key={course.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '160px' }}>
                <img
                  src={course.thumbnail}
                  alt={course.course_title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <Badge variant={course.status === 'COMPLETED' ? 'success' : 'mint'}>
                    {course.batch_code}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '17px', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                    {course.course_title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span>
                      {course.completed_lessons || 0} of {course.total_lessons || 0} lessons completed
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--mint-dark)' }}>
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

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    to={`/student/courses/${course.course_id}`}
                    className="btn btn-mint"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Open Curriculum & Learn <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
