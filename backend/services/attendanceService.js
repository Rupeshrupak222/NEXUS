import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';

export const attendanceService = {
  async getSessionAttendance(sessionId) {
    return await attendanceRepository.getBySession(sessionId);
  },

  async getStudentAttendance(studentDbId) {
    const records = await attendanceRepository.getByStudent(studentDbId);
    const attendanceRate = await attendanceRepository.getStudentAttendanceRate(studentDbId);
    return {
      attendanceRate,
      records
    };
  },

  async handleHeartbeat(sessionId, authenticatedUserId, durationSeconds) {
    const student = await studentRepository.findByUserId(authenticatedUserId);
    if (!student) return;
    await attendanceRepository.updateHeartbeat(sessionId, student.id, durationSeconds);
  }
};
