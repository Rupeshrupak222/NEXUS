import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Layers, Video, FileText, Link as LinkIcon,
  Upload, Trash2, Clock, CheckCircle, Film
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

const EMPTY_LESSON = {
  title: '',
  type: 'VIDEO',
  durationMinutes: 20,
  videoUrl: '',
  content: '',
  sourceMode: 'upload' // 'upload' | 'url'
};

export function AdminCourseDetailPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [newLesson, setNewLesson] = useState(EMPTY_LESSON);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}`);
      if (res.success && res.data) {
        setCourse(res.data);
        if (!selectedModuleId && res.data.modules?.length) {
          setSelectedModuleId(res.data.modules[0].id);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load course.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      await api.post(`/admin/courses/${courseId}/modules`, {
        title: newModuleTitle.trim(),
        orderIndex: (course?.modules?.length || 0) + 1
      });
      showToast('Module added.', 'success');
      setNewModuleTitle('');
      await fetchCourse();
    } catch (err) {
      showToast(err.message || 'Failed to add module.', 'error');
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.upload('/admin/uploads/material', file);
      if (res.success && res.data) {
        const { url, kind } = res.data;
        // Store the served URL in the right field + align the lesson type.
        if (kind === 'PDF') {
          setNewLesson((prev) => ({ ...prev, type: 'PDF', content: url, videoUrl: '' }));
        } else {
          setNewLesson((prev) => ({ ...prev, type: 'VIDEO', videoUrl: url, content: '' }));
        }
        showToast(`Uploaded "${res.data.originalName}".`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetLessonForm = () => {
    setNewLesson(EMPTY_LESSON);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      showToast('Select a target module first.', 'error');
      return;
    }
    if (!newLesson.title.trim()) {
      showToast('Lesson title is required.', 'error');
      return;
    }

    // Validate that the material/source is present.
    const needsVideo = newLesson.type === 'VIDEO';
    const needsDoc = newLesson.type === 'PDF' || newLesson.type === 'RESOURCE';
    if (needsVideo && !newLesson.videoUrl) {
      showToast('Upload a video or provide a video URL.', 'error');
      return;
    }
    if (needsDoc && !newLesson.content) {
      showToast('Upload a document or provide a URL.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/courses/${courseId}/modules/${selectedModuleId}/lessons`, {
        title: newLesson.title.trim(),
        type: newLesson.type,
        durationMinutes: Number(newLesson.durationMinutes) || 15,
        videoUrl: newLesson.videoUrl,
        content: newLesson.content
      });
      showToast('Lesson added to curriculum.', 'success');
      resetLessonForm();
      await fetchCourse();
    } catch (err) {
      showToast(err.message || 'Failed to add lesson.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await api.delete(`/admin/courses/${courseId}/lessons/${lessonId}`);
      showToast('Lesson removed.', 'info');
      await fetchCourse();
    } catch (err) {
      showToast(err.message || 'Failed to delete lesson.', 'error');
    }
  };

  if (loading) return <LoadingSkeleton count={4} height="80px" />;

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Course not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/admin/courses')}>
          Back to Courses
        </button>
      </div>
    );
  }

  const isVideo = newLesson.type === 'VIDEO';
  const isDoc = newLesson.type === 'PDF' || newLesson.type === 'RESOURCE';
  const uploadAccept = isVideo ? 'video/mp4,video/webm,video/ogg,video/quicktime' : 'application/pdf';
  const currentMaterialUrl = isVideo ? newLesson.videoUrl : newLesson.content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/admin/courses')}>
        <ArrowLeft size={16} /> Back to Courses
      </button>

      {/* Course header */}
      <div className="card" style={{ padding: '20px', display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <img src={course.thumbnail} alt={course.title} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          {course.category && (
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{course.category}</div>
          )}
          <h2 style={{ margin: '2px 0 4px', fontSize: '20px' }}>{course.title}</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Instructor: {course.instructor || 'Guest Faculty'} · {course.duration || 'Multi-duration'}
          </div>
        </div>
        <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'neutral'}>{course.status}</Badge>
      </div>

      <div className="grid-form-2" style={{ gap: '20px', alignItems: 'flex-start' }}>
        {/* LEFT: curriculum list */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--primary)" /> Curriculum
          </h3>

          {(!course.modules || course.modules.length === 0) && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No modules yet. Add one on the right to start building the curriculum.</p>
          )}

          {course.modules?.map((m) => (
            <div key={m.id} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{m.title}</div>
              {m.lessons?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.lessons.map((l) => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)' }}>
                      {l.type === 'VIDEO' ? <Video size={15} color="var(--primary)" /> : <FileText size={15} color="var(--mint)" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-main)' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {l.type} · {l.duration_minutes || 0} min
                          {(l.video_url || l.content) ? ' · material attached' : ' · no material'}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete lesson" style={{ color: 'var(--error)' }} onClick={() => handleDeleteLesson(l.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>No lessons in this module yet.</p>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT: editors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add module */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Add Module</h4>
            <form onSubmit={handleAddModule} style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Module title (e.g. Module 1: Foundations)"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={15} /> Add
              </button>
            </form>
          </div>

          {/* Add lesson */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Add Lesson</h4>
            <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="grid-form-2" style={{ gap: 10 }}>
                <select className="form-select" value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} required>
                  <option value="">Select Target Module</option>
                  {course.modules?.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={newLesson.type}
                  onChange={(e) => setNewLesson({ ...EMPTY_LESSON, title: newLesson.title, sourceMode: newLesson.sourceMode, type: e.target.value })}
                >
                  <option value="VIDEO">VIDEO</option>
                  <option value="PDF">PDF / DOCUMENT</option>
                  <option value="RESOURCE">RESOURCE LINK</option>
                  <option value="TEXT">TEXT GUIDE</option>
                </select>
              </div>

              <input
                className="form-input"
                placeholder="Lesson title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                required
              />

              {/* Source toggle for VIDEO / PDF */}
              {(isVideo || newLesson.type === 'PDF') && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${newLesson.sourceMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setNewLesson({ ...newLesson, sourceMode: 'upload' })}
                  >
                    <Upload size={14} /> Upload file
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${newLesson.sourceMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setNewLesson({ ...newLesson, sourceMode: 'url' })}
                  >
                    <LinkIcon size={14} /> Use URL
                  </button>
                </div>
              )}

              {/* UPLOAD mode (VIDEO / PDF) */}
              {(isVideo || newLesson.type === 'PDF') && newLesson.sourceMode === 'upload' && (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: 14, textAlign: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={uploadAccept}
                    onChange={handleFileSelected}
                    style={{ display: 'none' }}
                    id="lesson-file-input"
                  />
                  <label htmlFor="lesson-file-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    {isVideo ? <Film size={15} /> : <FileText size={15} />}
                    {uploading ? ' Uploading…' : isVideo ? ' Choose video file' : ' Choose PDF file'}
                  </label>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    {isVideo ? 'MP4 / WebM / OGG / MOV, up to 500MB' : 'PDF, up to 500MB'}
                  </div>
                  {currentMaterialUrl && !uploading && (
                    <div style={{ fontSize: 12, color: 'var(--mint-dark)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> Material attached
                    </div>
                  )}
                </div>
              )}

              {/* URL mode for VIDEO */}
              {isVideo && newLesson.sourceMode === 'url' && (
                <input
                  type="url"
                  className="form-input"
                  placeholder="Video URL (YouTube embed link or direct .mp4)"
                  value={newLesson.videoUrl}
                  onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                />
              )}

              {/* URL mode for PDF + always for RESOURCE */}
              {((newLesson.type === 'PDF' && newLesson.sourceMode === 'url') || newLesson.type === 'RESOURCE') && (
                <input
                  type="url"
                  className="form-input"
                  placeholder={newLesson.type === 'PDF' ? 'PDF / Document URL' : 'Resource URL'}
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                />
              )}

              {/* TEXT body */}
              {newLesson.type === 'TEXT' && (
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Lesson text shown to the student"
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                  required
                />
              )}

              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="Duration (minutes)"
                value={newLesson.durationMinutes}
                onChange={(e) => setNewLesson({ ...newLesson, durationMinutes: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetLessonForm}>Clear</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || uploading}>
                  {submitting ? 'Adding…' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
