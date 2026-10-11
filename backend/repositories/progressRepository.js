import db from '../database/db.js';

export const progressRepository = {
  async markLessonComplete({ id, studentId, courseId, lessonId }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO lesson_progress (id, student_id, course_id, lesson_id, completed, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT (student_id, lesson_id) DO UPDATE SET completed = 1, completed_at = EXCLUDED.completed_at, updated_at = EXCLUDED.updated_at
    `).run(id, studentId, courseId, lessonId, now, now, now);

    // Recalculate course completion percentage
    return await this.recalculateCourseProgress(studentId, courseId);
  },

  async unmarkLessonComplete(studentId, courseId, lessonId) {
    await db.prepare(`
      DELETE FROM lesson_progress WHERE student_id = ? AND lesson_id = ?
    `).run(studentId, lessonId);

    return await this.recalculateCourseProgress(studentId, courseId);
  },

  async recalculateCourseProgress(studentId, courseId) {
    const totalRow = await db.prepare(`SELECT COUNT(*) as count FROM lessons WHERE course_id = ?`).get(courseId);
    const totalLessons = totalRow ? totalRow.count : 0;
    if (totalLessons === 0) return 0;

    const compRow = await db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress
      WHERE student_id = ? AND course_id = ? AND completed = 1
    `).get(studentId, courseId);
    const completedLessons = compRow ? compRow.count : 0;

    const percentage = Math.min(100, Math.round((completedLessons / totalLessons) * 100 * 10) / 10);
    const status = percentage >= 100 ? 'COMPLETED' : 'ACTIVE';

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE enrollments
      SET completion_percentage = ?, status = ?, updated_at = ?
      WHERE student_id = ? AND course_id = ?
    `).run(percentage, status, now, studentId, courseId);

    return percentage;
  },

  async getStudentCourseProgress(studentId, courseId) {
    const compRows = await db.prepare(`
      SELECT lesson_id FROM lesson_progress
      WHERE student_id = ? AND course_id = ? AND completed = 1
    `).all(studentId, courseId);
    const completedLessonIds = compRows.map(r => r.lesson_id);

    const enrollment = await db.prepare(`
      SELECT completion_percentage, status FROM enrollments
      WHERE student_id = ? AND course_id = ?
    `).get(studentId, courseId);

    return {
      completionPercentage: enrollment ? enrollment.completion_percentage : 0,
      status: enrollment ? enrollment.status : 'NOT_ENROLLED',
      completedLessonIds
    };
  },

  async getStudentOverallProgress(studentId) {
    const enrRow = await db.prepare(`
      SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?
    `).get(studentId);
    const totalEnrolled = enrRow ? enrRow.count : 0;

    if (totalEnrolled === 0) return { overallPercentage: 0, completedCourses: 0, totalEnrolled: 0 };

    const avg = await db.prepare(`
      SELECT AVG(completion_percentage) as avg_p,
             COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_c
      FROM enrollments WHERE student_id = ?
    `).get(studentId);

    const lRow = await db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress WHERE student_id = ?
    `).get(studentId);
    const totalLessonsCompleted = lRow ? lRow.count : 0;

    return {
      overallPercentage: Math.round(avg?.avg_p || 0),
      completedCourses: avg?.completed_c || 0,
      totalEnrolled,
      totalLessonsCompleted
    };
  }
};
