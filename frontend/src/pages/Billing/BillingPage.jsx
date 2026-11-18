import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { localPatients } from '../../services/localStore';

const INITIAL_INVOICES = [
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

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Form state for creating invoice
  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    patientName: '',
    service: 'General Outpatient Consultation',
    amount: '500',
    mode: 'UPI',
    status: 'Paid',
  });

  const patients = useMemo(() => localPatients.getAll(), []);

  // Load invoices from localStorage with fallback seed
  useEffect(() => {
    const stored = localStorage.getItem('ds_billing');
    if (stored) {
      try {
        setInvoices(JSON.parse(stored));
      } catch {
        setInvoices(INITIAL_INVOICES);
        localStorage.setItem('ds_billing', JSON.stringify(INITIAL_INVOICES));
      }
    } else {
      setInvoices(INITIAL_INVOICES);
      localStorage.setItem('ds_billing', JSON.stringify(INITIAL_INVOICES));
    }
  }, []);

  const saveInvoices = (updated) => {
    setInvoices(updated);
    localStorage.setItem('ds_billing', JSON.stringify(updated));
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        (inv.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.service || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  // Financial KPIs
  const metrics = useMemo(() => {
    const totalCollected = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const pendingDues = invoices
      .filter((i) => i.status === 'Pending')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const todayDate = new Date().toISOString().split('T')[0];
    const todayCollected = invoices
      .filter((i) => i.status === 'Paid' && i.date && i.date.startsWith(todayDate))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    return {
      totalCollected,
      pendingDues,
      todayCollected,
      invoiceCount: invoices.length,
    };
  }, [invoices]);

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newInvoice.patientName.trim()) {
      alert('Please enter or select a patient name.');
      return;
    }

    const created = {
      id: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      patientId: newInvoice.patientId || `PT-${Date.now().toString().slice(-4)}`,
      patientName: newInvoice.patientName,
      service: newInvoice.service,
      amount: Number(newInvoice.amount) || 0,
      mode: newInvoice.mode,
      status: newInvoice.status,
      date: new Date().toISOString(),
    };

    const updated = [created, ...invoices];
    saveInvoices(updated);
    setShowModal(false);
    setNewInvoice({
      patientId: '',
      patientName: '',
      service: 'General Outpatient Consultation',
      amount: '500',
      mode: 'UPI',
      status: 'Paid',
    });
    setNotification(`Invoice #${created.id} recorded successfully.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const markInvoicePaid = (id) => {
    const updated = invoices.map((inv) =>
      inv.id === id ? { ...inv, status: 'Paid', mode: inv.mode || 'Cash' } : inv
    );
    saveInvoices(updated);
    setNotification(`Invoice #${id} updated to Paid.`);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-xs font-semibold text-[#287C75]">
                <Receipt size={13} />
                Clinic Financials & Cashflow
              </span>
              <span className="text-xs text-[#7D908C]">
                {invoices.length} total receipts issued
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              Billing & Invoices
            </h1>
            <p className="mt-1 text-sm text-[#4E6460]">
              Track consultation revenue, issue patient receipts, and reconcile pending outpatient dues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0"
          >
            <Plus size={16} />
            <span>Create Invoice / Collect Fee</span>
          </button>
        </div>

        {notification && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-semibold text-[#123A3A]">
            <CheckCircle2 size={15} className="text-[#287C75] shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </section>

      {/* KPI Financial Overview Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Total Collected</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#287C75]">
              <ArrowDownLeft size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            ₹{metrics.totalCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Reconciled in system</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Today's Revenue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            ₹{metrics.todayCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Collected today</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Pending Dues</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-amber-800 tabular-nums">
            ₹{metrics.pendingDues.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-[#7D908C]">Awaiting patient settlement</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Invoices Issued</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileSpreadsheet size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            {metrics.invoiceCount}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Digital billing records</p>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        {/* Filters Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9E6E2]/60 pb-4">
          <div className="flex flex-1 items-center gap-3">
            <label className="relative flex-1 max-w-md">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice #, patient, or service..."
                className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2 pl-10 pr-3.5 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3 py-2 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-[#7D908C]">
            Showing {filteredInvoices.length} of {invoices.length}
          </span>
        </div>

        {/* Invoices Data Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9E6E2] text-[11px] font-bold uppercase tracking-wider text-[#7D908C]">
                <th className="pb-3 font-bold">Invoice #</th>
                <th className="pb-3 font-bold">Patient</th>
                <th className="pb-3 font-bold">Service / Description</th>
                <th className="pb-3 font-bold">Mode</th>
                <th className="pb-3 font-bold">Date</th>
                <th className="pb-3 font-bold">Amount</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E6E2]/60">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F7FAF8] transition">
                  <td className="py-3.5 pr-4 font-mono font-bold text-[#123A3A]">{inv.id}</td>
                  <td className="py-3.5 pr-4">
                    <div className="font-bold text-[#10201F]">{inv.patientName}</div>
                    <div className="font-mono text-[10px] text-[#7D908C]">{inv.patientId}</div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#4E6460] max-w-xs truncate">{inv.service}</td>
                  <td className="py-3.5 pr-4">
                    <span className="rounded-md border border-[#D9E6E2] bg-[#F7FAF8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#123A3A]">
                      {inv.mode}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-[#7D908C] font-mono">
                    {new Date(inv.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 pr-4 font-heading font-bold text-sm text-[#10201F] tabular-nums">
                    ₹{Number(inv.amount).toLocaleString()}
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusBadge
                      label={inv.status}
                      variant={inv.status === 'Paid' ? 'success' : 'warning'}
                    />
                  </td>
                  <td className="py-3.5 text-right">
                    {inv.status === 'Pending' ? (
                      <button
                        type="button"
                        onClick={() => markInvoicePaid(inv.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 size={12} />
                        Collect
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700">Settled</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#7D908C]">
                    No invoices match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Invoice Modal */}
      {showModal && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
              <h2 className="font-heading text-lg font-bold text-[#10201F]">
                New Patient Invoice
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9E6E2] text-[#4E6460] hover:bg-[#F7FAF8]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                  Select Patient
                </label>
                <select
                  value={newInvoice.patientId}
                  onChange={(e) => {
                    const sel = patients.find((p) => p.id === e.target.value);
                    setNewInvoice((prev) => ({
                      ...prev,
                      patientId: e.target.value,
                      patientName: sel?.name || prev.patientName,
                    }));
                  }}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2.5 text-xs font-semibold text-[#10201F]"
                >
                  <option value="">-- Choose registered patient or enter below --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                  Patient Name *
                </label>
                <input
                  required
                  placeholder="Patient Name"
                  value={newInvoice.patientName}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, patientName: e.target.value }))}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                  Clinical Service
                </label>
                <input
                  placeholder="e.g. Consultation & Rx"
                  value={newInvoice.service}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, service: e.target.value }))}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={newInvoice.mode}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, mode: e.target.value }))}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#4E6460] block mb-1">
                  Status
                </label>
                <select
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                >
                  <option value="Paid">Paid (Settled)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="mt-5 flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2.5 text-xs font-bold text-[#4E6460] hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#123A3A] py-2.5 text-xs font-bold text-white hover:bg-[#287C75]"
                >
                  Save & Issue
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
