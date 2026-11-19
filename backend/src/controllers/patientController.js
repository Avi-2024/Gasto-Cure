const prisma = require('../config/prisma');

/**
 * List / Search Patients (Tenant-Scoped)
 */
exports.getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      clinicId: req.clinicId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { mrn: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        patients,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients list.',
      error: error.message,
    });
  }
};

/**
 * Register New Patient with Atomic Sequential MRN
 */
exports.createPatient = async (req, res) => {
  try {
    const { name, phone, age, gender, bloodGroup, allergies, chronicConditions, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and phone number are required.',
      });
    }

    // Atomic transaction: count clinic patients to generate sequential MRN
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.findUnique({
        where: { id: req.clinicId },
        select: { code: true },
      });

      const count = await tx.patient.count({
        where: { clinicId: req.clinicId },
      });

      const year = new Date().getFullYear();
      const seq = String(count + 1).padStart(4, '0');
      const mrn = `${clinic?.code || 'PX'}-${year}-${seq}`;

      const newPatient = await tx.patient.create({
        data: {
          clinicId: req.clinicId,
          mrn,
          name: name.trim(),
          phone: phone.trim(),
          age: age ? parseInt(age, 10) : null,
          gender: gender || 'OTHER',
          bloodGroup: bloodGroup || null,
          allergies: Array.isArray(allergies) ? allergies : [],
          chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
          address: address || null,
          lastVisitDate: new Date(),
        },
      });

      return newPatient;
    });

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Create patient error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create patient.',
      error: error.message,
    });
  }
};

/**
 * Get Patient Profile by ID with Consultation History
 */
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinicId: req.clinicId, // Strict Tenant Guardrail
      },
      include: {
        prescriptions: {
          orderBy: { visitDate: 'desc' },
          take: 10,
          include: {
            doctor: {
              select: { id: true, fullName: true },
            },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in this clinic.',
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details.',
      error: error.message,
    });
  }
};
