const prisma = require('../config/prisma');

/**
 * Get Comprehensive OPD Clinical & Financial Analytics (Tenant-Scoped)
 */
exports.getOverviewAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const numDays = Math.min(90, Math.max(1, parseInt(days, 10)));
    const clinicId = req.clinicId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (numDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Parallel fetch of tenant-scoped entities
    const [
      totalPatients,
      totalPrescriptions,
      recentPrescriptions,
      appointments,
      invoices,
      todayQueueCount,
      todayCompletedCount,
    ] = await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.prescription.count({ where: { clinicId } }),
      prisma.prescription.findMany({
        where: { clinicId },
        select: {
          diagnosis: true,
          medicines: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.appointment.findMany({
        where: {
          clinicId,
          appointmentDate: { gte: startDate },
        },
        select: {
          appointmentDate: true,
          status: true,
        },
      }),
      prisma.invoice.findMany({
        where: { clinicId },
        select: {
          total: true,
          status: true,
          paymentMode: true,
          createdAt: true,
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: { gte: todayStart },
          status: 'WAITING',
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: { gte: todayStart },
          status: 'COMPLETED',
        },
      }),
    ]);

    // 1. Financial Summary & Payment Breakdown
    let totalRevenue = 0;
    let pendingDues = 0;
    let todayRevenue = 0;
    const paymentModeMap = {
      UPI: { mode: 'UPI', amount: 0, count: 0 },
      CASH: { mode: 'Cash', amount: 0, count: 0 },
      CARD: { mode: 'Card', amount: 0, count: 0 },
      ONLINE: { mode: 'Online', amount: 0, count: 0 },
    };

    invoices.forEach((inv) => {
      const amt = Number(inv.total) || 0;
      if (inv.status === 'PAID') {
        totalRevenue += amt;
        if (inv.createdAt >= todayStart) {
          todayRevenue += amt;
        }

        const modeKey = (inv.paymentMode || 'CASH').toUpperCase();
        if (!paymentModeMap[modeKey]) {
          paymentModeMap[modeKey] = { mode: modeKey, amount: 0, count: 0 };
        }
        paymentModeMap[modeKey].amount += amt;
        paymentModeMap[modeKey].count += 1;
      } else if (inv.status === 'PENDING') {
        pendingDues += amt;
      }
    });

    // 2. Clinical Diagnoses & Formulary Medicine Frequencies
    const diagnosisCounts = {};
    const medicineCounts = {};

    recentPrescriptions.forEach((rx) => {
      if (Array.isArray(rx.diagnosis)) {
        rx.diagnosis.forEach((d) => {
          if (d && typeof d === 'string') {
            const clean = d.trim();
            diagnosisCounts[clean] = (diagnosisCounts[clean] || 0) + 1;
          }
        });
      }

      if (Array.isArray(rx.medicines)) {
        rx.medicines.forEach((m) => {
          const name = m?.brandName || m?.name;
          if (name && typeof name === 'string') {
            const clean = name.trim();
            medicineCounts[clean] = (medicineCounts[clean] || 0) + 1;
          }
        });
      }
    });

    const totalDiagnosesRecorded = Object.values(diagnosisCounts).reduce((a, b) => a + b, 0);

    const topDiagnoses = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalDiagnosesRecorded > 0 ? Math.round((count / totalDiagnosesRecorded) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topMedicines = Object.entries(medicineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Past 7-Day Daily Trends (Footfall & Daily Invoiced Revenue)
    const dailyMap = {};
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = {
        date: dateKey,
        label: `${weekdayNames[d.getDay()]} ${d.getDate()}`,
        patients: 0,
        revenue: 0,
      };
    }

    appointments.forEach((appt) => {
      if (appt.appointmentDate) {
        const key = appt.appointmentDate.toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].patients += 1;
        }
      }
    });

    invoices.forEach((inv) => {
      if (inv.status === 'PAID' && inv.createdAt >= startDate) {
        const key = inv.createdAt.toISOString().split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].revenue += Number(inv.total) || 0;
        }
      }
    });

    const dailyTrends = Object.values(dailyMap);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPatients,
          totalPrescriptions,
          totalRevenue,
          pendingDues,
          todayRevenue,
          todayQueueCount,
          todayCompletedCount,
        },
        dailyTrends,
        topDiagnoses,
        topMedicines,
        paymentModes: Object.values(paymentModeMap).filter((m) => m.count > 0 || m.amount > 0),
      },
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate clinic analytics.',
      error: error.message,
    });
  }
};
