import db from '../database/db.js';

export const studentRepository = {
  async findById(id) {
    return await db.prepare(`
      SELECT s.*, u.name, u.email, u.status as user_status, u.last_login_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id);
  },

  async findByUserId(userId) {
    return await db.prepare(`
      SELECT s.*, u.name, u.email, u.status as user_status, u.last_login_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `).get(userId);
  },

  async findByStudentId(studentId) {
    return await db.prepare(`
      SELECT s.*, u.name, u.email, u.status as user_status, u.last_login_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE LOWER(s.student_id) = LOWER(?)
    `).get(studentId);
  },

  async generateNextStudentId() {
    const year = new Date().getFullYear();
    const prefix = `STU-${year}-`;
    const last = await db.prepare(`
      SELECT student_id FROM students
      WHERE student_id LIKE ?
      ORDER BY student_id DESC LIMIT 1
    `).get(`${prefix}%`);

    if (!last) {
      return `${prefix}001`;
    }
    const num = parseInt(last.student_id.replace(prefix, ''), 10) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  },

  async create({ id, userId, studentId, phone, profileImage, joiningDate, status = 'ACTIVE' }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO students (id, user_id, student_id, phone, profile_image, joining_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, studentId, phone, profileImage || '', joiningDate || now.split('T')[0], status, now, now);
    return await this.findById(id);
  },

  async update(id, { phone, profileImage, status }) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE students
      SET phone = COALESCE(?, phone),
          profile_image = COALESCE(?, profile_image),
          status = COALESCE(?, status),
          updated_at = ?
      WHERE id = ?
    `).run(phone, profileImage, status, now, id);
    return await this.findById(id);
  },

  async findAll({ search = '', status = '', courseId = '', batchId = '', page = 1, limit = 25 }) {
    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(s.student_id) LIKE ?)');
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    if (courseId) {
      whereClauses.push('EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = ?)');
      params.push(courseId);
    }

    if (batchId) {
      whereClauses.push('EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.batch_id = ?)');
      params.push(batchId);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countSql = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereSql}
    `;
    const totalRow = await db.prepare(countSql).get(...params);
    const total = totalRow ? totalRow.total : 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT s.*, u.name, u.email, u.status as user_status, u.last_login_at,
        (SELECT c.title FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = s.id LIMIT 1) as course_title,
        (SELECT b.batch_code FROM enrollments e JOIN batches b ON e.batch_id = b.id WHERE e.student_id = s.id LIMIT 1) as batch_code,
        (SELECT e.completion_percentage FROM enrollments e WHERE e.student_id = s.id LIMIT 1) as completion_percentage,
        (SELECT COUNT(*) FROM session_attendance sa WHERE sa.student_id = s.id AND sa.attendance_status = 'PRESENT') as attended_sessions,
        (SELECT COUNT(*) FROM sessions ses WHERE ses.batch_id = (SELECT batch_id FROM enrollments e WHERE e.student_id = s.id LIMIT 1) AND ses.status = 'COMPLETED') as total_completed_sessions
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereSql}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const students = await db.prepare(querySql).all(...params, limit, offset);

    return {
      students: students.map(st => {
        const totalSessions = st.total_completed_sessions || 0;
        const attended = st.attended_sessions || 0;
        const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;
        return {
          ...st,
          attendanceRate
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getDetails(id) {
    const student = await this.findById(id);
    if (!student) return null;

    // Enrollments with courses and batches
    const enrollments = await db.prepare(`
      SELECT e.*, c.title as course_title, c.thumbnail as course_thumbnail, c.instructor,
             b.batch_code, b.name as batch_name, b.start_date as batch_start, b.end_date as batch_end
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN batches b ON e.batch_id = b.id
      WHERE e.student_id = ?
    `).all(id);

    // Completed lessons
    const completedLessons = await db.prepare(`
      SELECT lp.*, l.title as lesson_title, l.type as lesson_type, m.title as module_title, c.title as course_title
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON lp.course_id = c.id
      WHERE lp.student_id = ?
      ORDER BY lp.completed_at DESC
    `).all(id);

    // Attendance
    const attendance = await db.prepare(`
      SELECT sa.*, s.title as session_title, s.date as session_date, s.start_time, s.end_time, s.meeting_provider
      FROM session_attendance sa
      JOIN sessions s ON sa.session_id = s.id
      WHERE sa.student_id = ?
      ORDER BY s.date DESC
    `).all(id);

    // Certificates
    const certificates = await db.prepare(`
      SELECT cert.*, c.title as course_title
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.student_id = ?
    `).all(id);

    // Activity
    const activity = await db.prepare(`
      SELECT * FROM audit_logs
      WHERE resource_id = ? OR details LIKE ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(student.student_id, `%${student.name}%`);

    return {
      ...student,
      enrollments,
      completedLessons,
      attendance,
      certificates,
      activity
    };
  }
};
