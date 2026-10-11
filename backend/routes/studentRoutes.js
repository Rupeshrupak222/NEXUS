import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStudent } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply auth and student RBAC checks across all student endpoints
router.use(authenticate, requireStudent);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Courses & Curriculum (Enrolled only)
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseDetails);
router.post('/courses/:id/lessons/:lessonId/complete', studentController.markLessonComplete);
router.post('/courses/:id/lessons/:lessonId/uncomplete', studentController.unmarkLessonComplete);

// Live Sessions & Secure Join
router.get('/sessions', studentController.getSessions);
router.get('/sessions/:id/join', studentController.joinSession);
router.post('/sessions/:id/heartbeat', studentController.heartbeat);

// Calendar
router.get('/calendar', studentController.getCalendar);

// Progress
router.get('/progress', studentController.getProgress);

// Attendance
router.get('/attendance', studentController.getAttendance);

// Certificates
router.get('/certificates', studentController.getCertificates);

// Profile & Password
router.get('/profile', studentController.getProfile);
router.patch('/profile', studentController.updateProfile);
router.patch('/password', studentController.updatePassword);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.patch('/notifications/:id/read', studentController.markNotificationRead);
router.patch('/notifications/read-all', studentController.markAllNotificationsRead);

export default router;
