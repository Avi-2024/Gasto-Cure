const prisma = require('../config/prisma');
const { uploadFile } = require('../services/storage/supabaseStorage');

/**
 * Get current clinic profile and dynamic branding
 * Powers the Header, Sidebar, and Prescription Studio
 */
exports.getCurrentClinicBranding = async (req, res) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinicId },
      include: {
        _count: {
          select: {
            patients: true,
            appointments: true,
            prescriptions: true,
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
      data: {
        id: clinic.id,
        code: clinic.code,
        slug: clinic.slug,
        name: clinic.name,
        shortName: clinic.shortName || clinic.name,
        tagline: clinic.tagline,
        logoUrl: clinic.logoUrl,
        iconUrl: clinic.iconUrl,
        phone: clinic.phone,
        email: clinic.email,
        whatsappNumber: clinic.whatsappNumber,
        website: clinic.website,
        addressLine1: clinic.addressLine1,
        addressLine2: clinic.addressLine2,
        city: clinic.city,
        state: clinic.state,
        pincode: clinic.pincode,
        country: clinic.country,
        stationeryMode: clinic.stationeryMode,
        topMarginMm: clinic.topMarginMm,
        bottomMarginMm: clinic.bottomMarginMm,
        watermarkEnabled: clinic.watermarkEnabled,
        watermarkOpacity: clinic.watermarkOpacity,
        customRegText: clinic.customRegText,
        primaryColor: clinic.primaryColor,
        accentColor: clinic.accentColor,
        stats: clinic._count,
      },
    });
  } catch (error) {
    console.error('Get branding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clinic branding.',
      error: error.message,
    });
  }
};

/**
 * Update current clinic branding (Owner or Super Admin only)
 */
exports.updateCurrentClinicBranding = async (req, res) => {
  try {
    const {
      name,
      shortName,
      tagline,
      logoUrl,
      iconUrl,
      phone,
      email,
      whatsappNumber,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      stationeryMode,
      topMarginMm,
      bottomMarginMm,
      watermarkEnabled,
      watermarkOpacity,
      customRegText,
      primaryColor,
      accentColor,
    } = req.body;

    const updatedClinic = await prisma.clinic.update({
      where: { id: req.clinicId },
      data: {
        ...(name && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(tagline !== undefined && { tagline }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(website !== undefined && { website }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(stationeryMode && { stationeryMode }),
        ...(topMarginMm !== undefined && { topMarginMm: parseFloat(topMarginMm) }),
        ...(bottomMarginMm !== undefined && { bottomMarginMm: parseFloat(bottomMarginMm) }),
        ...(watermarkEnabled !== undefined && { watermarkEnabled: Boolean(watermarkEnabled) }),
        ...(watermarkOpacity !== undefined && { watermarkOpacity: parseFloat(watermarkOpacity) }),
        ...(customRegText !== undefined && { customRegText }),
        ...(primaryColor && { primaryColor }),
        ...(accentColor && { accentColor }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Clinic branding updated successfully.',
      data: updatedClinic,
    });
  } catch (error) {
    console.error('Update branding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update clinic branding.',
      error: error.message,
    });
  }
};

/**
 * Upload clinic logo to Supabase Storage & update clinic record
 */
exports.uploadClinicLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided. Please attach a valid image.',
      });
    }

    const ext = req.file.originalname.split('.').pop() || 'png';
    const filename = `clinic_${req.clinicId}_logo_${Date.now()}.${ext}`;

    const { url, storageProvider } = await uploadFile({
      buffer: req.file.buffer,
      filename,
      mimeType: req.file.mimetype,
      folder: 'clinic-logos',
    });

    const updated = await prisma.clinic.update({
      where: { id: req.clinicId },
      data: { logoUrl: url },
    });

    return res.status(200).json({
      success: true,
      message: 'Clinic logo uploaded successfully.',
      data: {
        logoUrl: url,
        storageProvider,
        clinic: updated,
      },
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload clinic logo.',
      error: error.message,
    });
  }
};
