import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { emailService } from './emailService.js';
import { auditService } from './auditService.js';

export const studentService = {
  async createStudent({ name, email, phone, courseId, batchId, joiningDate }, adminUser, req = null) {
    if (!name || !email || !courseId || !batchId) {
      throw { status: 400, message: 'Name, email, course, and batch are required fields.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      throw { status: 400, message: 'A user with this email address already exists.' };
    }

    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw { status: 404, message: 'Selected course not found.' };
    }

    const batch = await courseRepository.findBatchById(batchId);
    if (!batch) {
      throw { status: 404, message: 'Selected batch not found.' };
    }

    const userId = crypto.randomUUID();
    const studentDbId = crypto.randomUUID();
    const enrollmentId = crypto.randomUUID();
    const studentId = await studentRepository.generateNextStudentId();

    // Use an unmatchable placeholder hash for pending accounts
    const placeholderHash = `PENDING_ACTIVATION_${crypto.randomBytes(32).toString('hex')}`;

    // 1. User Account
    await userRepository.create({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: placeholderHash,
      role: 'STUDENT',
      status: 'PENDING_ACTIVATION',
      emailVerified: 0
    });

    // 2. Student Profile
    await studentRepository.create({
      id: studentDbId,
      userId,
      studentId,
      phone: phone ? phone.trim() : null,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: 'PENDING_ACTIVATION'
    });

    // 3. Enrollment
    await courseRepository.createEnrollment({
      id: enrollmentId,
      studentId: studentDbId,
      courseId,
      batchId
    });

    // 4. Cryptographic Activation Token (48h expiry)
    const rawActivationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    await tokenRepository.createActivationToken({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt
    });

    // 5. Send Activation Email
    await emailService.sendAccountActivationEmail({
      to: cleanEmail,
      studentName: name,
      studentId,
      courseName: course.title,
      activationToken: rawActivationToken
    });

    // 6. Audit Log
    await auditService.log({
      req,
      action: 'STUDENT_CREATED',
      resourceType: 'STUDENT',
      resourceId: studentId,
      details: {
        name,
        email: cleanEmail,
        studentId,
        course: course.title,
        batch: batch.batch_code
      },
      actorUser: adminUser
    });

    return {
      success: true,
      message: `Student account created for ${name} (${studentId}). Activation instructions emailed.`,
      student: await studentRepository.findById(studentDbId),
      activationToken: rawActivationToken
    };
  },

  async updateStudent(id, { name, phone, profileImage, status }, adminUser, req = null) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw { status: 404, message: 'Student not found.' };
    }

    if (name) {
      await userRepository.updateProfile(student.user_id, { name: name.trim() });
    }

    if (status && ['ACTIVE', 'DEACTIVATED'].includes(status)) {
      await userRepository.updateStatus(student.user_id, status);
      await studentRepository.update(id, { status });
    }

    if (phone !== undefined || profileImage !== undefined) {
      await studentRepository.update(id, { phone, profileImage });
    }

    await auditService.log({
      req,
      action: 'STUDENT_UPDATED',
      resourceType: 'STUDENT',
      resourceId: student.student_id,
      details: { updatedFields: { name, phone, status } },
      actorUser: adminUser
    });

    return await studentRepository.findById(id);
  },

  async sendResetLink(studentDbId, adminUser, req = null) {
    const student = await studentRepository.findById(studentDbId);
    if (!student) {
      throw { status: 404, message: 'Student not found.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await tokenRepository.createResetToken({
      id: crypto.randomUUID(),
      userId: student.user_id,
      tokenHash,
      expiresAt
    });

    await emailService.sendPasswordResetEmail({
      to: student.email,
      name: student.name,
      resetToken: rawToken
    });

    await auditService.log({
      req,
      action: 'PASSWORD_RESET_DISPATCHED_BY_ADMIN',
      resourceType: 'STUDENT',
      resourceId: student.student_id,
      details: `Admin requested password reset for ${student.email}`,
      actorUser: adminUser
    });

    return {
      success: true,
      message: `Password reset email dispatched to ${student.email}.`,
      resetToken: rawToken
    };
  }
};
