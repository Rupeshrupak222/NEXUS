import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';

export async function authenticate(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 2. Check Cookie
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.',
      code: 'UNAUTHENTICATED'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with this session no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status === 'DEACTIVATED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact academy administration.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.',
      code: 'INVALID_TOKEN'
    });
  }
}
