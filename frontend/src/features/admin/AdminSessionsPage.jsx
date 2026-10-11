import React, { useState, useEffect } from 'react';
import { Radio, Plus, Video, Calendar, Clock, Users, Link2, CheckCircle2, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminSessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Create Form State
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    batchId: '',
    instructorName: 'Dr. Alexander Wright',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    meetingProvider: 'ZOOM',
    meetingReference: 'https://zoom.us/j/demo-academy-nexus-live',
    recordingReference: ''
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    status: 'SCHEDULED',
    recordingReference: '',
    meetingReference: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, bRes] = await Promise.all([
        api.get('/admin/sessions'),
        api.get('/admin/courses'),
        api.get('/admin/batches')
      ]);
      if (sRes.success) setSessions(sRes.data);
      if (cRes.success) setCourses(cRes.data);
      if (bRes.success) setBatches(bRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch sessions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sessions', form);
      showToast('Live class session scheduled successfully!', 'success');
      setCreateModal(false);
      setForm({
        title: '',
        courseId: '',
        batchId: '',
        instructorName: 'Dr. Alexander Wright',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:30',
        meetingProvider: 'ZOOM',
        meetingReference: 'https://zoom.us/j/demo-academy-nexus-live',
        recordingReference: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to schedule session.', 'error');
    }
  };

  const openEdit = (session) => {
    setSelectedSession(session);
    setEditForm({
      title: session.title,
      status: session.status,
      recordingReference: session.recording_reference || '',
      meetingReference: session.meeting_reference || ''
    });
    setEditModal(true);
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      await api.patch(`/admin/sessions/${selectedSession.id}`, editForm);
      showToast('Session updated successfully.', 'success');
      setEditModal(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update session.', 'error');
    }
  };

  const viewAttendance = async (session) => {
    setSelectedSession(session);
    setAttendanceModal(true);
    try {
      const res = await api.get(`/admin/sessions/${session.id}/attendance`);
      if (res.success && res.data) {
        setAttendanceRecords(res.data);
      }
    } catch (err) {
      showToast('Failed to load attendance list.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Live Interactive Sessions</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Schedule webinars, broadcast video lectures, and monitor student attendance
          </p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Schedule Live Session
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="56px" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Session Title</th>
                <th>Course & Batch</th>
                <th>Instructor</th>
                <th>Date & Time</th>
                <th>Platform</th>
                <th>Attendees</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.title}</div>
                    {s.recording_reference && (
                      <span style={{ fontSize: '11px', color: 'var(--mint-dark)', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <PlayCircle size={12} /> Recording Available
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{s.course_title}</div>
                    <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600 }}>
                      {s.batch_code}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{s.instructor_name}</td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.date}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {s.start_time} - {s.end_time}
                    </div>
                  </td>
                  <td>
                    <Badge variant="neutral">{s.meeting_provider}</Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => viewAttendance(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Click to view verified attendance"
                    >
                      <Users size={14} /> {s.attendance_count || 0} students
                    </button>
                  </td>
                  <td>
                    <Badge
                      variant={
                        s.status === 'LIVE'
                          ? 'mint'
                          : s.status === 'COMPLETED'
                          ? 'neutral'
                          : s.status === 'CANCELLED'
                          ? 'error'
                          : 'primary'
                      }
                      pulse={s.status === 'LIVE'}
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEdit(s)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit / Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Schedule Live Session"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSession}>
          <div className="form-group">
            <label className="form-label">Session Topic / Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React 19 Server Components Deep Dive"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Course Track *</label>
              <select
                className="form-select"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value, batchId: '' })}
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Cohort Batch *</label>
              <select
                className="form-select"
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                required
              >
                <option value="">Select Cohort Batch</option>
                {batches
                  .filter((b) => !form.courseId || b.course_id === form.courseId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.batch_code} &mdash; {b.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid-form-3">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Meeting Provider</label>
              <select
                className="form-select"
                value={form.meetingProvider}
                onChange={(e) => setForm({ ...form, meetingProvider: e.target.value })}
              >
                <option value="ZOOM">Zoom</option>
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="TEAMS">Microsoft Teams</option>
                <option value="CUSTOM">Custom WebRTC</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Secure Meeting Link *</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://zoom.us/j/..."
                value={form.meetingReference}
                onChange={(e) => setForm({ ...form, meetingReference: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT SESSION & RECORDINGS MODAL */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Manage Session & Recording"
        maxWidth="500px"
      >
        <form onSubmit={handleUpdateSession}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="LIVE">LIVE (Broadcasting)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Link (Room Reference)</label>
            <input
              type="text"
              className="form-input"
              value={editForm.meetingReference}
              onChange={(e) => setEditForm({ ...editForm, meetingReference: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lecture Recording URL (Post-Session)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://... (MP4 / Stream URL)"
              value={editForm.recordingReference}
              onChange={(e) => setEditForm({ ...editForm, recordingReference: e.target.value })}
            />
            <span className="form-hint">Enrolled students can watch this recording from their portal.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={() => setEditModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Session
            </button>
          </div>
        </form>
      </Modal>

      {/* ATTENDANCE VIEWER MODAL */}
      <Modal
        isOpen={attendanceModal}
        onClose={() => setAttendanceModal(false)}
        title={`Verified Attendance Log — ${selectedSession?.title}`}
        maxWidth="640px"
      >
        {attendanceRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No attendance recorded for this session yet.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Joined At</th>
                  <th>Duration</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((ar) => (
                  <tr key={ar.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ar.student_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ar.student_email}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{ar.student_code}</td>
                    <td>{new Date(ar.joined_at).toLocaleTimeString()}</td>
                    <td>{Math.round(ar.duration_seconds / 60)} min</td>
                    <td>
                      <Badge variant={ar.attendance_status === 'PRESENT' ? 'success' : 'warning'}>
                        {ar.attendance_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
