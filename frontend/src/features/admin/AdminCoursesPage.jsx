import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Layers, Users, Clock, Edit, Trash2, Eye, Search, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

const EMPTY_COURSE = {
  title: '',
  description: '',
  category: '',
  instructor: '',
  duration: '',
  status: 'PUBLISHED'
};

export function AdminCoursesPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [createCourseModal, setCreateCourseModal] = useState(false);
  const [editCourseModal, setEditCourseModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Forms
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE);
  const [editCourse, setEditCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses');
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch courses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Derive category options from loaded courses
  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Apply search + category filter client-side
  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.instructor?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [courses, search, categoryFilter]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', newCourse);
      showToast('Course track successfully created!', 'success');
      setCreateCourseModal(false);
      setNewCourse(EMPTY_COURSE);
      fetchCourses();
    } catch (err) {
      showToast(err.message || 'Failed to create course.', 'error');
    }
  };

  const openEdit = (course) => {
    setEditCourse({
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
      status: course.status || 'PUBLISHED'
    });
    setEditCourseModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editCourse) return;
    try {
      const { id, ...payload } = editCourse;
      await api.patch(`/admin/courses/${id}`, payload);
      showToast('Course updated successfully.', 'success');
      setEditCourseModal(false);
      setEditCourse(null);
      fetchCourses();
    } catch (err) {
      showToast(err.message || 'Failed to update course.', 'error');
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/courses/${deleteTarget.id}`);
      showToast(`"${deleteTarget.title}" deleted.`, 'success');
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      showToast(err.message || 'Failed to delete course.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={22} color="var(--primary)" /> Course Management
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Construct course syllabi, browse categories, organize lessons, and assign projects.
          </p>
        </div>
        <button onClick={() => setCreateCourseModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create New Course
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label className="form-label" style={{ margin: 0, fontSize: '12.5px' }}>Category:</label>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search Course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? 'course' : 'courses'}
          </span>
          <button onClick={fetchCourses} className="btn btn-ghost btn-icon btn-sm" title="Refresh" type="button">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="120px" />
      ) : filteredCourses.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No courses match your filters.
        </div>
      ) : (
        <div className="grid-cards-auto">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{ position: 'relative', height: '160px', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/courses/${course.id}`)}
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <Badge variant={course.status === 'PUBLISHED' ? 'success' : course.status === 'DRAFT' ? 'warning' : 'neutral'}>
                    {course.status === 'PUBLISHED' ? 'Active' : course.status}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {course.category && (
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                      {course.category}
                    </div>
                  )}
                  <h3
                    style={{ fontSize: '16px', margin: '0 0 6px 0', color: 'var(--text-main)', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                  >
                    {course.title}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Instructor: {course.instructor || 'Guest Faculty'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {course.duration || 'Multi-duration'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                      <Users size={14} color="var(--mint)" /> {course.student_count || 0} Students
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                    className="btn btn-secondary btn-sm"
                    title="Preview curriculum"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button
                    onClick={() => openEdit(course)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Edit course"
                    type="button"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(course)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Delete course"
                    type="button"
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      <Modal
        isOpen={createCourseModal}
        onClose={() => setCreateCourseModal(false)}
        title="Create New Course Track"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateCourse}>
          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Distributed Cloud Systems & Microservices"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Provide a summary of the learning objectives..."
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            />
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSE/IT Domains"
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                list="course-categories"
              />
              <datalist id="course-categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Instructor Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Alexander Wright"
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 10 Weeks (100 Hours)"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={newCourse.status}
                onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
              >
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={() => setCreateCourseModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT COURSE MODAL */}
      <Modal
        isOpen={editCourseModal}
        onClose={() => setEditCourseModal(false)}
        title={`Edit Course — ${editCourse?.title || ''}`}
        maxWidth="540px"
      >
        {editCourse && (
          <form onSubmit={handleUpdateCourse}>
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input
                type="text"
                className="form-input"
                value={editCourse.title}
                onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editCourse.description}
                onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
              />
            </div>

            <div className="grid-form-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCourse.category}
                  onChange={(e) => setEditCourse({ ...editCourse, category: e.target.value })}
                  list="course-categories"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instructor Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCourse.instructor}
                  onChange={(e) => setEditCourse({ ...editCourse, instructor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-form-2">
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCourse.duration}
                  onChange={(e) => setEditCourse({ ...editCourse, duration: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editCourse.status}
                  onChange={(e) => setEditCourse({ ...editCourse, status: e.target.value })}
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setEditCourseModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Course"
        maxWidth="440px"
      >
        {deleteTarget && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              Are you sure you want to permanently delete <strong>{deleteTarget.title}</strong>?
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--error)', margin: '0 0 16px' }}>
              This also removes its modules, lessons, batches, enrollments, and certificates. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeleteCourse} className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>
                <Trash2 size={15} /> Delete Course
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
