const prisma = require('../../config/prisma');

/**
 * Super Admin: List All Tenant Clinics on the Platform
 */
const listClinics = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const clinics = await prisma.clinic.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            patients: true,
            appointments: true,
            prescriptions: true,
            memberships: true,
          },
        },
      },
    });

    const data = clinics.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      code: c.code,
      slug: c.slug,
      tagline: c.tagline,
      logoUrl: c.logoUrl,
      phone: c.phone,
      email: c.email,
      city: c.city,
      state: c.state,
      plan: c.plan,
      planStatus: c.planStatus,
      isActive: c.isActive,
      patientsCount: c._count.patients,
      appointmentsCount: c._count.appointments,
      prescriptionsCount: c._count.prescriptions,
      doctorsCount: c._count.memberships,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      totalClinics: data.length,
      filters: { status: status || 'all' },
      clinics: data,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Get Full Clinic Summary & Membership Details
 */
const getClinicSummary = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        _count: {
          select: {
            patients: true,
            appointments: true,
            prescriptions: true,
            invoices: true,
          },
        },
      },
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: clinic,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Toggle Clinic Active / Suspended Status
 */
const updateClinicActiveStatus = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean flag is required.',
      });
    }

    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Clinic ${isActive ? 'activated' : 'suspended'} successfully.`,
      clinic: updated,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Onboard New Clinic onto ClinixPulse Platform
 */
const onboardClinic = async (req, res, next) => {
  try {
    const {
      name,
      shortName,
      code,
      phone,
      email,
      addressLine1,
      city,
      state,
      pincode,
      plan = 'PRO',
      ownerEmail,
      ownerName,
      ownerPhone,
    } = req.body;

    if (!name || !code || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Clinic name, unique code, and phone are required.',
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Clinic
      const newClinic = await tx.clinic.create({
        data: {
          name: name.trim(),
          shortName: shortName?.trim() || name.trim(),
          code: code.trim().toUpperCase(),
          slug,
          phone: phone.trim(),
          email: email?.trim() || null,
          addressLine1: addressLine1?.trim() || 'Main Road',
          city: city?.trim() || 'Indore',
          state: state?.trim() || 'Madhya Pradesh',
          pincode: pincode?.trim() || '452001',
          plan,
          planStatus: 'ACTIVE',
        },
      });

      // 2. Link or create Clinic Owner if owner details provided
      if (ownerEmail) {
        let ownerUser = await tx.user.findUnique({
          where: { email: ownerEmail.trim().toLowerCase() },
        });

        if (!ownerUser) {
          const bcrypt = require('bcryptjs');
          const defaultPassword = await bcrypt.hash('Clinic@1234', 10);
          ownerUser = await tx.user.create({
            data: {
              email: ownerEmail.trim().toLowerCase(),
              fullName: ownerName || `${name} Admin`,
              phone: ownerPhone || phone,
              passwordHash: defaultPassword,
              globalRole: 'USER',
              defaultClinicId: newClinic.id,
            },
          });
        }

        await tx.clinicMembership.create({
          data: {
            userId: ownerUser.id,
            clinicId: newClinic.id,
            role: 'CLINIC_OWNER',
          },
        });
      }

      return newClinic;
    });

    return res.status(201).json({
      success: true,
      message: `Clinic '${result.name}' successfully onboarded to ClinixPulse™!`,
      clinic: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Platform Revenue & SaaS Overview
 */
const getPlatformRevenueOverview = async (req, res, next) => {
  try {
    const [totalClinics, activeClinics, totalPatients, totalPrescriptions] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.prescription.count(),
    ]);

    return res.status(200).json({
      success: true,
      platform: 'ClinixPulse™ Enterprise',
      metrics: {
        totalClinics,
        activeClinics,
        totalPatients,
        totalPrescriptions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listClinics,
  getClinicSummary,
  updateClinicActiveStatus,
  onboardClinic,
  getPlatformRevenueOverview,
};
