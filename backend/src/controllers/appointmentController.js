const prisma = require('../config/prisma');

/**
 * Get OPD Queue for Active Clinic
 */
exports.getTodayQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: req.clinicId,
        appointmentDate: today,
        status: { in: ['WAITING', 'IN_CONSULTATION'] },
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
        appointments,
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
 * Book / Walk-in Appointment with Atomic Daily Token Sequence
 */
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, chiefComplaint, vitals, visitType = 'NEW_VISIT' } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required.',
      });
    }

    const assignedDoctorId = doctorId || req.user.id;
    const appointmentDate = new Date();
    appointmentDate.setHours(0, 0, 0, 0);

    // Atomic transaction for Daily Token Number allocation
    const appointment = await prisma.$transaction(async (tx) => {
      // Find highest token allocated today in this clinic
      const highest = await tx.appointment.findFirst({
        where: {
          clinicId: req.clinicId,
          appointmentDate,
        },
        orderBy: { tokenNumber: 'desc' },
        select: { tokenNumber: true },
      });

      const nextToken = (highest?.tokenNumber || 0) + 1;

      return tx.appointment.create({
        data: {
          clinicId: req.clinicId,
          doctorId: assignedDoctorId,
          patientId,
          tokenNumber: nextToken,
          appointmentDate,
          status: 'WAITING',
          visitType,
          chiefComplaint: chiefComplaint || null,
          vitals: vitals || null,
        },
        include: {
          patient: true,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: `Appointment created with Token #${appointment.tokenNumber}`,
      data: appointment,
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

    const validStatuses = ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
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
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: updated,
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
