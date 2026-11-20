const prisma = require('../config/prisma');

/**
 * List / Filter Invoices with Clinic Financial Summary (Tenant-Scoped)
 */
exports.getInvoices = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      clinicId: req.clinicId,
      ...(status && status !== 'all' && {
        status: status.toUpperCase(),
      }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search } } },
          { patient: { mrn: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [invoices, total, allClinicInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              mrn: true,
              phone: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
      // Calculate financial summary across all invoices for this clinic
      prisma.invoice.findMany({
        where: { clinicId: req.clinicId },
        select: {
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Financial calculations
    const todayStr = new Date().toISOString().split('T')[0];
    let totalCollected = 0;
    let pendingDues = 0;
    let todayCollected = 0;

    for (const inv of allClinicInvoices) {
      const amount = Number(inv.total) || 0;
      if (inv.status === 'PAID') {
        totalCollected += amount;
        if (inv.createdAt && inv.createdAt.toISOString().startsWith(todayStr)) {
          todayCollected += amount;
        }
      } else if (inv.status === 'PENDING') {
        pendingDues += amount;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        invoices: invoices.map((inv) => ({
          id: inv.invoiceNumber,
          rawId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientId: inv.patientId,
          patientName: inv.patient?.name || 'Walk-in Patient',
          patientPhone: inv.patient?.phone || '',
          patientMrn: inv.patient?.mrn || '',
          service: Array.isArray(inv.items) && inv.items[0]?.item ? inv.items[0].item : 'Outpatient Consultation',
          items: inv.items,
          amount: inv.amount,
          discount: inv.discount,
          tax: inv.tax,
          total: inv.total,
          mode: inv.paymentMode,
          status: inv.status === 'PAID' ? 'Paid' : inv.status === 'PENDING' ? 'Pending' : 'Refunded',
          rawStatus: inv.status,
          date: inv.createdAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
        })),
        total,
        metrics: {
          totalCollected,
          pendingDues,
          todayCollected,
          invoiceCount: allClinicInvoices.length,
        },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices list.',
      error: error.message,
    });
  }
};

/**
 * Create New Invoice with Atomic Sequential Sequence
 */
exports.createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone,
      appointmentId,
      service,
      items,
      amount,
      discount = 0,
      tax = 0,
      total,
      paymentMode = 'CASH',
      status = 'PAID',
    } = req.body;

    const subtotal = Number(amount) || 0;
    const finalTotal = total !== undefined ? Number(total) : subtotal - Number(discount) + Number(tax);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve Patient
      let resolvedPatient = null;

      if (patientId) {
        // Try to find patient by UUID
        try {
          resolvedPatient = await tx.patient.findFirst({
            where: {
              id: patientId,
              clinicId: req.clinicId,
            },
          });
        } catch {
          // patientId wasn't a valid UUID, search by MRN or phone
          resolvedPatient = await tx.patient.findFirst({
            where: {
              clinicId: req.clinicId,
              OR: [
                { mrn: patientId },
                { phone: patientPhone || patientId },
              ],
            },
          });
        }
      }

      // If patient not found by ID, search by phone or name
      if (!resolvedPatient && (patientPhone || patientName)) {
        resolvedPatient = await tx.patient.findFirst({
          where: {
            clinicId: req.clinicId,
            ...(patientPhone && { phone: patientPhone }),
            ...(patientName && !patientPhone && { name: patientName }),
          },
        });
      }

      // If still not found, create a patient record so the invoice is legally tied to a patient
      if (!resolvedPatient) {
        const pCount = await tx.patient.count({ where: { clinicId: req.clinicId } });
        const clinicRef = await tx.clinic.findUnique({
          where: { id: req.clinicId },
          select: { code: true },
        });
        const mrn = `${clinicRef?.code || 'PX'}-${new Date().getFullYear()}-${String(pCount + 1).padStart(4, '0')}`;

        resolvedPatient = await tx.patient.create({
          data: {
            clinicId: req.clinicId,
            mrn,
            name: (patientName || 'Walk-in Patient').trim(),
            phone: (patientPhone || '9876543210').trim(),
            gender: 'OTHER',
            lastVisitDate: new Date(),
          },
        });
      }

      // 2. Fetch Clinic for Code
      const clinic = await tx.clinic.findUnique({
        where: { id: req.clinicId },
        select: { code: true },
      });

      // 3. Count invoices for sequential number
      const invoiceCount = await tx.invoice.count({
        where: { clinicId: req.clinicId },
      });

      const year = new Date().getFullYear();
      const seq = String(invoiceCount + 1).padStart(4, '0');
      const invoiceNumber = `INV-${clinic?.code || 'GC'}-${year}-${seq}`;

      // 4. Construct Item Breakdown
      const lineItems = Array.isArray(items) && items.length > 0
        ? items
        : [{ item: service || 'Outpatient Consultation & Review', qty: 1, rate: subtotal, amount: subtotal }];

      // Normalize status
      const validStatuses = ['PAID', 'PENDING', 'REFUNDED'];
      const normalizedStatus = validStatuses.includes(status?.toUpperCase())
        ? status.toUpperCase()
        : 'PAID';

      const newInvoice = await tx.invoice.create({
        data: {
          clinicId: req.clinicId,
          patientId: resolvedPatient.id,
          appointmentId: appointmentId || null,
          invoiceNumber,
          amount: subtotal,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          total: finalTotal,
          status: normalizedStatus,
          paymentMode: (paymentMode || 'CASH').toUpperCase(),
          items: lineItems,
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              mrn: true,
              phone: true,
            },
          },
        },
      });

      return newInvoice;
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully.',
      data: {
        id: result.invoiceNumber,
        rawId: result.id,
        invoiceNumber: result.invoiceNumber,
        patientId: result.patientId,
        patientName: result.patient?.name,
        patientPhone: result.patient?.phone,
        patientMrn: result.patient?.mrn,
        service: Array.isArray(result.items) && result.items[0]?.item ? result.items[0].item : service,
        items: result.items,
        amount: result.amount,
        discount: result.discount,
        tax: result.tax,
        total: result.total,
        mode: result.paymentMode,
        status: result.status === 'PAID' ? 'Paid' : result.status === 'PENDING' ? 'Pending' : 'Refunded',
        rawStatus: result.status,
        date: result.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create invoice.',
      error: error.message,
    });
  }
};

/**
 * Mark Invoice as Paid / Update Status
 */
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'PAID', paymentMode } = req.body;

    const normalizedStatus = status.toUpperCase();

    // Find invoice by raw UUID or by invoiceNumber (e.g. INV-GC-2026-0001)
    const existing = await prisma.invoice.findFirst({
      where: {
        clinicId: req.clinicId,
        OR: [
          { id: id },
          { invoiceNumber: id },
        ],
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found in this clinic.',
      });
    }

    const updated = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        status: normalizedStatus,
        ...(paymentMode && { paymentMode: paymentMode.toUpperCase() }),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mrn: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Invoice #${updated.invoiceNumber} status updated.`,
      data: {
        id: updated.invoiceNumber,
        rawId: updated.id,
        invoiceNumber: updated.invoiceNumber,
        status: updated.status === 'PAID' ? 'Paid' : updated.status === 'PENDING' ? 'Pending' : 'Refunded',
        mode: updated.paymentMode,
        total: updated.total,
      },
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update invoice status.',
      error: error.message,
    });
  }
};
