import { apiRequest } from './apiClient';

const INITIAL_LOCAL_INVOICES = [
  {
    id: 'INV-2026-001',
    patientId: 'PT-001',
    patientName: 'Anita Sharma',
    service: 'Specialist Consultation & Prescription',
    amount: 800,
    mode: 'UPI',
    status: 'Paid',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'INV-2026-002',
    patientId: 'PT-002',
    patientName: 'Rahul Verma',
    service: 'Comprehensive Follow-up & Lab Review',
    amount: 500,
    mode: 'Cash',
    status: 'Paid',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'INV-2026-003',
    patientId: 'PT-003',
    patientName: 'Suresh Patel',
    service: 'General Outpatient Diagnosis',
    amount: 600,
    mode: 'Card',
    status: 'Pending',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];

function getStoredLocalInvoices() {
  try {
    const raw = localStorage.getItem('ds_billing');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  localStorage.setItem('ds_billing', JSON.stringify(INITIAL_LOCAL_INVOICES));
  return INITIAL_LOCAL_INVOICES;
}

function saveStoredLocalInvoices(invoices) {
  localStorage.setItem('ds_billing', JSON.stringify(invoices));
}

export const billingApi = {
  /**
   * Fetch Invoices with Financial Metrics (Tenant-Scoped)
   */
  async getInvoices({ search = '', status = 'all', page = 1, limit = 50 } = {}) {
    if (import.meta.env.MODE === 'test') {
      const local = getStoredLocalInvoices();
      return {
        invoices: local,
        total: local.length,
        metrics: null,
        isOfflineFallback: true,
      };
    }

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));

      const res = await apiRequest(`/invoices?${params.toString()}`);
      if (res?.success && res?.data?.invoices) {
        // Cache to local storage
        saveStoredLocalInvoices(res.data.invoices);
        return {
          invoices: res.data.invoices,
          total: res.data.total,
          metrics: res.data.metrics,
          pagination: res.data.pagination,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to fetch invoices');
    } catch (err) {
      console.warn('Billing API getInvoices failed, using local store:', err.message);
      const local = getStoredLocalInvoices();
      return {
        invoices: local,
        total: local.length,
        metrics: null,
        isOfflineFallback: true,
      };
    }
  },

  /**
   * Create New Invoice with Live Atomic Sequence
   */
  async createInvoice(invoiceData) {
    if (import.meta.env.MODE === 'test') {
      const local = getStoredLocalInvoices();
      const created = {
        id: `INV-${new Date().getFullYear()}-${String(local.length + 1).padStart(3, '0')}`,
        patientId: invoiceData.patientId || `PT-${Date.now().toString().slice(-4)}`,
        patientName: invoiceData.patientName,
        service: invoiceData.service,
        amount: Number(invoiceData.amount) || 0,
        mode: invoiceData.mode || 'Cash',
        status: invoiceData.status || 'Paid',
        date: new Date().toISOString(),
      };
      saveStoredLocalInvoices([created, ...local]);
      return { success: true, data: created, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest('/invoices', {
        method: 'POST',
        body: {
          patientId: invoiceData.patientId,
          patientName: invoiceData.patientName,
          patientPhone: invoiceData.patientPhone,
          appointmentId: invoiceData.appointmentId,
          service: invoiceData.service,
          amount: Number(invoiceData.amount) || 0,
          discount: Number(invoiceData.discount) || 0,
          tax: Number(invoiceData.tax) || 0,
          total: Number(invoiceData.total ?? invoiceData.amount) || 0,
          paymentMode: invoiceData.mode || 'CASH',
          status: (invoiceData.status || 'PAID').toUpperCase(),
          items: invoiceData.items || [
            {
              item: invoiceData.service || 'Outpatient Consultation',
              qty: 1,
              rate: Number(invoiceData.amount) || 0,
              amount: Number(invoiceData.amount) || 0,
            },
          ],
        },
      });

      if (res?.success && res?.data) {
        const local = getStoredLocalInvoices();
        saveStoredLocalInvoices([res.data, ...local]);
        return {
          success: true,
          data: res.data,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to create invoice');
    } catch (err) {
      console.warn('Billing API createInvoice failed, falling back to local:', err.message);
      const local = getStoredLocalInvoices();
      const created = {
        id: `INV-${new Date().getFullYear()}-${String(local.length + 1).padStart(3, '0')}`,
        patientId: invoiceData.patientId || `PT-${Date.now().toString().slice(-4)}`,
        patientName: invoiceData.patientName,
        service: invoiceData.service,
        amount: Number(invoiceData.amount) || 0,
        mode: invoiceData.mode || 'Cash',
        status: invoiceData.status || 'Paid',
        date: new Date().toISOString(),
      };
      saveStoredLocalInvoices([created, ...local]);
      return { success: true, data: created, isOfflineFallback: true };
    }
  },

  /**
   * Update Status of Existing Invoice (Mark Paid)
   */
  async updateStatus(invoiceId, { status = 'PAID', paymentMode = 'CASH' } = {}) {
    if (import.meta.env.MODE === 'test') {
      const local = getStoredLocalInvoices();
      const updated = local.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'Paid', mode: paymentMode } : inv
      );
      saveStoredLocalInvoices(updated);
      return { success: true, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest(`/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: { status, paymentMode },
      });

      if (res?.success) {
        const local = getStoredLocalInvoices();
        const updated = local.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'Paid', mode: paymentMode } : inv
        );
        saveStoredLocalInvoices(updated);
        return { success: true, data: res.data, isOfflineFallback: false };
      }
      throw new Error(res?.message || 'Failed to update invoice status');
    } catch (err) {
      console.warn('Billing API updateStatus failed, using local update:', err.message);
      const local = getStoredLocalInvoices();
      const updated = local.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'Paid', mode: paymentMode } : inv
      );
      saveStoredLocalInvoices(updated);
      return { success: true, isOfflineFallback: true };
    }
  },
};
