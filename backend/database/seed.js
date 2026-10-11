import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from './db.js';
import { initializeSchema } from './schema.js';

export async function seedDatabase() {
  await initializeSchema();

  const userRow = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  const userCount = userRow ? userRow.count : 0;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('[NEXUS-LMS] Seeding initial production-grade LMS dataset to Supabase PostgreSQL...');

  const now = new Date().toISOString();
  const passwordSalt = 10;

  // Helper to hash passwords
  const adminHash = bcrypt.hashSync('AdminPassword@2026', passwordSalt);
  const studentHash = bcrypt.hashSync('StudentPass@2026', passwordSalt);

  // 1. Users
  const adminId = crypto.randomUUID();
  const rahulUserId = crypto.randomUUID();
  const priyaUserId = crypto.randomUUID();
  const marcusUserId = crypto.randomUUID();
  const elenaUserId = crypto.randomUUID();

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, email_verified, last_login_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertUser.run(adminId, 'Dr. Alexander Wright', 'admin@academy.io', adminHash, 'ADMIN', 'ACTIVE', now, now, now);
  await insertUser.run(rahulUserId, 'Rahul Sharma', 'rahul@example.com', studentHash, 'STUDENT', 'ACTIVE', now, now, now);
  await insertUser.run(priyaUserId, 'Priya Patel', 'priya@example.com', studentHash, 'STUDENT', 'ACTIVE', now, now, now);
  await insertUser.run(marcusUserId, 'Marcus Vance', 'marcus@example.com', '', 'STUDENT', 'PENDING_ACTIVATION', null, now, now);
  await insertUser.run(elenaUserId, 'Elena Rostova', 'elena@example.com', studentHash, 'STUDENT', 'ACTIVE', now, now, now);

  // 2. Students
  const rahulStudentId = crypto.randomUUID();
  const priyaStudentId = crypto.randomUUID();
  const marcusStudentId = crypto.randomUUID();
  const elenaStudentId = crypto.randomUUID();

  const insertStudent = db.prepare(`
    INSERT INTO students (id, user_id, student_id, phone, profile_image, joining_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertStudent.run(rahulStudentId, rahulUserId, 'STU-2026-001', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', '2026-01-15', 'ACTIVE', now, now);
  await insertStudent.run(priyaStudentId, priyaUserId, 'STU-2026-002', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', '2026-01-10', 'ACTIVE', now, now);
  await insertStudent.run(marcusStudentId, marcusUserId, 'STU-2026-003', '+1 (555) 456-7890', '', '2026-03-01', 'PENDING_ACTIVATION', now, now);
  await insertStudent.run(elenaStudentId, elenaUserId, 'STU-2026-004', '+1 (555) 567-8901', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', '2026-02-01', 'ACTIVE', now, now);

  // Activation token for Marcus
  const rawActivationToken = 'token_marcus_activation_demo2026';
  const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex');
  const futureExpiry = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  await db.prepare(`
    INSERT INTO account_activation_tokens (id, user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `).run(crypto.randomUUID(), marcusUserId, tokenHash, futureExpiry, now);

  // Outbox email for Marcus
  await db.prepare(`
    INSERT INTO email_outbox (id, to_email, subject, template_name, html_body, status, sent_at)
    VALUES (?, ?, ?, ?, ?, 'SENT', ?)
    ON CONFLICT (id) DO NOTHING
  `).run(
    crypto.randomUUID(),
    'marcus@example.com',
    'Activate Your Nexus LMS Student Account',
    'ACCOUNT_ACTIVATION',
    `<p>Welcome Marcus! Your student account STU-2026-003 has been created. Click here to activate: <a href="http://localhost:5173/activate-account/${rawActivationToken}">Activate Account</a></p>`,
    now
  );

  // 3. Courses
  const fsdCourseId = crypto.randomUUID();
  const dsCourseId = crypto.randomUUID();
  const cloudCourseId = crypto.randomUUID();

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, slug, description, thumbnail, instructor, duration, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertCourse.run(
    fsdCourseId,
    'Full Stack Modern Web Architecture',
    'full-stack-modern-web-architecture',
    'Master production-ready React 19, TypeScript, Express, PostgreSQL, state architecture, and micro-frontend patterns.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    'Dr. Alexander Wright',
    '12 Weeks (120 Hours)',
    'PUBLISHED',
    now,
    now
  );

  await insertCourse.run(
    dsCourseId,
    'Data Science, Machine Learning & AI Engineering',
    'data-science-machine-learning-ai',
    'Comprehensive machine learning pipeline design, LLM orchestration, vector databases, and predictive modeling.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    'Prof. Sarah Jenkins',
    '14 Weeks (140 Hours)',
    'PUBLISHED',
    now,
    now
  );

  await insertCourse.run(
    cloudCourseId,
    'Cloud Computing, Kubernetes & Microservices',
    'cloud-computing-kubernetes-microservices',
    'Zero-to-production cloud native engineering with AWS, Docker containerization, Kubernetes clustering, and CI/CD.',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    'Vikram Malhotra',
    '10 Weeks (100 Hours)',
    'PUBLISHED',
    now,
    now
  );

  // 4. Modules & Lessons for FSD Course
  const fsdModules = [
    {
      id: crypto.randomUUID(),
      title: 'Module 1: Modern JavaScript & TypeScript Foundations',
      order: 1,
      lessons: [
        {
          title: 'ES2026 Advanced Features & Execution Context',
          type: 'VIDEO',
          duration: 25,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          content: 'Deep dive into asynchronous event loops, microtasks, modern memory management, and ES Modules.'
        },
        {
          title: 'TypeScript Type-Level Programming & Generics',
          type: 'TEXT',
          duration: 30,
          videoUrl: '',
          content: 'Learn conditional types, template literal types, mapped types, and crafting bulletproof generic constraints.'
        },
        {
          title: 'Clean Architecture Principles & Code Organization',
          type: 'RESOURCE',
          duration: 20,
          videoUrl: '',
          content: 'Separation of concerns, repository patterns, dependency injection, and scalable folder structures.'
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: 'Module 2: Frontend Engineering with React & Design Systems',
      order: 2,
      lessons: [
        {
          title: 'React 19 Server Components & Concurrent Mode',
          type: 'VIDEO',
          duration: 35,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          content: 'Understanding RSC serialization boundaries, useActionState, optimistic UI updates, and performance tuning.'
        },
        {
          title: 'Design Tokens, CSS Architecture & Micro-Interactions',
          type: 'TEXT',
          duration: 25,
          videoUrl: '',
          content: 'Building an enterprise-grade accessible light theme design system with CSS custom properties and 8px grid.'
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: 'Module 3: Scalable Backend Services & API Security',
      order: 3,
      lessons: [
        {
          title: 'Secure Authentication & RBAC Enforcement',
          type: 'VIDEO',
          duration: 40,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          content: 'Defense-in-depth security: HttpOnly cookies, CSRF protection, token rotation, and BOLA/IDOR prevention.'
        },
        {
          title: 'Database Indexing, Transactions & Performance Optimization',
          type: 'TEXT',
          duration: 30,
          videoUrl: '',
          content: 'B-tree indexes, composite indexes, query plan analysis, connection pooling, and ACID guarantees.'
        }
      ]
    }
  ];

  const insertModule = db.prepare(`
    INSERT INTO modules (id, course_id, title, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, module_id, course_id, title, type, content, video_url, duration_minutes, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const allFsdLessonIds = [];

  for (const m of fsdModules) {
    await insertModule.run(m.id, fsdCourseId, m.title, m.order, now, now);
    let lIdx = 1;
    for (const l of m.lessons) {
      const lessonId = crypto.randomUUID();
      allFsdLessonIds.push(lessonId);
      await insertLesson.run(lessonId, m.id, fsdCourseId, l.title, l.type, l.content, l.videoUrl, l.duration, lIdx++, now, now);
    }
  }

  // Modules for Data Science
  const dsModId = crypto.randomUUID();
  await insertModule.run(dsModId, dsCourseId, 'Module 1: Machine Learning Foundations', 1, now, now);
  const dsLesson1Id = crypto.randomUUID();
  const dsLesson2Id = crypto.randomUUID();
  await insertLesson.run(dsLesson1Id, dsModId, dsCourseId, 'Supervised vs Unsupervised Learning Paradigms', 'VIDEO', 'Core concepts of loss functions, optimization, gradient descent.', '', 30, 1, now, now);
  await insertLesson.run(dsLesson2Id, dsModId, dsCourseId, 'Data Cleaning, Imputation & Feature Engineering', 'TEXT', 'Handling high cardinality, missing values, normalizations.', '', 25, 2, now, now);

  // 5. Batches
  const fsdBatch1Id = crypto.randomUUID();
  const fsdBatch2Id = crypto.randomUUID();
  const dsBatch1Id = crypto.randomUUID();
  const cldBatch1Id = crypto.randomUUID();

  const insertBatch = db.prepare(`
    INSERT INTO batches (id, course_id, batch_code, name, start_date, end_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertBatch.run(fsdBatch1Id, fsdCourseId, 'FSD-01', 'Full Stack Development - Cohort 1', '2026-01-15', '2026-04-15', 'ACTIVE', now, now);
  await insertBatch.run(fsdBatch2Id, fsdCourseId, 'FSD-02', 'Full Stack Development - Cohort 2', '2026-05-01', '2026-08-01', 'UPCOMING', now, now);
  await insertBatch.run(dsBatch1Id, dsCourseId, 'DS-01', 'Data Science & AI - Spring Cohort', '2026-02-01', '2026-05-15', 'ACTIVE', now, now);
  await insertBatch.run(cldBatch1Id, cloudCourseId, 'CLD-01', 'Cloud & DevOps - Q1 Intensive', '2026-02-15', '2026-05-01', 'ACTIVE', now, now);

  // 6. Enrollments
  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (id, student_id, course_id, batch_id, enrolled_at, status, completion_percentage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (student_id, course_id) DO NOTHING
  `);

  // Rahul: enrolled in FSD-01 (71% completion) and DS-01 (20% completion)
  const rahulFsdEnrollmentId = crypto.randomUUID();
  await insertEnrollment.run(rahulFsdEnrollmentId, rahulStudentId, fsdCourseId, fsdBatch1Id, '2026-01-15', 'ACTIVE', 71.4, now, now);
  await insertEnrollment.run(crypto.randomUUID(), rahulStudentId, dsCourseId, dsBatch1Id, '2026-02-01', 'ACTIVE', 20.0, now, now);

  // Priya: enrolled in FSD-01 (100% completion)
  await insertEnrollment.run(crypto.randomUUID(), priyaStudentId, fsdCourseId, fsdBatch1Id, '2026-01-15', 'COMPLETED', 100.0, now, now);

  // Elena: enrolled in CLD-01 (35% completion)
  await insertEnrollment.run(crypto.randomUUID(), elenaStudentId, cloudCourseId, cldBatch1Id, '2026-02-15', 'ACTIVE', 35.0, now, now);

  // 7. Lesson Progress for Rahul (completed first 5 lessons out of 7)
  const insertProgress = db.prepare(`
    INSERT INTO lesson_progress (id, student_id, course_id, lesson_id, completed, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT (student_id, lesson_id) DO NOTHING
  `);

  for (let i = 0; i < 5; i++) {
    await insertProgress.run(crypto.randomUUID(), rahulStudentId, fsdCourseId, allFsdLessonIds[i], now, now, now);
  }

  // Priya completed all 7 lessons
  for (const lessonId of allFsdLessonIds) {
    await insertProgress.run(crypto.randomUUID(), priyaStudentId, fsdCourseId, lessonId, now, now, now);
  }

  // 8. Live Sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, title, course_id, batch_id, instructor_name, date, start_time, end_time, meeting_provider, meeting_reference, recording_reference, status, join_window_minutes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 15, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  const liveSessionId = crypto.randomUUID();
  const scheduledSessionId = crypto.randomUUID();
  const pastSessionId = crypto.randomUUID();

  // Session 1: Live Now / Joinable today for FSD-01!
  await insertSession.run(
    liveSessionId,
    'React 19 Server Components & State Architecture',
    fsdCourseId,
    fsdBatch1Id,
    'Dr. Alexander Wright',
    todayStr,
    '09:00',
    '23:59', // Active today so students can test join right away!
    'ZOOM',
    'https://zoom.us/j/98421098421?pwd=secureSessionKey2026',
    null,
    'LIVE',
    now,
    now
  );

  // Session 2: Scheduled for tomorrow
  await insertSession.run(
    scheduledSessionId,
    'Advanced PostgreSQL Indexing, Partitioning & Queries',
    fsdCourseId,
    fsdBatch1Id,
    'Dr. Alexander Wright',
    tomorrowStr,
    '16:00',
    '17:30',
    'GOOGLE_MEET',
    'https://meet.google.com/abc-defg-hij',
    null,
    'SCHEDULED',
    now,
    now
  );

  // Session 3: Completed yesterday with recording
  await insertSession.run(
    pastSessionId,
    'TypeScript 5.x Deep Dive & Enterprise Design Patterns',
    fsdCourseId,
    fsdBatch1Id,
    'Dr. Alexander Wright',
    yesterdayStr,
    '14:00',
    '15:30',
    'ZOOM',
    'https://zoom.us/j/123456789',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'COMPLETED',
    now,
    now
  );

  // 9. Session Attendance
  const insertAttendance = db.prepare(`
    INSERT INTO session_attendance (id, session_id, student_id, joined_at, left_at, duration_seconds, attendance_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (session_id, student_id) DO NOTHING
  `);

  await insertAttendance.run(
    crypto.randomUUID(),
    pastSessionId,
    rahulStudentId,
    yesterdayStr + 'T14:02:00Z',
    yesterdayStr + 'T15:28:00Z',
    5160,
    'PRESENT',
    now,
    now
  );

  await insertAttendance.run(
    crypto.randomUUID(),
    pastSessionId,
    priyaStudentId,
    yesterdayStr + 'T14:00:10Z',
    yesterdayStr + 'T15:30:00Z',
    5390,
    'PRESENT',
    now,
    now
  );

  // 10. Certificates (Priya completed course and achieved 100% attendance)
  const certId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO certificates (id, certificate_number, student_id, course_id, issue_date, status, grade_or_score, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'VALID', 'Distinction (98%)', ?, ?, ?)
    ON CONFLICT (student_id, course_id) DO NOTHING
  `).run(
    certId,
    'CERT-2026-9842',
    priyaStudentId,
    fsdCourseId,
    '2026-03-25',
    JSON.stringify({ issuer: 'Nexus Institute of Advanced Technology', accreditedBy: 'Global Tech Education Board', hours: 120 }),
    now,
    now
  );

  // 11. Platform Settings
  const insertSetting = db.prepare(`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
  `);

  await insertSetting.run('organization_name', 'Nexus Institute of Advanced Technology', now);
  await insertSetting.run('support_email', 'support@nexuslms.io', now);
  await insertSetting.run('timezone', 'America/New_York (EST)', now);
  await insertSetting.run('session_join_window_minutes', '15', now);
  await insertSetting.run('email_provider', 'simulated', now);
  await insertSetting.run('password_min_length', '8', now);
  await insertSetting.run('session_timeout_days', '7', now);

  // 12. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertNotification.run(
    crypto.randomUUID(),
    rahulUserId,
    'Live Session Today',
    'React 19 Server Components & State Architecture starts today. Join ready!',
    'INFO',
    0,
    '/student/live-classes',
    now
  );

  await insertNotification.run(
    crypto.randomUUID(),
    rahulUserId,
    'Assignment Graded',
    'Your Module 2 Practical Submission has been evaluated (Grade: A).',
    'SUCCESS',
    0,
    '/student/progress',
    now
  );

  await insertNotification.run(
    crypto.randomUUID(),
    priyaUserId,
    'Certificate Issued',
    'Congratulations! Your verified certificate for Full Stack Modern Web Architecture is ready.',
    'SUCCESS',
    0,
    '/student/certificates',
    now
  );

  // 13. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_name, role, action, resource_type, resource_id, details, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `);

  await insertAudit.run(
    crypto.randomUUID(),
    adminId,
    'Dr. Alexander Wright',
    'ADMIN',
    'SYSTEM_INITIALIZED',
    'SYSTEM',
    'SYS-INIT',
    'Initial database seed and LMS baseline configuration established.',
    '127.0.0.1',
    now
  );

  await insertAudit.run(
    crypto.randomUUID(),
    adminId,
    'Dr. Alexander Wright',
    'ADMIN',
    'STUDENT_CREATED',
    'STUDENT',
    'STU-2026-003',
    'Student Marcus Vance created with pending activation.',
    '127.0.0.1',
    now
  );

  console.log('[NEXUS-LMS] Database seeding successfully completed.');
}
