import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { sessionService } from '../services/sessionService.js';
import { attendanceService } from '../services/attendanceService.js';
import { progressService } from '../services/progressService.js';
import { certificateService } from '../services/certificateService.js';
import { notificationService } from '../services/notificationService.js';
import { auditService } from '../services/auditService.js';

export const studentController = {
  // 1. Student Dashboard
  async getDashboard(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      // Enrolled courses
      const enrolledCourses = await courseRepository.findStudentEnrollments(student.id);

      // Next live class
      const sessions = await sessionRepository.findSessionsForStudent(student.id);
      const todayStr = new Date().toISOString().split('T')[0];
      const upcomingOrLive = sessions.filter(s => s.status === 'LIVE' || (s.status === 'SCHEDULED' && s.date >= todayStr));
      const nextSession = upcomingOrLive.length > 0 ? upcomingOrLive[0] : null;

      // Overall Progress (includes per-course breakdown)
      const progress = await progressService.getStudentProgress(req.user.id);

      // Attendance (rate + full records)
      const attendance = await attendanceService.getStudentAttendance(student.id);

      // Certificates
      const certificates = await certificateService.getCertificatesForStudent(req.user.id);

      // Upcoming sessions (next 5, scheduled or live)
      const upcomingSessions = upcomingOrLive.slice(0, 5).map((s) => {
        const { meeting_reference, ...safe } = s;
        return safe;
      });

      // Lessons completed / remaining across all enrolled courses
      const totalLessons = (progress.courses || []).reduce((sum, c) => sum + (Number(c.total_lessons) || 0), 0);
      const completedLessons = (progress.courses || []).reduce((sum, c) => sum + (Number(c.completed_lessons) || 0), 0);

      // Attendance breakdown by status
      const attendanceBreakdown = (attendance.records || []).reduce(
        (acc, r) => {
          const key = (r.attendance_status || 'PRESENT').toLowerCase();
          if (key === 'present') acc.present += 1;
          else if (key === 'partial') acc.partial += 1;
          else acc.absent += 1;
          return acc;
        },
        { present: 0, partial: 0, absent: 0 }
      );

      // Course completion stats
      const completedCourses = (progress.courses || []).filter((c) => (c.completion_percentage || 0) >= 100 || c.status === 'COMPLETED').length;
      const inProgressCourses = (enrolledCourses?.length || 0) - completedCourses;

      res.json({
        success: true,
        data: {
          studentName: student.name,
          studentId: student.student_id,
          joiningDate: student.joining_date,
          enrolledCourses,
          nextSession,
          upcomingSessions,
          overallProgress: progress.overall,
          courseProgress: progress.courses,
          attendanceRate: attendance.attendanceRate,
          attendanceBreakdown,
          certificateCount: certificates.length,
          certificates,
          recentAttendance: attendance.records.slice(0, 6),
          stats: {
            totalCourses: enrolledCourses?.length || 0,
            completedCourses,
            inProgressCourses,
            totalLessons,
            completedLessons,
            remainingLessons: Math.max(0, totalLessons - completedLessons),
            totalSessions: sessions.length,
            upcomingSessionsCount: upcomingOrLive.length
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. My Courses (Enrolled only)
  async getCourses(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const courses = await courseRepository.findStudentEnrollments(student.id);
      res.json({ success: true, data: courses });
    } catch (err) {
      next(err);
    }
  },

  // 3. Course Details with curriculum & progress
  async getCourseDetails(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      // Verify student is enrolled in this course (IDOR / BOLA protection)
      const enrollment = await courseRepository.findEnrollment(student.id, req.params.id);
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: you are not enrolled in this course.',
          code: 'FORBIDDEN_ENROLLMENT'
        });
      }

      const courseWithCurriculum = await courseRepository.getCourseWithCurriculum(req.params.id);

      // Get student's completed lessons for this course
      const completedRows = await db.prepare(`
        SELECT lesson_id FROM lesson_progress
        WHERE student_id = ? AND course_id = ? AND completed = 1
      `).all(student.id, req.params.id);

      const completedLessonIds = new Set(completedRows.map(r => r.lesson_id));

      const curriculumWithProgress = {
        ...courseWithCurriculum,
        enrollment,
        modules: courseWithCurriculum.modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l => ({
            ...l,
            isCompleted: completedLessonIds.has(l.id)
          }))
        }))
      };

      res.json({ success: true, data: curriculumWithProgress });
    } catch (err) {
      next(err);
    }
  },

  // 4. Mark Lesson Complete
  async markLessonComplete(req, res, next) {
    try {
      const result = await progressService.markLessonComplete(req.params.lessonId, req.user.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async unmarkLessonComplete(req, res, next) {
    try {
      const result = await progressService.unmarkLessonComplete(req.params.lessonId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 5. Live Classes
  async getSessions(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const sessions = await sessionRepository.findSessionsForStudent(student.id);

      // Do NOT expose meeting provider url in this list for security;
      // student must call the join endpoint to verify authorization and retrieve URL!
      const sanitizedSessions = sessions.map(s => {
        const { meeting_reference, ...safeFields } = s;
        return safeFields;
      });

      res.json({ success: true, data: sanitizedSessions });
    } catch (err) {
      next(err);
    }
  },

  // 6. Secure Join Endpoint
  async joinSession(req, res, next) {
    try {
      const result = await sessionService.authorizeStudentJoin(req.params.id, req.user.id, req);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // 7. Attendance Heartbeat
  async heartbeat(req, res, next) {
    try {
      const { durationSeconds } = req.body;
      await attendanceService.handleHeartbeat(req.params.id, req.user.id, durationSeconds || 300);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // 8. Calendar
  async getCalendar(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const sessions = await sessionRepository.findSessionsForStudent(student.id);

      // Format calendar events
      const events = sessions.map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        type: 'LIVE_CLASS',
        courseTitle: s.course_title,
        status: s.status,
        instructor: s.instructor_name
      }));

      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  },

  // 9. My Progress
  async getProgress(req, res, next) {
    try {
      const progress = await progressService.getStudentProgress(req.user.id);
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  },

  // 10. Attendance
  async getAttendance(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      const data = await attendanceService.getStudentAttendance(student.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // 11. Certificates
  async getCertificates(req, res, next) {
    try {
      const certs = await certificateService.getCertificatesForStudent(req.user.id);
      res.json({ success: true, data: certs });
    } catch (err) {
      next(err);
    }
  },

  // 12. Profile
  async getProfile(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const { name, phone, profileImage } = req.body;

      if (name) {
        await userRepository.updateProfile(req.user.id, { name: name.trim() });
      }

      if (phone !== undefined || profileImage !== undefined) {
        await studentRepository.update(student.id, { phone, profileImage });
      }

      await auditService.log({
        req,
        action: 'STUDENT_PROFILE_UPDATED',
        resourceType: 'PROFILE',
        resourceId: student.student_id,
        details: { name, phone }
      });

      const updated = await studentRepository.findById(student.id);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      }

      const user = await userRepository.findById(req.user.id);
      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      await userRepository.updatePassword(user.id, newHash);

      await auditService.log({
        req,
        action: 'PASSWORD_CHANGED',
        resourceType: 'USER',
        resourceId: user.id,
        details: 'User updated password via profile settings'
      });

      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // 13. Notifications
  async getNotifications(req, res, next) {
    try {
      const data = await notificationService.getUserNotifications(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async markNotificationRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async markAllNotificationsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
