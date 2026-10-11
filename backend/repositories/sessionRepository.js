import db from '../database/db.js';

export const sessionRepository = {
  async findAll({ courseId = '', batchId = '', status = '' }) {
    let whereClauses = [];
    let params = [];

    if (courseId) {
      whereClauses.push('s.course_id = ?');
      params.push(courseId);
    }
    if (batchId) {
      whereClauses.push('s.batch_id = ?');
      params.push(batchId);
    }
    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    return await db.prepare(`
      SELECT s.*, c.title as course_title, b.batch_code, b.name as batch_name,
        (SELECT COUNT(*) FROM session_attendance sa WHERE sa.session_id = s.id) as attendance_count,
        (SELECT COUNT(*) FROM enrollments e WHERE e.batch_id = s.batch_id) as total_batch_students
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      JOIN batches b ON s.batch_id = b.id
      ${whereSql}
      ORDER BY s.date DESC, s.start_time DESC
    `).all(...params);
  },

  async findById(id) {
    return await db.prepare(`
      SELECT s.*, c.title as course_title, b.batch_code, b.name as batch_name,
        (SELECT COUNT(*) FROM session_attendance sa WHERE sa.session_id = s.id) as attendance_count
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      JOIN batches b ON s.batch_id = b.id
      WHERE s.id = ?
    `).get(id);
  },

  async findSessionsForStudent(studentId) {
    return await db.prepare(`
      SELECT s.id, s.title, s.course_id, s.batch_id, s.instructor_name, s.date, s.start_time, s.end_time,
             s.meeting_provider, s.recording_reference, s.status, s.join_window_minutes,
             c.title as course_title, b.batch_code,
             sa.attendance_status, sa.joined_at, sa.duration_seconds
      FROM sessions s
      JOIN enrollments e ON s.batch_id = e.batch_id AND s.course_id = e.course_id
      JOIN courses c ON s.course_id = c.id
      JOIN batches b ON s.batch_id = b.id
      LEFT JOIN session_attendance sa ON sa.session_id = s.id AND sa.student_id = ?
      WHERE e.student_id = ?
      ORDER BY s.date ASC, s.start_time ASC
    `).all(studentId, studentId);
  },

  async create({ id, title, courseId, batchId, instructorName, date, startTime, endTime, meetingProvider = 'ZOOM', meetingReference, recordingReference, status = 'SCHEDULED', joinWindowMinutes = 15 }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO sessions (id, title, course_id, batch_id, instructor_name, date, start_time, end_time, meeting_provider, meeting_reference, recording_reference, status, join_window_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, courseId, batchId, instructorName, date, startTime, endTime, meetingProvider, meetingReference, recordingReference || null, status, joinWindowMinutes, now, now);
    return await this.findById(id);
  },

  async update(id, { title, instructorName, date, startTime, endTime, meetingProvider, meetingReference, recordingReference, status, joinWindowMinutes }) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE sessions
      SET title = COALESCE(?, title),
          instructor_name = COALESCE(?, instructor_name),
          date = COALESCE(?, date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          meeting_provider = COALESCE(?, meeting_provider),
          meeting_reference = COALESCE(?, meeting_reference),
          recording_reference = COALESCE(?, recording_reference),
          status = COALESCE(?, status),
          join_window_minutes = COALESCE(?, join_window_minutes),
          updated_at = ?
      WHERE id = ?
    `).run(title, instructorName, date, startTime, endTime, meetingProvider, meetingReference, recordingReference, status, joinWindowMinutes, now, id);
    return await this.findById(id);
  },

  async delete(id) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }
};
