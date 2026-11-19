const prisma = require('../config/prisma');

/**
 * Create Digital Prescription with Immutable Legal Branding Snapshot
 */
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      symptoms = [],
      diagnosis = [],
      vitals,
      medicines = [],
      advice = [],
      investigations = [],
      followUpDate,
      followUpNotes,
    } = req.body;

    if (!patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and at least one medicine are required.',
      });
    }

    const doctorId = req.user.id;

    // Fetch Doctor's clinic membership details for legal signature
    const membership = await prisma.clinicMembership.findFirst({
      where: {
        userId: doctorId,
        clinicId: req.clinicId,
      },
      include: {
        clinic: true,
        user: true,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Doctor is not registered in this clinic.',
      });
    }

    // Build Immutable Legal Branding Snapshot
    const brandingSnapshot = {
      clinicId: req.clinic.id,
      clinicName: req.clinic.name,
      clinicShortName: req.clinic.shortName,
      clinicTagline: req.clinic.tagline,
      clinicLogoUrl: req.clinic.logoUrl,
      clinicAddress: `${req.clinic.addressLine1}, ${req.clinic.city}, ${req.clinic.state} - ${req.clinic.pincode}`,
      clinicPhone: req.clinic.phone,
      clinicEmail: req.clinic.email,
      doctorName: membership.user.fullName,
      doctorQualifications: membership.qualifications || 'MBBS',
      doctorRegNumber: membership.regNumber || 'N/A',
      specialization: membership.specialization || 'Consultant Physician',
      stationeryMode: req.clinic.stationeryMode,
      topMarginMm: req.clinic.topMarginMm,
      bottomMarginMm: req.clinic.bottomMarginMm,
      watermarkEnabled: req.clinic.watermarkEnabled,
      generatedAt: new Date().toISOString(),
    };

    // Execute atomic transaction for Rx creation and state updates
    const prescription = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential Rx Number for this clinic
      const rxCount = await tx.prescription.count({
        where: { clinicId: req.clinicId },
      });
      const year = new Date().getFullYear();
      const rxSeq = String(rxCount + 1).padStart(4, '0');
      const rxNumber = `RX-${req.clinic.code || 'PX'}-${year}-${rxSeq}`;

      // 2. Insert Prescription
      const newRx = await tx.prescription.create({
        data: {
          clinicId: req.clinicId,
          doctorId,
          patientId,
          appointmentId: appointmentId || null,
          rxNumber,
          symptoms: Array.isArray(symptoms) ? symptoms : [],
          diagnosis: Array.isArray(diagnosis) ? diagnosis : [],
          vitals: vitals || null,
          medicines,
          advice: Array.isArray(advice) ? advice : [],
          investigations: Array.isArray(investigations) ? investigations : [],
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          followUpNotes: followUpNotes || null,
          brandingSnapshot,
        },
        include: {
          patient: true,
          doctor: { select: { id: true, fullName: true } },
        },
      });

      // 3. Mark appointment COMPLETED if linked
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      // 4. Update Patient's last visit timestamp
      await tx.patient.update({
        where: { id: patientId },
        data: { lastVisitDate: new Date() },
      });

      return newRx;
    });

    return res.status(201).json({
      success: true,
      message: `Prescription ${prescription.rxNumber} generated successfully.`,
      data: prescription,
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate digital prescription.',
      error: error.message,
    });
  }
};

/**
 * List / History of Prescriptions for Active Clinic
 */
exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      clinicId: req.clinicId,
      ...(patientId && { patientId }),
      ...(search && {
        OR: [
          { rxNumber: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search } } },
        ],
      }),
    };

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { id: true, name: true, mrn: true, phone: true, age: true, gender: true } },
          doctor: { select: { id: true, fullName: true } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions.',
      error: error.message,
    });
  }
};

/**
 * Get Specific Prescription with Full Details and Snapshot
 */
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        clinicId: req.clinicId, // Strict Tenant Guardrail
      },
      include: {
        patient: true,
        doctor: { select: { id: true, fullName: true } },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('Get prescription by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription details.',
      error: error.message,
    });
  }
};
