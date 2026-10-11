import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  UserX,
  UserCheck,
  KeyRound,
  MoreVertical,
  CheckCircle2,
  Mail,
  GraduationCap
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminStudentsPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Course & Batch options for modals & filters
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    batchId: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    status: 'ACTIVE'
  });
  const [editLoading, setEditLoading] = useState(false);

  // Load Course and Batch lists
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, bRes] = await Promise.all([
          api.get('/admin/courses'),
          api.get('/admin/batches')
        ]);
        if (cRes.success) setCourses(cRes.data);
        if (bRes.success) setBatches(bRes.data);
      } catch (err) {
        console.error('Failed to load courses/batches meta:', err);
      }
    }
    loadMeta();
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', {
        search,
        status: statusFilter,
        courseId: courseFilter,
        batchId: batchFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch student directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, courseFilter, batchFilter, pagination.page, pagination.limit, showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Create Student Handler
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.courseId || !createForm.batchId) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post('/admin/students', createForm);
      showToast(res.data?.message || 'Student account created and activation email dispatched!', 'success');
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        courseId: '',
        batchId: '',
        joiningDate: new Date().toISOString().split('T')[0]
      });
      fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to create student account.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (st) => {
    setSelectedStudent(st);
    setEditForm({
      name: st.name,
      phone: st.phone || '',
      status: st.status
    });
    setEditModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setEditLoading(true);
    try {
      await api.patch(`/admin/students/${selectedStudent.id}`, editForm);
      showToast('Student profile updated successfully.', 'success');
      setEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to update student.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (st) => {
    const nextStatus = st.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      await api.patch(`/admin/students/${st.id}`, { status: nextStatus });
      showToast(`Student status updated to ${nextStatus}.`, 'success');
      fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  // Send Reset Link
  const handleSendResetLink = async (st) => {
    try {
      const res = await api.post(`/admin/students/${st.id}/send-reset-link`);
      showToast(res.data?.message || `Password reset link sent to ${st.email}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reset link.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Student Management</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Total registered: {pagination.total} students
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <UserPlus size={16} /> Enroll New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_ACTIVATION">Pending Activation</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>

        {/* Course Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {/* Batch Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.batch_code}</option>
          ))}
        </select>
      </div>

      {/* Student Table */}
      {loading ? (
        <LoadingSkeleton count={6} height="52px" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="Try modifying your search criteria or enroll a new student to get started."
          action={
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
              <UserPlus size={14} /> Enroll Student
            </button>
          }
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Progress</th>
                <th>Attendance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {st.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{st.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                    {st.student_id}
                  </td>
                  <td>{st.course_title || 'None'}</td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                      {st.batch_code || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar-container" style={{ width: '70px' }}>
                        <div
                          className="progress-bar-fill mint"
                          style={{ width: `${Math.round(st.completion_percentage || 0)}%` }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {Math.round(st.completion_percentage || 0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: st.attendanceRate >= 80 ? 'var(--mint-dark)' : 'var(--warning)' }}>
                      {st.attendanceRate}%
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant={
                        st.status === 'ACTIVE'
                          ? 'success'
                          : st.status === 'PENDING_ACTIVATION'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {st.status === 'PENDING_ACTIVATION' ? 'Pending' : st.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Link
                        to={`/admin/students/${st.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px' }}
                        title="View Full Student Details"
                      >
                        <Eye size={15} /> View
                      </Link>
                      <button
                        onClick={() => openEditModal(st)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px' }}
                        title="Edit Student"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleSendResetLink(st)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px' }}
                        title="Send Password Reset Link"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`btn btn-ghost btn-sm ${st.status === 'ACTIVE' ? 'color-error' : ''}`}
                        style={{ padding: '6px 8px' }}
                        title={st.status === 'ACTIVE' ? 'Deactivate Student' : 'Activate Student'}
                      >
                        {st.status === 'ACTIVE' ? <UserX size={15} color="var(--error)" /> : <UserCheck size={15} color="var(--mint)" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Enroll New Student"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateStudent}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Security Notice:</strong> The academy does not set passwords for students. Upon creation, a secure single-use cryptographic token is dispatched to the student's email to establish their password.
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. rahul@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input
                type="date"
                className="form-input"
                value={createForm.joiningDate}
                onChange={(e) => setCreateForm({ ...createForm, joiningDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Course Track *</label>
              <select
                className="form-select"
                value={createForm.courseId}
                onChange={(e) => {
                  setCreateForm({ ...createForm, courseId: e.target.value, batchId: '' });
                }}
                required
              >
                <option value="">Select Course Track</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cohort Batch *</label>
              <select
                className="form-select"
                value={createForm.batchId}
                onChange={(e) => setCreateForm({ ...createForm, batchId: e.target.value })}
                required
              >
                <option value="">Select Batch</option>
                {batches
                  .filter((b) => !createForm.courseId || b.course_id === createForm.courseId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.batch_code} &mdash; {b.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createLoading}
            >
              {createLoading ? 'Provisioning Student...' : 'Create Student & Dispatch Email'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Student — ${selectedStudent?.student_id}`}
        maxWidth="500px"
      >
        <form onSubmit={handleUpdateStudent}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Phone</label>
            <input
              type="tel"
              className="form-input"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_ACTIVATION">PENDING_ACTIVATION</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={editLoading}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
