import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { emailService } from './emailService.js';
import { auditService } from './auditService.js';

export const authService = {
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  },

  async login(identifier, password, req = null) {
    if (!identifier || !password) {
      throw { status: 400, message: 'Email or Student ID and password are required.' };
    }

    let user = null;
    const cleanId = identifier.trim();

    if (cleanId.includes('@')) {
      user = await userRepository.findByEmail(cleanId);
    } else {
      // Lookup by student ID
      const student = await studentRepository.findByStudentId(cleanId);
      if (student) {
        user = await userRepository.findById(student.user_id);
      }
    }

    // Generic error to prevent account enumeration
    const invalidCredentialsMsg = 'Invalid email/student ID or password.';

    if (!user) {
      await auditService.log({
        req,
        action: 'AUTH_FAILED',
        resourceType: 'AUTH',
        resourceId: cleanId,
        details: 'User not found'
      });
      throw { status: 401, message: invalidCredentialsMsg };
    }

    if (user.status === 'DEACTIVATED') {
      await auditService.log({
        req,
        action: 'AUTH_BLOCKED',
        resourceType: 'AUTH',
        resourceId: user.id,
        details: 'Deactivated account tried to log in',
        actorUser: user
      });
      throw { status: 403, message: 'Account is deactivated. Please contact administration.' };
    }

    if (user.status === 'PENDING_ACTIVATION') {
      throw {
        status: 403,
        message: 'Account is not yet activated. Please check your activation email or request a new activation link.'
      };
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      await auditService.log({
        req,
        action: 'AUTH_FAILED',
        resourceType: 'AUTH',
        resourceId: user.id,
        details: 'Password mismatch',
        actorUser: user
      });
      throw { status: 401, message: invalidCredentialsMsg };
    }

    await userRepository.updateLastLogin(user.id);

    const token = this.generateToken(user);

    await auditService.log({
      req,
      action: 'LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      details: `User logged in with role ${user.role}`,
      actorUser: user
    });

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      studentProfile = await studentRepository.findByUserId(user.id);
    }

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.last_login_at,
        student: studentProfile ? {
          id: studentProfile.id,
          studentId: studentProfile.student_id,
          phone: studentProfile.phone,
          profileImage: studentProfile.profile_image
        } : null
      }
    };
  },

  async activateAccount(token, newPassword, req = null) {
    if (!token || !newPassword) {
      throw { status: 400, message: 'Activation token and password are required.' };
    }

    if (newPassword.length < 8) {
      throw { status: 400, message: 'Password must be at least 8 characters long.' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const validToken = await tokenRepository.findValidActivationToken(tokenHash);

    if (!validToken) {
      throw { status: 400, message: 'Activation link is invalid, expired, or has already been used.' };
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await userRepository.updatePassword(validToken.user_id, passwordHash);
    await tokenRepository.markActivationTokenUsed(validToken.id);

    await auditService.log({
      req,
      action: 'ACCOUNT_ACTIVATED',
      resourceType: 'USER',
      resourceId: validToken.user_id,
      details: `Account activated for ${validToken.email}`
    });

    return { success: true, message: 'Account successfully activated! You may now log in.' };
  },

  async forgotPassword(email, req = null) {
    if (!email) {
      throw { status: 400, message: 'Email address is required.' };
    }

    const user = await userRepository.findByEmail(email.trim());

    // Do NOT reveal whether email exists (generic response)
    if (user && user.status !== 'DEACTIVATED') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await tokenRepository.createResetToken({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt
      });

      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken: rawToken
      });

      await auditService.log({
        req,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'USER',
        resourceId: user.id,
        details: 'Password reset link dispatched'
      });
    }

    return {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.'
    };
  },

  async resetPassword(token, newPassword, req = null) {
    if (!token || !newPassword) {
      throw { status: 400, message: 'Reset token and new password are required.' };
    }

    if (newPassword.length < 8) {
      throw { status: 400, message: 'Password must be at least 8 characters long.' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const validToken = await tokenRepository.findValidResetToken(tokenHash);

    if (!validToken) {
      throw { status: 400, message: 'Password reset link is invalid, expired, or already used.' };
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await userRepository.updatePassword(validToken.user_id, passwordHash);
    await tokenRepository.markResetTokenUsed(validToken.id);

    await auditService.log({
      req,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'USER',
      resourceId: validToken.user_id,
      details: `Password reset successfully for ${validToken.email}`
    });

    return { success: true, message: 'Your password has been successfully reset. Please log in.' };
  }
};
