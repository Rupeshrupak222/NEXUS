import React, { useState, useEffect } from 'react';
import { Layers, Plus, Calendar, Users, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminBatchesPage() {
  const { showToast } = useToast();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    batchCode: '',
    name: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/admin/batches'),
        api.get('/admin/courses')
      ]);
      if (bRes.success) setBatches(bRes.data);
      if (cRes.success) setCourses(cRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch batches.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/batches', form);
      showToast('Cohort batch created successfully!', 'success');
      setCreateModal(false);
      setForm({ courseId: '', batchCode: '', name: '', startDate: '', endDate: '' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to create batch.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Academic Cohort Batches</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Organize students into distinct cohorts for targeted live classes and schedule tracks
          </p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create Cohort Batch
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="52px" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Batch Name</th>
                <th>Course Track</th>
                <th>Enrolled Students</th>
                <th>Timeline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '13.5px' }}>
                      {b.batch_code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.course_title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--mint)" />
                      <span>{b.student_count || 0} students</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {b.start_date || 'TBD'} &rarr; {b.end_date || 'TBD'}
                  </td>
                  <td>
                    <Badge variant={b.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE BATCH MODAL */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Cohort Batch"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateBatch}>
          <div className="form-group">
            <label className="form-label">Course Track *</label>
            <select
              className="form-select"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              required
            >
              <option value="">Select Course Track</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Batch Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. FSD-03"
                value={form.batchCode}
                onChange={(e) => setForm({ ...form, batchCode: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Full Stack - Cohort 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-form-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
