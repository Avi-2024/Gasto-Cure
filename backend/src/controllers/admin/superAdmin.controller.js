const bcrypt = require('bcryptjs');
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
      ownerPassword = 'Doctor@1234',
      qualifications = 'MBBS, MD',
      specialization = 'Senior Consultant Physician',
      regNumber = null,
      consultationFee = 500,
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

      // 2. Link or create Clinic Owner / Doctor if owner details provided
      let ownerUser = null;
      if (ownerEmail) {
        ownerUser = await tx.user.findUnique({
          where: { email: ownerEmail.trim().toLowerCase() },
        });

        const initialRawPassword = ownerPassword || 'Doctor@1234';
        const passwordHash = await bcrypt.hash(initialRawPassword, 10);

        if (!ownerUser) {
          ownerUser = await tx.user.create({
            data: {
              email: ownerEmail.trim().toLowerCase(),
              fullName: ownerName || `${name} Doctor`,
              phone: ownerPhone || phone,
              passwordHash,
              globalRole: 'USER',
              defaultClinicId: newClinic.id,
            },
          });
        }

        await tx.clinicMembership.upsert({
          where: {
            userId_clinicId_role: {
              userId: ownerUser.id,
              clinicId: newClinic.id,
              role: 'CLINIC_OWNER',
            },
          },
          update: {
            isActive: true,
            qualifications: qualifications || undefined,
            specialization: specialization || undefined,
            regNumber: regNumber || undefined,
            consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
          },
          create: {
            userId: ownerUser.id,
            clinicId: newClinic.id,
            role: 'CLINIC_OWNER',
            isActive: true,
            qualifications: qualifications || 'MBBS, MD',
            specialization: specialization || 'Senior Consultant Physician',
            regNumber: regNumber || null,
            consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
          },
        });
      }

      return { newClinic, ownerUser };
    });

    return res.status(201).json({
      success: true,
      message: `Clinic '${result.newClinic.name}' & Doctor '${result.ownerUser?.fullName || 'Owner'}' successfully provisioned on ClinixPulse™!`,
      clinic: result.newClinic,
      doctor: result.ownerUser
        ? {
            id: result.ownerUser.id,
            fullName: result.ownerUser.fullName,
            email: result.ownerUser.email,
            phone: result.ownerUser.phone,
            role: 'CLINIC_OWNER',
            initialPassword: ownerPassword || 'Doctor@1234',
            specialization,
            qualifications,
            loginUrl: '/login',
            publicBookingUrl: `/book/${result.newClinic.slug}`,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Register Doctor for an Existing Clinic
 */
const registerDoctorForClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const {
      fullName,
      email,
      phone,
      password = 'Doctor@1234',
      role = 'DOCTOR',
      qualifications = 'MBBS, MD',
      specialization = 'Consultant Physician',
      regNumber = null,
      consultationFee = 500,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Doctor full name and email are required.',
      });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Target clinic not found.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password || 'Doctor@1234', 10);

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: fullName.trim(),
            phone: phone ? phone.trim() : null,
            passwordHash,
            globalRole: 'USER',
            defaultClinicId: clinic.id,
          },
        });
      }

      const assignedRole = role === 'CLINIC_OWNER' ? 'CLINIC_OWNER' : 'DOCTOR';

      const membership = await tx.clinicMembership.upsert({
        where: {
          userId_clinicId_role: {
            userId: user.id,
            clinicId: clinic.id,
            role: assignedRole,
          },
        },
        update: {
          isActive: true,
          qualifications: qualifications || undefined,
          specialization: specialization || undefined,
          regNumber: regNumber || undefined,
          consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
        },
        create: {
          userId: user.id,
          clinicId: clinic.id,
          role: assignedRole,
          isActive: true,
          qualifications: qualifications || 'MBBS, MD',
          specialization: specialization || 'Consultant Physician',
          regNumber: regNumber || null,
          consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
        },
      });

      return { user, membership, clinic };
    });

    return res.status(201).json({
      success: true,
      message: `Doctor '${result.user.fullName}' successfully registered with '${result.clinic.name}'!`,
      data: {
        doctorId: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.membership.role,
        initialPassword: password || 'Doctor@1234',
        specialization: result.membership.specialization,
        qualifications: result.membership.qualifications,
        regNumber: result.membership.regNumber,
        consultationFee: result.membership.consultationFee,
        clinicName: result.clinic.name,
        clinicSlug: result.clinic.slug,
        loginUrl: '/login',
        publicBookingUrl: `/book/${result.clinic.slug}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: List Doctors for a Specific Clinic
 */
const listClinicDoctors = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const memberships = await prisma.clinicMembership.findMany({
      where: {
        clinicId,
        role: { in: ['DOCTOR', 'CLINIC_OWNER'] },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const doctors = memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      phone: m.user.phone,
      role: m.role,
      specialization: m.specialization,
      qualifications: m.qualifications,
      regNumber: m.regNumber,
      consultationFee: m.consultationFee,
      isActive: m.isActive && m.user.isActive,
    }));

    return res.status(200).json({
      success: true,
      clinicId,
      totalDoctors: doctors.length,
      doctors,
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
  registerDoctorForClinic,
  listClinicDoctors,
  getPlatformRevenueOverview,
};
