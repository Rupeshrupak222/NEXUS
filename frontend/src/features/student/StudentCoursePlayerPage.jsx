import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Award,
  Video,
  Download,
  Check,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentCoursePlayerPage() {
  const { id: courseId } = useParams();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completing, setCompleting] = useState(false);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/student/courses/${courseId}`);
      if (res.success && res.data) {
        setCourse(res.data);
        // Find first incomplete lesson, or default to the first lesson
        const allLessons = res.data.modules.flatMap((m) => m.lessons);
        if (allLessons.length > 0 && !currentLesson) {
          const firstIncomplete = allLessons.find((l) => !l.isCompleted) || allLessons[0];
          setCurrentLesson(firstIncomplete);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load course curriculum.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const allLessons = course ? course.modules.flatMap((m) => m.lessons) : [];
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleToggleComplete = async () => {
    if (!currentLesson) return;
    setCompleting(true);
    try {
      if (currentLesson.isCompleted) {
        await api.post(`/student/courses/${courseId}/lessons/${currentLesson.id}/uncomplete`);
        showToast('Lesson marked incomplete.', 'info');
      } else {
        const res = await api.post(`/student/courses/${courseId}/lessons/${currentLesson.id}/complete`);
        showToast('Lesson completed!', 'success');
        if (res.completionPercentage >= 100) {
          // Trigger confetti!
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          showToast('🎉 Course 100% completed! Verified certificate issued.', 'success');
        }
      }
      // Re-fetch to update progress and UI checkmarks
      const res = await api.get(`/student/courses/${courseId}`);
      if (res.success && res.data) {
        setCourse(res.data);
        const updatedCurrent = res.data.modules.flatMap((m) => m.lessons).find((l) => l.id === currentLesson.id);
        if (updatedCurrent) setCurrentLesson(updatedCurrent);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update progress.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} height="80px" />;
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Course curriculum unavailable</h3>
        <Link to="/student/courses" className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to My Courses
        </Link>
      </div>
    );
  }

  const completionPct = Math.round(course.enrollment?.completion_percentage || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Back & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <Link to="/student/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <ArrowLeft size={16} /> Back to My Courses
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
            {course.title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Overall Progress</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--mint-dark)' }}>{completionPct}% Complete</div>
          </div>
          <div className="progress-bar-container" style={{ width: '120px' }}>
            <div className="progress-bar-fill mint" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      </div>

      {/* Graduation Banner if 100% complete */}
      {completionPct >= 100 && (
        <div
          style={{
            backgroundColor: 'var(--mint-light)',
            border: '1px solid rgba(32,180,134,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--mint)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                Congratulations! Curriculum 100% Completed
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Your accredited academic certificate has been signed and added to your portfolio.
              </div>
            </div>
          </div>
          <Link to="/student/certificates" className="btn btn-mint btn-sm">
            View Certificate &rarr;
          </Link>
        </div>
      )}

      {/* Main Grid: Player on left, Curriculum Sidebar on right */}
      <div className="course-player-grid">
        {/* LEFT COLUMN: Lesson Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {currentLesson ? (
            <div className="card lesson-content-card" style={{ overflow: 'hidden' }}>
              {/* Content Viewer: Video, PDF/Document, Resource link, or Text banner */}
              {currentLesson.type === 'VIDEO' ? (
                currentLesson.video_url ? (
                  <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#0F172A' }}>
                    {/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(currentLesson.video_url) ? (
                      <video
                        src={currentLesson.video_url}
                        title={currentLesson.title}
                        controls
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
                      />
                    ) : (
                      <iframe
                        src={currentLesson.video_url}
                        title={currentLesson.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                ) : (
                  <div className="lesson-text-banner" style={{ padding: '24px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <Video size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                      The instructor has not uploaded a video for this lesson yet.
                    </p>
                  </div>
                )
              ) : currentLesson.type === 'PDF' ? (
                currentLesson.content ? (
                  <div style={{ backgroundColor: '#0F172A' }}>
                    <div style={{ position: 'relative', paddingTop: '75%' }}>
                      <iframe
                        src={currentLesson.content}
                        title={currentLesson.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', backgroundColor: 'var(--bg-subtle)' }}>
                      <a href={currentLesson.content} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        <Download size={16} /> Open / Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="lesson-text-banner" style={{ padding: '24px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <FileText size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                      The instructor has not uploaded a document for this lesson yet.
                    </p>
                  </div>
                )
              ) : currentLesson.type === 'RESOURCE' ? (
                <div className="lesson-text-banner" style={{ padding: '24px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                  <Badge variant="mint" style={{ marginBottom: '8px' }}>RESOURCE</Badge>
                  <h3 style={{ fontSize: '20px', margin: '0 0 12px', color: 'var(--text-main)' }}>
                    {currentLesson.title}
                  </h3>
                  {currentLesson.content && (
                    <a href={currentLesson.content} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      <FileText size={16} /> Open Resource
                    </a>
                  )}
                </div>
              ) : (
                <div className="lesson-text-banner" style={{ padding: '24px 24px 16px', backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}>
                  <Badge variant="mint" style={{ marginBottom: '8px' }}>{currentLesson.type}</Badge>
                  <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)' }}>
                    {currentLesson.title}
                  </h3>
                </div>
              )}

              {/* Lesson Details */}
              <div className="lesson-body-padding" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-main)' }}>
                    {currentLesson.title}
                  </h3>
                  <Badge variant="neutral">
                    {currentLesson.duration_minutes} minutes
                  </Badge>
                </div>

                <div style={{ fontSize: '14.5px', lineHeight: 1.7, color: 'var(--text-main)', marginBottom: '24px' }}>
                  <p>
                    {currentLesson.type === 'PDF' || currentLesson.type === 'RESOURCE'
                      ? 'Open the material above to view the full content for this lesson.'
                      : currentLesson.content || 'In this comprehensive session, explore the core concepts, implementation guidelines, and industry architectural standards.'}
                  </p>
                </div>

                {/* Lesson Navigation Footer */}
                <div className="lesson-nav-footer">
                  <button
                    onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                    className="btn btn-secondary btn-sm"
                    disabled={!prevLesson}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <button
                    onClick={handleToggleComplete}
                    className={`btn ${currentLesson.isCompleted ? 'btn-secondary' : 'btn-mint'} btn-sm`}
                    disabled={completing}
                  >
                    {currentLesson.isCompleted ? (
                      <>
                        <Check size={16} color="var(--mint)" /> Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Mark Complete
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                    className="btn btn-primary btn-sm"
                    disabled={!nextLesson}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              Select a lesson from the curriculum outline.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Curriculum Navigation Outline */}
        <div className="card course-outline-card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '15px' }}>Curriculum Outline</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {allLessons.filter((l) => l.isCompleted).length} / {allLessons.length} done
            </span>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '12px' }}>
            {course.modules.map((m, mIdx) => (
              <div key={m.id} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px' }}>
                  {m.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {m.lessons.map((l) => {
                    const isSelected = currentLesson?.id === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setCurrentLesson(l)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--mint-light)' : 'transparent',
                          color: isSelected ? 'var(--mint-dark)' : 'var(--text-main)',
                          transition: 'background var(--transition-fast)'
                        }}
                      >
                        {l.isCompleted ? (
                          <CheckCircle size={16} color="var(--mint)" style={{ flexShrink: 0 }} />
                        ) : (
                          <Circle size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {l.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {l.duration_minutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
