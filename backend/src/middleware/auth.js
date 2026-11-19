const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'clinixpulse_jwt_access_super_secret_dev_key_2026';

/**
 * Authentication Middleware
 * Validates JWT access token and hydrates req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token.',
        error: jwtErr.message,
      });
    }

    // Hydrate user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub || decoded.userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { clinic: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      globalRole: user.globalRole,
      defaultClinicId: user.defaultClinicId,
      activeClinicId: decoded.clinicId || user.defaultClinicId || user.memberships[0]?.clinicId,
      memberships: user.memberships,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message,
    });
  }
}

/**
 * Restrict access to Super Admin platform owners
 */
function requireSuperAdmin(req, res, next) {
  if (req.user?.globalRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Super Admin access required.',
    });
  }
  next();
}

/**
 * Restrict access to specific clinic roles (e.g. CLINIC_OWNER, DOCTOR)
 */
function requireClinicRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.user?.globalRole === 'SUPER_ADMIN') return next();

    const currentRole = req.clinicMembership?.role;
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role in this clinic.`,
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireSuperAdmin,
  requireClinicRole,
};
