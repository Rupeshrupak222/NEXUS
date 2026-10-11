import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply auth and admin RBAC checks across all admin endpoints
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Students
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.get('/students/:id', adminController.getStudentDetails);
router.patch('/students/:id', adminController.updateStudent);
router.post('/students/:id/send-reset-link', adminController.sendStudentResetLink);

// Courses
router.get('/courses', adminController.getCourses);
router.get('/courses/categories', adminController.getCourseCategories);
router.post('/courses', adminController.createCourse);
router.get('/courses/:id', adminController.getCourseDetails);
router.patch('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.post('/courses/:id/modules', adminController.addModule);
router.delete('/courses/:id/modules/:moduleId', adminController.deleteModule);
router.post('/courses/:id/modules/:moduleId/lessons', adminController.addLesson);
router.delete('/courses/:id/lessons/:lessonId', adminController.deleteLesson);

// Batches
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);

// Sessions
router.get('/sessions', adminController.getSessions);
router.post('/sessions', adminController.createSession);
router.patch('/sessions/:id', adminController.updateSession);
router.delete('/sessions/:id', adminController.deleteSession);
router.get('/sessions/:id/attendance', adminController.getSessionAttendance);

// Certificates
router.get('/certificates', adminController.getCertificates);
router.post('/certificates/issue', adminController.issueCertificate);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Settings
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

export default router;
