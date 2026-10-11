export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient administrative permissions.',
        code: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireStudent = requireRole('STUDENT');
