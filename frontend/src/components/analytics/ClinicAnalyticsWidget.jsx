import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Pill,
  PieChart,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';

export default function ClinicAnalyticsWidget({ clinicName = 'Current Clinic' }) {
  const [rangeDays, setRangeDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (days = rangeDays) => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOverview({ days });
      if (res?.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn('Failed to load clinic analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(rangeDays);
  }, [rangeDays]);

  const summary = analytics?.summary || {
    totalPatients: 0,
    totalPrescriptions: 0,
    totalRevenue: 0,
    pendingDues: 0,
    todayRevenue: 0,
    todayQueueCount: 0,
    todayCompletedCount: 0,
  };

  const dailyTrends = analytics?.dailyTrends || [];
  const topDiagnoses = analytics?.topDiagnoses || [];
  const topMedicines = analytics?.topMedicines || [];
  const paymentModes = analytics?.paymentModes || [];

  const maxDailyPatients = Math.max(...dailyTrends.map((d) => d.patients), 5);

  return (
    <div className="space-y-6">
      {/* Header with Title and Range Picker */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75]">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-[#10201F]">
              OPD Clinical & Financial Intelligence
            </h2>
            <p className="text-xs text-[#4E6460]">
              Real-time patient footfall, diagnostic prevalence, and revenue metrics for{' '}
              <span className="font-semibold text-[#123A3A]">{clinicName}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-1 text-xs font-semibold text-[#4E6460]">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`rounded-lg px-3 py-1 transition ${
                  rangeDays === days
                    ? 'bg-[#123A3A] text-white shadow-xs'
                    : 'text-[#4E6460] hover:text-[#10201F]'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(rangeDays)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#123A3A] transition"
            title="Refresh Analytics"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#287C75]' : ''} />
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Footfall */}
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D908C]">
            <span>Total Patients</span>
            <Users size={15} className="text-[#287C75]" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            {summary.totalPatients}
          </p>
          <p className="mt-1 text-[11px] text-[#4E6460]">
            {summary.todayQueueCount} currently in waiting queue
          </p>
        </div>

        {/* Total Invoiced Revenue */}
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D908C]">
            <span>Settled Revenue</span>
            <Wallet size={15} className="text-emerald-600" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-700 tabular-nums">
            ₹ {summary.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[11px] text-[#4E6460]">
            ₹ {summary.todayRevenue.toLocaleString('en-IN')} collected today
          </p>
        </div>

        {/* Prescriptions */}
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D908C]">
            <span>Digital Prescriptions</span>
            <FileText size={15} className="text-amber-600" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            {summary.totalPrescriptions}
          </p>
          <p className="mt-1 text-[11px] text-[#4E6460]">
            {summary.todayCompletedCount} consultations completed today
          </p>
        </div>

        {/* Pending Dues */}
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D908C]">
            <span>Outstanding Dues</span>
            <CreditCard size={15} className="text-rose-500" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-[#10201F] tabular-nums">
            ₹ {summary.pendingDues.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[11px] text-[#4E6460]">
            {summary.pendingDues === 0 ? 'All patient dues reconciled' : 'Unsettled outpatient bills'}
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Footfall Trend Histogram (7/14/30 Days) */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-bold text-[#10201F] flex items-center gap-1.5">
                <BarChart3 size={15} className="text-[#287C75]" />
                Daily Outpatient Footfall & Revenue Trend
              </h3>
              <p className="text-xs text-[#7D908C] mt-0.5">
                Daily patient visits over the selected {rangeDays}-day operational window.
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3 border-b border-[#D9E6E2] pb-2">
            {dailyTrends.length > 0 ? (
              dailyTrends.map((d) => {
                const heightPct = Math.max(8, Math.round((d.patients / maxDailyPatients) * 100));
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 z-20 hidden rounded-lg bg-[#123A3A] px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block whitespace-nowrap">
                      {d.patients} Patients • ₹{d.revenue}
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-[#123A3A] to-[#287C75] group-hover:from-[#287C75] group-hover:to-[#C9A45C] transition-all duration-300"
                    />
                    <span className="mt-2 text-[10px] font-medium text-[#7D908C] truncate max-w-[42px]">
                      {d.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[#7D908C]">
                No appointment trends available for this range.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[#7D908C]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#287C75]" />
                Consultation Footfall
              </span>
            </div>
            <span>Scale: 0 - {maxDailyPatients} Patients/Day</span>
          </div>
        </div>

        {/* Payment Modes & Settlement */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-[#10201F] flex items-center gap-1.5">
              <DollarSign size={15} className="text-emerald-600" />
              Cashflow Mode Distribution
            </h3>
          </div>
          <p className="text-xs text-[#7D908C] mt-0.5">
            Breakdown of collected consultation fees.
          </p>

          <div className="mt-4 space-y-3">
            {paymentModes.map((m) => {
              const totalAmount = summary.totalRevenue || 1;
              const pct = Math.round((m.amount / totalAmount) * 100);
              return (
                <div key={m.mode} className="rounded-xl border border-[#D9E6E2]/70 bg-[#F7FAF8] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#10201F] flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#287C75]" />
                      {m.mode}
                    </span>
                    <span className="font-bold text-emerald-700">
                      ₹ {m.amount.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-[#7D908C]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-[#287C75] to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}

            {paymentModes.length === 0 && (
              <p className="text-xs text-[#7D908C] py-6 text-center">
                No payment transactions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Intelligence: Diagnoses & Medicines Leaderboard */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Diagnoses */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-bold text-[#10201F] flex items-center gap-1.5">
                <Stethoscope size={15} className="text-[#287C75]" />
                Top Clinical Diagnoses
              </h3>
              <p className="text-xs text-[#7D908C] mt-0.5">
                Most prevalent conditions diagnosed in outpatient visits.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {topDiagnoses.length > 0 ? (
              topDiagnoses.map((d, idx) => (
                <div key={d.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#10201F] flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#287C75]/10 text-[10px] font-bold text-[#287C75]">
                        #{idx + 1}
                      </span>
                      {d.name}
                    </span>
                    <span className="text-[#4E6460]">
                      {d.count} Cases ({d.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, d.percentage || 10)}%` }}
                      className="h-full bg-[#287C75] rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#7D908C] py-6 text-center">
                Prescribe consultations to generate diagnosis trends.
              </p>
            )}
          </div>
        </div>

        {/* Top Prescribed Formulations */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-bold text-[#10201F] flex items-center gap-1.5">
                <Pill size={15} className="text-amber-600" />
                Frequently Prescribed Formulations
              </h3>
              <p className="text-xs text-[#7D908C] mt-0.5">
                Top medicines prescribed from the master formulary.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {topMedicines.length > 0 ? (
              topMedicines.map((m, idx) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between rounded-xl border border-[#D9E6E2]/70 bg-[#F7FAF8] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-700">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-[#10201F]">{m.name}</span>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#287C75]">
                    {m.count} Rxs
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#7D908C] py-6 text-center">
                Prescribe medications to populate formulary utilization.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
