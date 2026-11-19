const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'clinixpulse_jwt_access_super_secret_dev_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1d';

function generateTokens(user, activeClinicId, role) {
  const payload = {
    sub: user.id,
    userId: user.id,
    email: user.email,
    globalRole: user.globalRole,
    clinicId: activeClinicId,
    clinicIds: user.memberships.map((m) => m.clinicId),
    role: role || (user.globalRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'DOCTOR'),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { accessToken };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                id: true,
                code: true,
                slug: true,
                name: true,
                shortName: true,
                tagline: true,
                logoUrl: true,
                city: true,
                state: true,
                primaryColor: true,
                accentColor: true,
                stationeryMode: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Determine initial active clinic
    const activeMembership = user.memberships.find((m) => m.clinicId === user.defaultClinicId) || user.memberships[0];
    const activeClinicId = activeMembership ? activeMembership.clinicId : null;
    const activeRole = activeMembership ? activeMembership.role : (user.globalRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER');

    const { accessToken } = generateTokens(user, activeClinicId, activeRole);

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          globalRole: user.globalRole,
          activeClinicId,
          activeRole,
          clinics: user.memberships.map((m) => ({
            clinicId: m.clinic.id,
            clinicCode: m.clinic.code,
            clinicName: m.clinic.name,
            shortName: m.clinic.shortName,
            tagline: m.clinic.tagline,
            logoUrl: m.clinic.logoUrl,
            role: m.role,
            regNumber: m.regNumber,
            qualifications: m.qualifications,
          })),
        },
        activeClinic: activeMembership ? activeMembership.clinic : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

exports.switchActiveClinic = async (req, res) => {
  try {
    const { clinicId } = req.body;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Target clinicId is required.',
      });
    }

    const membership = req.user.memberships.find((m) => m.clinicId === clinicId);
    if (!membership && req.user.globalRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this clinic.',
      });
    }

    const targetClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { memberships: true },
    });

    const { accessToken } = generateTokens(
      userRecord,
      clinicId,
      membership ? membership.role : 'SUPER_ADMIN'
    );

    return res.status(200).json({
      success: true,
      message: `Active clinic switched to ${targetClinic.name}`,
      data: {
        accessToken,
        token: accessToken,
        activeClinicId: clinicId,
        activeClinic: targetClinic,
        activeRole: membership ? membership.role : 'SUPER_ADMIN',
      },
    });
  } catch (error) {
    console.error('Switch clinic error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to switch active clinic.',
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
      clinic: req.clinic || null,
      membership: req.clinicMembership || null,
    },
  });
};
