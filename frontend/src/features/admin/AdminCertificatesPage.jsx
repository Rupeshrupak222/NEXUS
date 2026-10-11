import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus, CheckCircle2, ExternalLink, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function AdminCertificatesPage() {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issueModal, setIssueModal] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    courseId: '',
    gradeOrScore: 'Distinction (95%)'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes, coRes] = await Promise.all([
        api.get('/admin/certificates'),
        api.get('/admin/students', { limit: 100 }),
        api.get('/admin/courses')
      ]);
      if (cRes.success) setCertificates(cRes.data);
      if (sRes.success) setStudents(sRes.data.students || []);
      if (coRes.success) setCourses(coRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch certificates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/certificates/issue', form);
      showToast('Certificate successfully issued and dispatched!', 'success');
      setIssueModal(false);
      setForm({ studentId: '', courseId: '', gradeOrScore: 'Distinction (95%)' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to issue certificate.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Issued Certificates & Credentials</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Monitor authenticated certificates with public tamper-proof verification
          </p>
        </div>
        <button onClick={() => setIssueModal(true)} className="btn btn-primary">
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="52px" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Recipient Student</th>
                <th>Course Track</th>
                <th>Issue Date</th>
                <th>Honors / Standing</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Public Verification</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      {cert.certificate_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cert.student_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{cert.student_code}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{cert.course_title}</td>
                  <td style={{ fontSize: '13px' }}>{cert.issue_date}</td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--mint-dark)', fontWeight: 600 }}>
                      {cert.grade_or_score}
                    </span>
                  </td>
                  <td>
                    <Badge variant={cert.status === 'VALID' ? 'success' : 'error'}>
                      {cert.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/verify-certificate/${cert.certificate_number}`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      Verify <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ISSUE CERTIFICATE MODAL */}
      <Modal
        isOpen={issueModal}
        onClose={() => setIssueModal(false)}
        title="Issue Verified Certificate"
        maxWidth="500px"
      >
        <form onSubmit={handleIssue}>
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Academic Criteria:</strong> Certificates are issued upon curriculum completion and meeting attendance thresholds.
          </div>

          <div className="form-group">
            <label className="form-label">Student *</label>
            <select
              className="form-select"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.student_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Course Track *</label>
            <select
              className="form-select"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              required
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Grade / Academic Standing</label>
            <select
              className="form-select"
              value={form.gradeOrScore}
              onChange={(e) => setForm({ ...form, gradeOrScore: e.target.value })}
            >
              <option value="Distinction (95%)">Distinction (95%)</option>
              <option value="Merit (88%)">Merit (88%)</option>
              <option value="Pass (75%)">Pass (75%)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={() => setIssueModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue & Sign Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
