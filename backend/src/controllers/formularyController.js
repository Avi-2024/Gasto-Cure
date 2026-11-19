const prisma = require('../config/prisma');

/**
 * Search Master Formulary (Global Library + Clinic Custom)
 */
exports.getFormularyDrugs = async (req, res) => {
  try {
    const { query, category, limit = 50 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const where = {
      OR: [
        { clinicId: null }, // Global base library
        { clinicId: req.clinicId }, // Active clinic custom drugs
      ],
      ...(query && {
        OR: [
          { brandName: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
    };

    const drugs = await prisma.formularyDrug.findMany({
      where,
      take: limitNum,
      orderBy: [{ isCommon: 'desc' }, { brandName: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      data: {
        total: drugs.length,
        drugs,
      },
    });
  } catch (error) {
    console.error('Get formulary drugs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search formulary drugs.',
      error: error.message,
    });
  }
};

/**
 * Add Clinic Custom Drug to Formulary
 */
exports.createFormularyDrug = async (req, res) => {
  try {
    const { brandName, genericName, category, dosageForm, strength, defaultTiming, defaultFrequency, defaultDuration, instructions } = req.body;

    if (!brandName || !genericName) {
      return res.status(400).json({
        success: false,
        message: 'Brand name and generic name are required.',
      });
    }

    const drug = await prisma.formularyDrug.create({
      data: {
        clinicId: req.clinicId,
        brandName: brandName.trim(),
        genericName: genericName.trim(),
        category: category || 'General Medicine',
        dosageForm: dosageForm || 'Tablet',
        strength: strength || null,
        defaultTiming: defaultTiming || null,
        defaultFrequency: defaultFrequency || null,
        defaultDuration: defaultDuration || null,
        instructions: instructions || null,
        isCommon: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Drug added to clinic formulary.',
      data: drug,
    });
  } catch (error) {
    console.error('Create formulary drug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add formulary drug.',
      error: error.message,
    });
  }
};
