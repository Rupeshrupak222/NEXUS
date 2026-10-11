import { authService } from '../services/authService.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { config } from '../config/index.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login(identifier, password, req);

      // Set secure HTTP-only cookie
      res.cookie('token', result.token, config.cookieConfig);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res) {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Successfully logged out.'
    });
  },

  async me(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      let student = null;
      if (user.role === 'STUDENT') {
        student = await studentRepository.findByUserId(user.id);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          student: student ? {
            id: student.id,
            studentId: student.student_id,
            phone: student.phone,
            profileImage: student.profile_image,
            joiningDate: student.joining_date
          } : null
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async activateAccount(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.activateAccount(token, newPassword, req);
      res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Helper for development / demo mail review
  async getOutbox(req, res, next) {
    try {
      const outbox = await tokenRepository.getEmailOutbox(20);
      res.json({
        success: true,
        data: outbox
      });
    } catch (err) {
      next(err);
    }
  }
};
