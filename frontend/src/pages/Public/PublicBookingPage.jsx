import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { appointmentApi } from '../../services/appointmentApi';

export default function PublicBookingPage() {
  const { clinicSlug = 'gastrocure' } = useParams();

  const [clinicData, setClinicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'MALE',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: 'Morning OPD (10:00 AM - 01:00 PM)',
    reason: 'General Outpatient Consultation',
  });

  useEffect(() => {
    appointmentApi
      .getPublicClinicInfo(clinicSlug)
      .then((data) => {
        setClinicData(data);
        if (data?.doctors?.length > 0) {
          setFormData((prev) => ({ ...prev, doctorId: data.doctors[0].doctorId }));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch public clinic info:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clinicSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.patientPhone.trim()) {
      setErrorMsg('Please enter both patient full name and phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await appointmentApi.publicBookAppointment({
        clinicSlug,
        ...formData,
      });

      if (res?.success && res?.data) {
        setConfirmedPass(res.data);
      } else {
        throw new Error(res?.message || 'Failed to complete booking');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while confirming booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const clinic = clinicData?.clinic || {
    name: 'Gastro Cure Digestive & Liver Centre',
    tagline: 'Digestive & Liver Health Specialists',
    address: '402 Doctor House, Navrangpura, Ahmedabad, Gujarat',
    phone: '+91 98765 43210',
  };

  const doctors = clinicData?.doctors || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAF8] to-[#EAEFEA] py-8 px-4 sm:px-6 lg:px-8 text-[#10201F]">
      <div className="mx-auto max-w-2xl">
        {/* Header / Brand Banner */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#287C75]/25 bg-white/80 px-4 py-1 text-xs font-bold text-[#287C75] shadow-2xs backdrop-blur-xs">
            <ShieldCheck size={14} />
            <span>Verified ClinixPulse™ OPD Portal</span>
          </div>

          <h1 className="mt-4 font-heading text-2xl font-black tracking-tight text-[#10201F] sm:text-3xl">
            {clinic.name}
          </h1>
          {clinic.tagline && (
            <p className="mt-1 text-xs font-semibold text-[#287C75] uppercase tracking-wider">
              {clinic.tagline}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-[#4E6460]">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[#287C75]" />
              {clinic.address}
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#123A3A]">
              <Phone size={13} className="text-[#287C75]" />
              {clinic.phone}
            </span>
          </div>
        </header>

        {/* Confirmation Pass Screen */}
        {confirmedPass ? (
          <div className="rounded-3xl border border-emerald-300 bg-white p-6 shadow-xl sm:p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-[#D9E6E2] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-black text-[#10201F]">
                    Appointment Confirmed!
                  </h2>
                  <p className="text-xs text-[#4E6460]">
                    Your digital OPD token has been allocated.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-sm font-black text-emerald-800">
                  <Ticket size={14} />
                  {confirmedPass.tokenFormatted || `Token #${confirmedPass.tokenNumber}`}
                </span>
              </div>
            </div>

            {/* Token Card */}
            <div className="mt-6 rounded-2xl border border-[#D9E6E2] bg-gradient-to-br from-[#F7FAF8] to-[#E9F3F0] p-5">
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-[#7D908C] uppercase font-bold text-[10px] tracking-wider">
                    Patient Name
                  </span>
                  <p className="font-heading text-sm font-bold text-[#10201F] mt-0.5">
                    {confirmedPass.patient?.name}
                  </p>
                  <p className="text-[11px] text-[#4E6460]">
                    Mobile: {confirmedPass.patient?.phone} • MRN: {confirmedPass.patient?.mrn}
                  </p>
                </div>

                <div>
                  <span className="text-[#7D908C] uppercase font-bold text-[10px] tracking-wider">
                    Assigned Doctor
                  </span>
                  <p className="font-heading text-sm font-bold text-[#123A3A] mt-0.5">
                    {confirmedPass.doctorName || 'Consultant Physician'}
                  </p>
                  <p className="text-[11px] text-[#4E6460]">{clinic.name}</p>
                </div>

                <div>
                  <span className="text-[#7D908C] uppercase font-bold text-[10px] tracking-wider">
                    Scheduled Date & Shift
                  </span>
                  <p className="font-bold text-[#10201F] mt-0.5">
                    {confirmedPass.appointmentDate}
                  </p>
                  <p className="text-[11px] text-[#287C75] font-semibold">
                    {confirmedPass.timeSlot}
                  </p>
                </div>

                <div>
                  <span className="text-[#7D908C] uppercase font-bold text-[10px] tracking-wider">
                    Hospital Location
                  </span>
                  <p className="font-semibold text-[#10201F] mt-0.5 text-[11px]">
                    {confirmedPass.clinic?.address || clinic.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-[#8C6B1F]">
              <p className="font-bold flex items-center gap-1.5">
                <Clock3 size={14} className="text-amber-700" />
                Clinic OPD Arrival Instructions
              </p>
              <p className="mt-1 text-[11px] text-[#8C6B1F]/90 leading-relaxed">
                Please present this digital token at the reception desk 15 minutes before your time slot.
                Bring any previous medical prescriptions or laboratory test reports.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D9E6E2] bg-white px-4 py-2.5 text-xs font-bold text-[#10201F] shadow-xs hover:bg-[#F7FAF8] transition"
              >
                <Printer size={15} />
                <span>Print Booking Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmedPass(null);
                  setFormData({
                    patientName: '',
                    patientPhone: '',
                    patientAge: '',
                    patientGender: 'MALE',
                    doctorId: doctors[0]?.doctorId || '',
                    appointmentDate: new Date().toISOString().split('T')[0],
                    timeSlot: 'Morning OPD (10:00 AM - 01:00 PM)',
                    reason: 'General Outpatient Consultation',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#287C75] transition"
              >
                <RotateCcw size={14} />
                <span>Book Another Appointment</span>
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-xl sm:p-8">
            <div className="border-b border-[#D9E6E2] pb-4 mb-6">
              <h2 className="font-heading text-lg font-bold text-[#10201F]">
                Book Outpatient Consultation
              </h2>
              <p className="text-xs text-[#4E6460] mt-0.5">
                Fill patient information to receive an instant verified token pass.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Doctor Selector */}
              {doctors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    Select Specialist Doctor *
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.doctorId} value={doc.doctorId}>
                        {doc.name} • {doc.specialization} ({doc.qualifications})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Patient Name & Mobile */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    Patient Full Name *
                  </label>
                  <input
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-3 text-xs font-semibold text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    WhatsApp / Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit Mobile Number"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-3 text-xs font-semibold text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 35"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-3 text-xs font-semibold text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    Gender
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-3 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                    OPD Shift / Time Slot *
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                  >
                    <option value="Morning OPD (10:00 AM - 01:00 PM)">Morning OPD (10:00 AM - 01:00 PM)</option>
                    <option value="Afternoon OPD (02:00 PM - 04:30 PM)">Afternoon OPD (02:00 PM - 04:30 PM)</option>
                    <option value="Evening OPD (05:00 PM - 08:00 PM)">Evening OPD (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Chief Complaint / Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5">
                  Symptoms / Reason for Visit
                </label>
                <input
                  placeholder="e.g. Acid reflux, stomach ache, routine follow-up"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white p-3 text-xs font-semibold text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#123A3A] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#287C75] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Confirming Booking...</span>
                  ) : (
                    <>
                      <Ticket size={16} />
                      <span>Confirm Booking & Generate OPD Pass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-[#7D908C]">
          <p>
            Powered by{' '}
            <span className="font-bold text-[#123A3A]">ClinixPulse™ Healthcare SaaS</span> • Zero
            Wait Time Digital Outpatient Platform
          </p>
          <p className="mt-1">
            Clinic Staff?{' '}
            <Link to="/auth/login" className="font-semibold text-[#287C75] hover:underline">
              Sign In to Staff Workspace
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
