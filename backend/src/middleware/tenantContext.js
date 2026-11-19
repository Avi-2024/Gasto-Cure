const prisma = require('../config/prisma');

/**
 * Tenant Context Middleware
 * Enforces multi-tenancy by resolving and validating the active clinicId
 * from:
 * 1. Authenticated User's JWT token payload (activeClinicId)
 * 2. Explicit 'X-Clinic-Id' header (for multi-clinic users switching context)
 */
async function tenantContext(req, res, next) {
  try {
    const headerClinicId = req.header('X-Clinic-Id') || req.header('x-clinic-id');
    const userClinicId = req.user?.activeClinicId || req.user?.defaultClinicId;
    const clinicId = headerClinicId || userClinicId;

    if (!clinicId) {
      // Super Admin may access platform without a specific clinicId
      if (req.user?.globalRole === 'SUPER_ADMIN') {
        req.clinicId = null;
        req.isSuperAdmin = true;
        return next();
      }

      return res.status(400).json({
        success: false,
        message: 'Tenant context missing. Please provide a valid active clinicId or X-Clinic-Id header.',
      });
    }

    // Verify user belongs to this clinic (unless Super Admin)
    if (req.user && req.user.globalRole !== 'SUPER_ADMIN') {
      const membership = await prisma.clinicMembership.findFirst({
        where: {
          userId: req.user.id,
          clinicId: clinicId,
          isActive: true,
        },
        include: {
          clinic: true,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not an active member of this clinic tenant.',
        });
      }

      req.clinicMembership = membership;
      req.clinic = membership.clinic;
    } else {
      // Fetch clinic basic info
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
      });

      if (!clinic || !clinic.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Clinic tenant not found or inactive.',
        });
      }

      req.clinic = clinic;
    }

    req.clinicId = clinicId;
    next();
  } catch (error) {
    console.error('Tenant Context Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve clinic tenant context.',
      error: error.message,
    });
  }
}

module.exports = tenantContext;
