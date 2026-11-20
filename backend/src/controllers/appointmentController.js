const prisma = require('../config/prisma');

/**
 * Public: Get Clinic Public Booking Profile by Slug
 */
exports.getPublicClinicInfo = async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.toLowerCase().replace(/[\s_-]+/g, '');

    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        slug: true,
        name: true,
        shortName: true,
        tagline: true,
        logoUrl: true,
        phone: true,
        email: true,
        whatsappNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        memberships: {
          where: { role: { in: ['DOCTOR', 'CLINIC_OWNER'] }, isActive: true },
          select: {
            id: true,
            regNumber: true,
            qualifications: true,
            specialization: true,
            consultationFee: true,
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    const clinic = clinics.find(
      (c) =>
        c.slug.toLowerCase() === slug.toLowerCase() ||
        c.slug.toLowerCase().replace(/[\s_-]+/g, '') === cleanSlug ||
        c.code.toLowerCase() === cleanSlug ||
        c.code.toLowerCase() === slug.toLowerCase()
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: `Clinic profile not found for "${slug}".`,
      });
    }

    const doctors = clinic.memberships.map((m) => ({
      doctorId: m.user.id,
      name: m.user.fullName,
      specialization: m.specialization || 'Consultant Physician',
      qualifications: m.qualifications || 'MBBS',
      regNumber: m.regNumber,
      consultationFee: m.consultationFee || 500,
    }));

    return res.status(200).json({
      success: true,
      data: {
        clinic: {
          id: clinic.id,
          code: clinic.code,
          slug: clinic.slug,
          name: clinic.name,
          shortName: clinic.shortName,
          tagline: clinic.tagline,
          logoUrl: clinic.logoUrl,
          phone: clinic.phone,
          email: clinic.email,
          whatsappNumber: clinic.whatsappNumber,
          address: `${clinic.addressLine1}, ${clinic.city}, ${clinic.state} - ${clinic.pincode}`,
        },
        doctors,
      },
    });
  } catch (error) {
    console.error('Get public clinic info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clinic booking profile.',
      error: error.message,
    });
  }
};

/**
 * Public: Book Online Appointment (Direct from public /book/:slug URL)
 */
exports.publicBookAppointment = async (req, res) => {
  try {
    const {
      clinicSlug,
      patientName,
      patientPhone,
      patientAge,
      patientGender = 'OTHER',
      doctorId,
      appointmentDate,
      timeSlot = 'Morning OPD (10:00 AM - 01:00 PM)',
      reason = 'Online Scheduled Outpatient Visit',
    } = req.body;

    if (!clinicSlug || !patientName || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Clinic slug, patient name, and mobile number are required.',
      });
    }

    const cleanSlug = clinicSlug.toLowerCase().replace(/[\s_-]+/g, '');

    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
    });

    const clinic = clinics.find(
      (c) =>
        c.slug.toLowerCase() === clinicSlug.toLowerCase() ||
        c.slug.toLowerCase().replace(/[\s_-]+/g, '') === cleanSlug ||
        c.code.toLowerCase() === cleanSlug ||
        c.code.toLowerCase() === clinicSlug.toLowerCase()
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found.',
      });
    }

    const targetDate = appointmentDate ? new Date(appointmentDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Resolve or Create Patient Record
      let patient = await tx.patient.findFirst({
        where: {
          clinicId: clinic.id,
          phone: patientPhone.trim(),
        },
      });

      if (!patient) {
        const pCount = await tx.patient.count({ where: { clinicId: clinic.id } });
        const year = new Date().getFullYear();
        const seq = String(pCount + 1).padStart(4, '0');
        const mrn = `${clinic.code}-${year}-${seq}`;

        patient = await tx.patient.create({
          data: {
            clinicId: clinic.id,
            mrn,
            name: patientName.trim(),
            phone: patientPhone.trim(),
            age: patientAge ? parseInt(patientAge, 10) : null,
            gender: ['MALE', 'FEMALE', 'OTHER'].includes(patientGender.toUpperCase())
              ? patientGender.toUpperCase()
              : 'OTHER',
            lastVisitDate: targetDate,
          },
        });
      }

      // 2. Resolve Doctor
      let assignedDoctorId = doctorId;
      if (!assignedDoctorId) {
        const firstDoc = await tx.clinicMembership.findFirst({
          where: { clinicId: clinic.id, role: { in: ['DOCTOR', 'CLINIC_OWNER'] }, isActive: true },
        });
        assignedDoctorId = firstDoc?.userId;
      }

      if (!assignedDoctorId) {
        // Fallback to any user member
        const anyMember = await tx.clinicMembership.findFirst({
          where: { clinicId: clinic.id },
        });
        assignedDoctorId = anyMember?.userId;
      }

      // 3. Allocate Sequential Daily Token
      const highestToken = await tx.appointment.findFirst({
        where: {
          clinicId: clinic.id,
          appointmentDate: targetDate,
        },
        orderBy: { tokenNumber: 'desc' },
        select: { tokenNumber: true },
      });

      const nextToken = (highestToken?.tokenNumber || 0) + 1;

      // 4. Create Confirmed Appointment
      const appointment = await tx.appointment.create({
        data: {
          clinicId: clinic.id,
          doctorId: assignedDoctorId,
          patientId: patient.id,
          tokenNumber: nextToken,
          appointmentDate: targetDate,
          status: 'WAITING',
          visitType: 'NEW_VISIT',
          chiefComplaint: `${reason} (${timeSlot})`,
        },
        include: {
          doctor: { select: { fullName: true } },
        },
      });

      return {
        appointment,
        patient,
        clinic,
        tokenFormatted: `Token #${nextToken}`,
      };
    });

    return res.status(201).json({
      success: true,
      message: `Appointment confirmed with Token #${bookingResult.appointment.tokenNumber}!`,
      data: {
        tokenNumber: bookingResult.appointment.tokenNumber,
        tokenFormatted: bookingResult.tokenFormatted,
        appointmentId: bookingResult.appointment.id,
        appointmentDate: targetDate.toISOString().split('T')[0],
        timeSlot,
        patient: {
          id: bookingResult.patient.id,
          name: bookingResult.patient.name,
          phone: bookingResult.patient.phone,
          mrn: bookingResult.patient.mrn,
        },
        doctorName: bookingResult.appointment.doctor?.fullName || 'Consultant Physician',
        clinic: {
          name: bookingResult.clinic.name,
          phone: bookingResult.clinic.phone,
          address: `${bookingResult.clinic.addressLine1}, ${bookingResult.clinic.city}`,
        },
      },
    });
  } catch (error) {
    console.error('Public book appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete online booking.',
      error: error.message,
    });
  }
};

/**
 * Get OPD Queue for Active Clinic (Tenant-Scoped)
 */
exports.getTodayQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { status, date } = req.query;
    const targetDate = date ? new Date(date) : today;
    targetDate.setHours(0, 0, 0, 0);

    let statusFilter = undefined;
    if (!status || status === 'waiting') {
      statusFilter = { in: ['WAITING', 'IN_CONSULTATION'] };
    } else if (status === 'all') {
      statusFilter = undefined;
    } else {
      statusFilter = status.toUpperCase();
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: req.clinicId,
        appointmentDate: targetDate,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        patient: true,
        doctor: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalInQueue: appointments.length,
        appointments: appointments.map((a) => ({
          id: a.id,
          tokenNumber: a.tokenNumber,
          tokenFormatted: `Token #${a.tokenNumber}`,
          patientId: a.patientId,
          patientName: a.patient?.name || 'Walk-in Patient',
          patientPhone: a.patient?.phone || '',
          patientAge: a.patient?.age,
          patientGender: a.patient?.gender,
          patientMrn: a.patient?.mrn,
          doctorName: a.doctor?.fullName || 'Assigned Doctor',
          reason: a.chiefComplaint || 'Consultation & Review',
          status: a.status.toLowerCase(),
          rawStatus: a.status,
          createdAt: a.createdAt.toISOString(),
          appointmentDate: a.appointmentDate.toISOString().split('T')[0],
          startTime: a.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        })),
      },
    });
  } catch (error) {
    console.error('Get today queue error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OPD queue.',
      error: error.message,
    });
  }
};

/**
 * Book / Walk-in Appointment with Atomic Daily Token Sequence (Staff/Doctor Portal)
 */
exports.createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone,
      patientAge,
      patientGender = 'OTHER',
      doctorId,
      appointmentDate,
      chiefComplaint,
      vitals,
      visitType = 'NEW_VISIT',
    } = req.body;

    const assignedDoctorId = doctorId || req.user.id;
    const targetDate = appointmentDate ? new Date(appointmentDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve Patient
      let resolvedPatient = null;

      if (patientId) {
        try {
          resolvedPatient = await tx.patient.findFirst({
            where: { id: patientId, clinicId: req.clinicId },
          });
        } catch {
          // search by phone or mrn
          resolvedPatient = await tx.patient.findFirst({
            where: {
              clinicId: req.clinicId,
              OR: [{ mrn: patientId }, { phone: patientPhone || patientId }],
            },
          });
        }
      }

      if (!resolvedPatient && (patientPhone || patientName)) {
        resolvedPatient = await tx.patient.findFirst({
          where: {
            clinicId: req.clinicId,
            ...(patientPhone && { phone: patientPhone }),
            ...(patientName && !patientPhone && { name: patientName }),
          },
        });
      }

      if (!resolvedPatient) {
        const pCount = await tx.patient.count({ where: { clinicId: req.clinicId } });
        const clinic = await tx.clinic.findUnique({
          where: { id: req.clinicId },
          select: { code: true },
        });
        const year = new Date().getFullYear();
        const seq = String(pCount + 1).padStart(4, '0');
        const mrn = `${clinic?.code || 'PX'}-${year}-${seq}`;

        resolvedPatient = await tx.patient.create({
          data: {
            clinicId: req.clinicId,
            mrn,
            name: (patientName || 'Walk-in Patient').trim(),
            phone: (patientPhone || '9876543210').trim(),
            age: patientAge ? parseInt(patientAge, 10) : null,
            gender: ['MALE', 'FEMALE', 'OTHER'].includes(patientGender?.toUpperCase())
              ? patientGender.toUpperCase()
              : 'OTHER',
            lastVisitDate: targetDate,
          },
        });
      }

      // 2. Count highest token allocated for target date in clinic
      const highest = await tx.appointment.findFirst({
        where: {
          clinicId: req.clinicId,
          appointmentDate: targetDate,
        },
        orderBy: { tokenNumber: 'desc' },
        select: { tokenNumber: true },
      });

      const nextToken = (highest?.tokenNumber || 0) + 1;

      // 3. Create Appointment
      const appointment = await tx.appointment.create({
        data: {
          clinicId: req.clinicId,
          doctorId: assignedDoctorId,
          patientId: resolvedPatient.id,
          tokenNumber: nextToken,
          appointmentDate: targetDate,
          status: 'WAITING',
          visitType,
          chiefComplaint: chiefComplaint || 'Outpatient Consultation',
          vitals: vitals || null,
        },
        include: {
          patient: true,
          doctor: { select: { fullName: true } },
        },
      });

      return { appointment, patient: resolvedPatient };
    });

    return res.status(201).json({
      success: true,
      message: `Appointment created with Token #${result.appointment.tokenNumber}`,
      data: {
        id: result.appointment.id,
        tokenNumber: result.appointment.tokenNumber,
        tokenFormatted: `Token #${result.appointment.tokenNumber}`,
        patientId: result.patient.id,
        patientName: result.patient.name,
        patientPhone: result.patient.phone,
        patientAge: result.patient.age,
        patientGender: result.patient.gender,
        patientMrn: result.patient.mrn,
        doctorName: result.appointment.doctor?.fullName || 'Assigned Doctor',
        reason: result.appointment.chiefComplaint,
        status: result.appointment.status.toLowerCase(),
        rawStatus: result.appointment.status,
        appointmentDate: result.appointment.appointmentDate.toISOString().split('T')[0],
        createdAt: result.appointment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create appointment.',
      error: error.message,
    });
  }
};

/**
 * Update Appointment Status (e.g. IN_CONSULTATION, COMPLETED, CANCELLED)
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const normalizedStatus = status?.toUpperCase();
    const validStatuses = ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of [${validStatuses.join(', ')}]`,
      });
    }

    const updated = await prisma.appointment.update({
      where: {
        id,
        clinicId: req.clinicId, // Strict Tenant Guardrail
      },
      data: { status: normalizedStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${normalizedStatus}`,
      data: {
        id: updated.id,
        status: updated.status.toLowerCase(),
        rawStatus: updated.status,
      },
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment status.',
      error: error.message,
    });
  }
};
