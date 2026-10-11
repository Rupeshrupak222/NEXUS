import db from '../database/db.js';

export const courseRepository = {
  async findAll(includeDrafts = true) {
    const sql = includeDrafts
      ? `SELECT c.*,
          (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count,
          (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count,
          (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id) as batch_count
         FROM courses c
         ORDER BY c.created_at DESC`
      : `SELECT c.*,
          (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count,
          (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count
         FROM courses c
         WHERE c.status = 'PUBLISHED'
         ORDER BY c.created_at DESC`;
    return await db.prepare(sql).all();
  },

  async findById(id) {
    return await db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  },

  async findBySlug(slug) {
    return await db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug);
  },

  async getCourseWithCurriculum(id) {
    const course = await this.findById(id);
    if (!course) return null;

    const modules = await db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC
    `).all(id);

    const lessons = await db.prepare(`
      SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC
    `).all(id);

    const batches = await db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.batch_id = b.id) as student_count
      FROM batches b
      WHERE b.course_id = ?
      ORDER BY b.created_at DESC
    `).all(id);

    const modulesWithLessons = modules.map(m => ({
      ...m,
      lessons: lessons.filter(l => l.module_id === m.id)
    }));

    return {
      ...course,
      modules: modulesWithLessons,
      batches
    };
  },

  async create({ id, title, slug, description, thumbnail, category, instructor, duration, status = 'PUBLISHED' }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO courses (id, title, slug, description, thumbnail, category, instructor, duration, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, slug, description, thumbnail, category, instructor, duration, status, now, now);
    return await this.findById(id);
  },

  async update(id, { title, description, thumbnail, category, instructor, duration, status }) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          thumbnail = COALESCE(?, thumbnail),
          category = COALESCE(?, category),
          instructor = COALESCE(?, instructor),
          duration = COALESCE(?, duration),
          status = COALESCE(?, status),
          updated_at = ?
      WHERE id = ?
    `).run(title, description, thumbnail, category, instructor, duration, status, now, id);
    return await this.findById(id);
  },

  async delete(id) {
    const res = await db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    return res;
  },

  async deleteModule(moduleId) {
    return await db.prepare('DELETE FROM modules WHERE id = ?').run(moduleId);
  },

  async deleteLesson(lessonId) {
    return await db.prepare('DELETE FROM lessons WHERE id = ?').run(lessonId);
  },

  // Distinct categories across courses (for filter dropdown)
  async findCategories() {
    const rows = await db.prepare(`
      SELECT DISTINCT category FROM courses
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category ASC
    `).all();
    return rows.map((r) => r.category);
  },

  // Modules
  async createModule({ id, courseId, title, orderIndex = 0 }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO modules (id, course_id, title, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, courseId, title, orderIndex, now, now);
    return await db.prepare('SELECT * FROM modules WHERE id = ?').get(id);
  },

  // Lessons
  async createLesson({ id, moduleId, courseId, title, type = 'VIDEO', content, videoUrl, durationMinutes = 15, orderIndex = 0 }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO lessons (id, module_id, course_id, title, type, content, video_url, duration_minutes, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, moduleId, courseId, title, type, content, videoUrl, durationMinutes, orderIndex, now, now);
    return await db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
  },

  // Batches
  async createBatch({ id, courseId, batchCode, name, startDate, endDate, status = 'ACTIVE' }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO batches (id, course_id, batch_code, name, start_date, end_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, courseId, batchCode, name, startDate, endDate, status, now, now);
    return await db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  },

  async findBatchesByCourse(courseId) {
    return await db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM enrollments e WHERE e.batch_id = b.id) as student_count
      FROM batches b WHERE b.course_id = ? ORDER BY b.created_at DESC
    `).all(courseId);
  },

  async findAllBatches() {
    return await db.prepare(`
      SELECT b.*, c.title as course_title,
             (SELECT COUNT(*) FROM enrollments e WHERE e.batch_id = b.id) as student_count
      FROM batches b
      JOIN courses c ON b.course_id = c.id
      ORDER BY b.created_at DESC
    `).all();
  },

  async findBatchById(batchId) {
    return await db.prepare('SELECT * FROM batches WHERE id = ?').get(batchId);
  },

  // Enrolled students for a course (for the admin course detail cohort tab)
  async findEnrolledStudents(courseId) {
    return await db.prepare(`
      SELECT e.id as enrollment_id, e.status as enrollment_status, e.completion_percentage, e.enrolled_at,
             s.id as student_id, s.student_id as student_code, s.phone, s.profile_image,
             u.name, u.email, u.status as user_status,
             b.batch_code, b.name as batch_name
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN batches b ON e.batch_id = b.id
      WHERE e.course_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(courseId);
  },

  // Enrollments
  async createEnrollment({ id, studentId, courseId, batchId }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO enrollments (id, student_id, course_id, batch_id, enrolled_at, status, completion_percentage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0, ?, ?)
      ON CONFLICT (student_id, course_id) DO UPDATE SET batch_id = EXCLUDED.batch_id, updated_at = EXCLUDED.updated_at
    `).run(id, studentId, courseId, batchId, now, now, now);
    return await db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?').get(studentId, courseId);
  },

  async findEnrollment(studentId, courseId) {
    return await db.prepare(`
      SELECT e.*, c.title as course_title, b.batch_code
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN batches b ON e.batch_id = b.id
      WHERE e.student_id = ? AND e.course_id = ?
    `).get(studentId, courseId);
  },

  async findStudentEnrollments(studentId) {
    return await db.prepare(`
      SELECT e.*, c.title as course_title, c.description, c.thumbnail, c.instructor, c.duration,
             b.batch_code, b.name as batch_name,
             (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
             (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.student_id = e.student_id AND lp.course_id = c.id) as completed_lessons,
             (SELECT l.title FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id WHERE lp.student_id = e.student_id AND lp.course_id = c.id ORDER BY lp.completed_at DESC LIMIT 1) as last_completed_lesson_title
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN batches b ON e.batch_id = b.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(studentId);
  },

  async updateEnrollmentPercentage(studentId, courseId, percentage, status = 'ACTIVE') {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE enrollments
      SET completion_percentage = ?, status = ?, updated_at = ?
      WHERE student_id = ? AND course_id = ?
    `).run(percentage, status, now, studentId, courseId);
  }
};
