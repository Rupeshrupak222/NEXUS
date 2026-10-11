import db from '../database/db.js';

export const attendanceRepository = {
  async recordJoin({ id, sessionId, studentId, joinedAt }) {
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM session_attendance WHERE session_id = ? AND student_id = ?').get(sessionId, studentId);
    if (existing) {
      await db.prepare(`UPDATE session_attendance SET updated_at = ? WHERE id = ?`).run(now, existing.id);
      return existing;
    }

    await db.prepare(`
      INSERT INTO session_attendance (id, session_id, student_id, joined_at, duration_seconds, attendance_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 3600, 'PRESENT', ?, ?)
      ON CONFLICT (session_id, student_id) DO NOTHING
    `).run(id, sessionId, studentId, joinedAt || now, now, now);

    return await db.prepare('SELECT * FROM session_attendance WHERE id = ?').get(id);
  },

  async updateHeartbeat(sessionId, studentId, durationSeconds) {
    const now = new Date().toISOString();
    const status = durationSeconds >= 1800 ? 'PRESENT' : 'PARTIAL';
    await db.prepare(`
      UPDATE session_attendance
      SET duration_seconds = ?, attendance_status = ?, updated_at = ?
      WHERE session_id = ? AND student_id = ?
    `).run(durationSeconds, status, now, sessionId, studentId);
  },

  async getBySession(sessionId) {
    return await db.prepare(`
      SELECT sa.*, s.student_id as student_code, u.name as student_name, u.email as student_email
      FROM session_attendance sa
      JOIN students s ON sa.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE sa.session_id = ?
      ORDER BY u.name ASC
    `).all(sessionId);
  },

  async getByStudent(studentId) {
    return await db.prepare(`
      SELECT sa.*, ses.title as session_title, ses.date as session_date, ses.start_time, ses.end_time,
             c.title as course_title, b.batch_code
      FROM session_attendance sa
      JOIN sessions ses ON sa.session_id = ses.id
      JOIN courses c ON ses.course_id = c.id
      JOIN batches b ON ses.batch_id = b.id
      WHERE sa.student_id = ?
      ORDER BY ses.date DESC
    `).all(studentId);
  },

  async getStudentAttendanceRate(studentId) {
    const row = await db.prepare(`
      SELECT COUNT(DISTINCT s.id) as total
      FROM sessions s
      JOIN enrollments e ON s.batch_id = e.batch_id AND s.course_id = e.course_id
      WHERE e.student_id = ? AND s.status = 'COMPLETED'
    `).get(studentId);
    const totalSessions = row ? row.total : 0;

    if (totalSessions === 0) return 100;

    const attRow = await db.prepare(`
      SELECT COUNT(DISTINCT sa.session_id) as attended
      FROM session_attendance sa
      WHERE sa.student_id = ? AND sa.attendance_status = 'PRESENT'
    `).get(studentId);
    const attendedSessions = attRow ? attRow.attended : 0;

    return Math.min(100, Math.round((attendedSessions / totalSessions) * 100));
  }
};
