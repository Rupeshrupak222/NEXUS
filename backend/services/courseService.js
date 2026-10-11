import crypto from 'crypto';
import { courseRepository } from '../repositories/courseRepository.js';
import { auditService } from './auditService.js';

export const courseService = {
  async getCourses(includeDrafts = true) {
    return await courseRepository.findAll(includeDrafts);
  },

  async getCategories() {
    return await courseRepository.findCategories();
  },

  async getCourseDetails(id) {
    const course = await courseRepository.getCourseWithCurriculum(id);
    if (!course) {
      throw { status: 404, message: 'Course not found.' };
    }
    const enrolledStudents = await courseRepository.findEnrolledStudents(id);
    return { ...course, enrolledStudents };
  },

  async createCourse(data, adminUser, req = null) {
    const { title, description, thumbnail, category, instructor, duration, status = 'PUBLISHED' } = data;
    if (!title) {
      throw { status: 400, message: 'Course title is required.' };
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const id = crypto.randomUUID();

    const course = await courseRepository.create({
      id,
      title: title.trim(),
      slug,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      category: category || 'General',
      instructor: instructor || 'Academic Faculty',
      duration: duration || '8 Weeks',
      status
    });

    await auditService.log({
      req,
      action: 'COURSE_CREATED',
      resourceType: 'COURSE',
      resourceId: id,
      details: { title },
      actorUser: adminUser
    });

    return course;
  },

  async updateCourse(id, data, adminUser, req = null) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: 'Course not found.' };
    }

    const updated = await courseRepository.update(id, data);

    await auditService.log({
      req,
      action: 'COURSE_UPDATED',
      resourceType: 'COURSE',
      resourceId: id,
      details: data,
      actorUser: adminUser
    });

    return updated;
  },

  async deleteCourse(id, adminUser, req = null) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: 'Course not found.' };
    }

    await courseRepository.delete(id);

    await auditService.log({
      req,
      action: 'COURSE_DELETED',
      resourceType: 'COURSE',
      resourceId: id,
      details: { title: existing.title },
      actorUser: adminUser
    });

    return { success: true, message: 'Course deleted successfully.' };
  },

  async deleteModule(courseId, moduleId, adminUser, req = null) {
    await courseRepository.deleteModule(moduleId);
    await auditService.log({
      req,
      action: 'MODULE_DELETED',
      resourceType: 'MODULE',
      resourceId: moduleId,
      details: { courseId },
      actorUser: adminUser
    });
    return { success: true, message: 'Section deleted.' };
  },

  async deleteLesson(courseId, lessonId, adminUser, req = null) {
    await courseRepository.deleteLesson(lessonId);
    await auditService.log({
      req,
      action: 'LESSON_DELETED',
      resourceType: 'LESSON',
      resourceId: lessonId,
      details: { courseId },
      actorUser: adminUser
    });
    return { success: true, message: 'Lesson deleted.' };
  },

  async addModule(courseId, { title, orderIndex }, adminUser, req = null) {
    if (!title) throw { status: 400, message: 'Module title is required.' };
    const id = crypto.randomUUID();
    return await courseRepository.createModule({ id, courseId, title, orderIndex });
  },

  async addLesson(courseId, moduleId, lessonData, adminUser, req = null) {
    const { title, type, content, videoUrl, durationMinutes, orderIndex } = lessonData;
    if (!title) throw { status: 400, message: 'Lesson title is required.' };

    const id = crypto.randomUUID();
    return await courseRepository.createLesson({
      id,
      moduleId,
      courseId,
      title,
      type: type || 'VIDEO',
      content: content || '',
      videoUrl: videoUrl || '',
      durationMinutes: durationMinutes || 15,
      orderIndex: orderIndex || 0
    });
  },

  // Batches
  async createBatch({ courseId, batchCode, name, startDate, endDate }, adminUser, req = null) {
    if (!courseId || !batchCode || !name) {
      throw { status: 400, message: 'Course, batch code, and name are required.' };
    }

    const id = crypto.randomUUID();
    const batch = await courseRepository.createBatch({
      id,
      courseId,
      batchCode: batchCode.trim().toUpperCase(),
      name: name.trim(),
      startDate,
      endDate,
      status: 'ACTIVE'
    });

    await auditService.log({
      req,
      action: 'BATCH_CREATED',
      resourceType: 'BATCH',
      resourceId: id,
      details: { batchCode, courseId },
      actorUser: adminUser
    });

    return batch;
  },

  async getBatches(courseId = null) {
    if (courseId) {
      return await courseRepository.findBatchesByCourse(courseId);
    }
    return await courseRepository.findAllBatches();
  },

  // Enrollments
  async enrollStudent(studentId, courseId, batchId, adminUser = null, req = null) {
    const id = crypto.randomUUID();
    const enrollment = await courseRepository.createEnrollment({ id, studentId, courseId, batchId });

    await auditService.log({
      req,
      action: 'STUDENT_ENROLLED',
      resourceType: 'ENROLLMENT',
      resourceId: id,
      details: { studentId, courseId, batchId },
      actorUser: adminUser
    });

    return enrollment;
  }
};
