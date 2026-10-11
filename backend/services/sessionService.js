import crypto from 'crypto';
import db from '../database/db.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { settingsRepository } from '../repositories/settingsRepository.js';
import { auditService } from './auditService.js';

export const sessionService = {
  async getSessions(filters = {}) {
    return await sessionRepository.findAll(filters);
  },

  async getSessionById(id) {
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw { status: 404, message: 'Session not found.' };
    }
    return session;
  },

  async createSession(data, adminUser, req = null) {
    const { title, courseId, batchId, instructorName, date, startTime, endTime, meetingProvider, meetingReference, recordingReference } = data;

    if (!title || !courseId || !batchId || !date || !startTime || !endTime) {
      throw { status: 400, message: 'Title, course, batch, date, start time, and end time are required.' };
    }

    const rawWindow = await settingsRepository.get('session_join_window_minutes');
    const windowMinutes = parseInt(rawWindow || '15', 10);
    const id = crypto.randomUUID();

    const session = await sessionRepository.create({
      id,
      title: title.trim(),
      courseId,
      batchId,
      instructorName: instructorName || 'Academic Instructor',
      date,
      startTime,
      endTime,
      meetingProvider: meetingProvider || 'ZOOM',
      meetingReference: meetingReference || 'https://zoom.us/j/demo-room-nexus',
      recordingReference,
      status: 'SCHEDULED',
      joinWindowMinutes: windowMinutes
    });

    await auditService.log({
      req,
      action: 'SESSION_CREATED',
      resourceType: 'SESSION',
      resourceId: id,
      details: { title, date, startTime },
      actorUser: adminUser
    });

    return session;
  },

  async updateSession(id, data, adminUser, req = null) {
    const existing = await sessionRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: 'Session not found.' };
    }

    const updated = await sessionRepository.update(id, data);

    await auditService.log({
      req,
      action: 'SESSION_UPDATED',
      resourceType: 'SESSION',
      resourceId: id,
      details: data,
      actorUser: adminUser
    });

    return updated;
  },

  async deleteSession(id, adminUser, req = null) {
    const existing = await sessionRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: 'Session not found.' };
    }

    await sessionRepository.delete(id);

    await auditService.log({
      req,
      action: 'SESSION_DELETED',
      resourceType: 'SESSION',
      resourceId: id,
      details: { title: existing.title },
      actorUser: adminUser
    });

    return { success: true };
  },

  /**
   * CRITICAL SECURITY WORKFLOW:
   * Student Join Authorization
   */
  async authorizeStudentJoin(sessionId, authenticatedUserId, req = null) {
    // 1. Fetch student profile corresponding to authenticated user
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) {
      await auditService.log({
        req,
        action: 'JOIN_UNAUTHORIZED',
        resourceType: 'SESSION',
        resourceId: sessionId,
        details: 'User has no student profile'
      });
      throw { status: 403, message: 'Forbidden. No student profile associated with this account.' };
    }

    if (student.status !== 'ACTIVE') {
      throw { status: 403, message: 'Account is not in active standing.' };
    }

    // 2. Fetch session
    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      throw { status: 404, message: 'Live class session not found.' };
    }

    if (session.status === 'CANCELLED') {
      throw { status: 400, message: 'This live session has been cancelled.' };
    }

    // 3. Verify student enrollment in course and batch
    const enrollment = await db.prepare(`
      SELECT * FROM enrollments
      WHERE student_id = ? AND course_id = ? AND batch_id = ?
    `).get(student.id, session.course_id, session.batch_id);

    if (!enrollment) {
      await auditService.log({
        req,
        action: 'JOIN_TAMPER_ATTEMPT',
        resourceType: 'SESSION',
        resourceId: sessionId,
        details: `Student ${student.student_id} attempted to join batch ${session.batch_id} without enrollment`,
        actorUser: { id: authenticatedUserId, name: student.name, role: 'STUDENT' }
      });
      throw { status: 403, message: 'Forbidden. You are not enrolled in the batch for this session.' };
    }

    // 4. Verify join window
    const isLive = session.status === 'LIVE';

    const [startH, startM] = session.start_time.split(':').map(Number);
    const [endH, endM] = session.end_time.split(':').map(Number);

    const sessionStart = new Date(`${session.date}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
    const sessionEnd = new Date(`${session.date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);

    const windowMinutes = session.join_window_minutes || 15;
    const windowStart = new Date(sessionStart.getTime() - windowMinutes * 60 * 1000);

    const now = new Date();

    const withinTimeWindow = now >= windowStart && now <= sessionEnd;

    if (!isLive && !withinTimeWindow) {
      if (now < windowStart) {
        const minutesUntil = Math.ceil((windowStart.getTime() - now.getTime()) / (60 * 1000));
        throw {
          status: 403,
          message: `Session join window is not open yet. Doors open ${windowMinutes} minutes before start (in ~${minutesUntil} minutes).`
        };
      } else {
        throw {
          status: 403,
          message: 'This live class has concluded. Please check the recording section.'
        };
      }
    }

    // 5. Automatically track/record attendance
    await attendanceRepository.recordJoin({
      id: crypto.randomUUID(),
      sessionId: session.id,
      studentId: student.id,
      joinedAt: now.toISOString()
    });

    await auditService.log({
      req,
      action: 'STUDENT_JOINED_SESSION',
      resourceType: 'SESSION',
      resourceId: sessionId,
      details: { studentId: student.student_id, studentName: student.name },
      actorUser: { id: authenticatedUserId, name: student.name, role: 'STUDENT' }
    });

    return {
      success: true,
      sessionTitle: session.title,
      instructor: session.instructor_name,
      meetingProvider: session.meeting_provider,
      joinUrl: session.meeting_reference,
      joinedAt: now.toISOString()
    };
  }
};
