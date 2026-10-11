import db from '../database/db.js';

export const certificateRepository = {
  async findByNumber(certificateNumber) {
    return await db.prepare(`
      SELECT cert.*, c.title as course_title, c.duration as course_duration,
             s.student_id as student_code, u.name as student_name
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN students s ON cert.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE LOWER(cert.certificate_number) = LOWER(?)
    `).get(certificateNumber);
  },

  async findByStudent(studentId) {
    return await db.prepare(`
      SELECT cert.*, c.title as course_title, c.instructor, c.thumbnail as course_thumbnail,
             s.student_id as student_code, u.name as student_name
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN students s ON cert.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE cert.student_id = ?
      ORDER BY cert.issue_date DESC
    `).all(studentId);
  },

  async findAll() {
    return await db.prepare(`
      SELECT cert.*, c.title as course_title, s.student_id as student_code, u.name as student_name, u.email as student_email
      FROM certificates cert
      JOIN courses c ON cert.course_id = c.id
      JOIN students s ON cert.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY cert.issue_date DESC
    `).all();
  },

  async create({ id, certificateNumber, studentId, courseId, issueDate, gradeOrScore = 'Distinction', metadata = {} }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO certificates (id, certificate_number, student_id, course_id, issue_date, status, grade_or_score, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'VALID', ?, ?, ?, ?)
      ON CONFLICT (student_id, course_id) DO NOTHING
    `).run(id, certificateNumber, studentId, courseId, issueDate || now.split('T')[0], gradeOrScore, JSON.stringify(metadata), now, now);

    return await this.findByNumber(certificateNumber);
  },

  async checkEligibility(studentId, courseId) {
    const enrollment = await db.prepare(`
      SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?
    `).get(studentId, courseId);

    if (!enrollment) return { eligible: false, reason: 'Student is not enrolled in this course.' };

    const tRow = await db.prepare(`SELECT COUNT(*) as count FROM lessons WHERE course_id = ?`).get(courseId);
    const totalLessons = tRow ? tRow.count : 0;

    const cRow = await db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress WHERE student_id = ? AND course_id = ? AND completed = 1
    `).get(studentId, courseId);
    const completedLessons = cRow ? cRow.count : 0;

    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const existingCert = await db.prepare(`
      SELECT * FROM certificates WHERE student_id = ? AND course_id = ?
    `).get(studentId, courseId);

    if (existingCert) {
      return { eligible: true, alreadyIssued: true, certificate: existingCert };
    }

    if (progressPercentage < 100) {
      return {
        eligible: false,
        reason: `Course progress is ${Math.round(progressPercentage)}%. 100% curriculum completion required.`
      };
    }

    return { eligible: true, alreadyIssued: false };
  }
};
