import crypto from 'crypto';
import db from '../database/db.js';
import { progressRepository } from '../repositories/progressRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { certificateRepository } from '../repositories/certificateRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { auditService } from './auditService.js';

export const progressService = {
  async markLessonComplete(lessonId, authenticatedUserId, req = null) {
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) {
      throw { status: 403, message: 'Student profile not found.' };
    }

    // Verify lesson exists and get courseId
    const lesson = await db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) {
      throw { status: 404, message: 'Lesson not found.' };
    }

    // Verify student is enrolled in this course
    const enrollment = await db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?').get(student.id, lesson.course_id);
    if (!enrollment) {
      throw { status: 403, message: 'You are not enrolled in this course.' };
    }

    const progressId = crypto.randomUUID();
    const newPercentage = await progressRepository.markLessonComplete({
      id: progressId,
      studentId: student.id,
      courseId: lesson.course_id,
      lessonId
    });

    // If reached 100%, check certificate eligibility
    if (newPercentage >= 100) {
      const eligibility = await certificateRepository.checkEligibility(student.id, lesson.course_id);
      if (eligibility.eligible && !eligibility.alreadyIssued) {
        // Auto-generate certificate
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const certNumber = `CERT-${new Date().getFullYear()}-${randomNum}`;
        const course = await db.prepare('SELECT title FROM courses WHERE id = ?').get(lesson.course_id);

        await certificateRepository.create({
          id: crypto.randomUUID(),
          certificateNumber: certNumber,
          studentId: student.id,
          courseId: lesson.course_id,
          issueDate: new Date().toISOString().split('T')[0],
          gradeOrScore: 'Distinction (95%)',
          metadata: {
            issuer: 'Nexus Institute of Advanced Technology',
            hours: 120,
            accreditation: 'Global Tech Education Board'
          }
        });

        await notificationRepository.create({
          id: crypto.randomUUID(),
          userId: authenticatedUserId,
          title: 'Certificate Awarded! 🎓',
          message: `Congratulations! You have successfully graduated from ${course ? course.title : 'the program'}. Your verified certificate is ready.`,
          type: 'SUCCESS',
          link: '/student/certificates'
        });
      }
    }

    return {
      success: true,
      lessonId,
      completionPercentage: newPercentage
    };
  },

  async unmarkLessonComplete(lessonId, authenticatedUserId) {
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) {
      throw { status: 403, message: 'Student profile not found.' };
    }

    const lesson = await db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) throw { status: 404, message: 'Lesson not found.' };

    const newPercentage = await progressRepository.unmarkLessonComplete(student.id, lesson.course_id, lessonId);

    return {
      success: true,
      lessonId,
      completionPercentage: newPercentage
    };
  },

  async getStudentProgress(authenticatedUserId) {
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) {
      throw { status: 403, message: 'Student profile not found.' };
    }

    const overall = await progressRepository.getStudentOverallProgress(student.id);

    const courses = await db.prepare(`
      SELECT c.id, c.title, c.thumbnail, e.completion_percentage, e.status, b.batch_code,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.student_id = e.student_id AND lp.course_id = c.id) as completed_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN batches b ON e.batch_id = b.id
      WHERE e.student_id = ?
    `).all(student.id);

    return {
      overall,
      courses
    };
  }
};
