import crypto from 'crypto';
import db from '../database/db.js';
import { certificateRepository } from '../repositories/certificateRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { courseRepository } from '../repositories/courseRepository.js';
import { emailService } from './emailService.js';
import { auditService } from './auditService.js';

export const certificateService = {
  async getCertificatesForStudent(authenticatedUserId) {
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) return [];
    return await certificateRepository.findByStudent(student.id);
  },

  async getAllCertificates() {
    return await certificateRepository.findAll();
  },

  async issueCertificate({ studentId, courseId, gradeOrScore }, adminUser, req = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw { status: 404, message: 'Student not found.' };

    const course = await courseRepository.findById(courseId);
    if (!course) throw { status: 404, message: 'Course not found.' };

    const existing = await db.prepare('SELECT * FROM certificates WHERE student_id = ? AND course_id = ?').get(studentId, courseId);
    if (existing) {
      throw { status: 400, message: 'A certificate has already been issued to this student for this course.' };
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const certNumber = `CERT-${new Date().getFullYear()}-${randomNum}`;
    const id = crypto.randomUUID();

    const cert = await certificateRepository.create({
      id,
      certificateNumber: certNumber,
      studentId,
      courseId,
      issueDate: new Date().toISOString().split('T')[0],
      gradeOrScore: gradeOrScore || 'Distinction (95%)',
      metadata: {
        issuer: 'Nexus Institute of Advanced Technology',
        accreditedBy: 'Global Tech Education Board',
        hours: 120
      }
    });

    // Send email notification
    await emailService.sendCertificateIssued({
      to: student.email,
      name: student.name,
      courseTitle: course.title,
      certificateNumber: certNumber
    });

    await auditService.log({
      req,
      action: 'CERTIFICATE_ISSUED',
      resourceType: 'CERTIFICATE',
      resourceId: certNumber,
      details: { studentId: student.student_id, courseId: course.id },
      actorUser: adminUser
    });

    return cert;
  },

  async verifyCertificate(certificateNumber) {
    if (!certificateNumber) {
      throw { status: 400, message: 'Certificate identification number is required.' };
    }

    const cert = await certificateRepository.findByNumber(certificateNumber.trim());
    if (!cert) {
      throw { status: 404, message: 'No certificate matches this identifier.' };
    }

    let meta = {};
    try {
      meta = typeof cert.metadata === 'string' ? JSON.parse(cert.metadata) : cert.metadata;
    } catch {
      meta = {};
    }

    return {
      isValid: cert.status === 'VALID',
      status: cert.status,
      certificateNumber: cert.certificate_number,
      studentName: cert.student_name,
      studentCode: cert.student_code,
      courseTitle: cert.course_title,
      courseDuration: cert.course_duration,
      issueDate: cert.issue_date,
      gradeOrScore: cert.grade_or_score,
      issuer: meta.issuer || 'Nexus Institute of Advanced Technology',
      accreditedBy: meta.accreditedBy || 'Global Tech Education Board'
    };
  }
};
