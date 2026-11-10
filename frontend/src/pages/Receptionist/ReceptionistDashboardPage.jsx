import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { receptionistApi } from '../../services/receptionistApi';
import { localAppointments, localPatients } from '../../services/localStore';
import QuickPatientRegistration from './components/QuickPatientRegistration';
import AppointmentBookingPanel from './components/AppointmentBookingPanel';
import VitalsEntryPanel from './components/VitalsEntryPanel';
import QueueStatusPanel from './components/QueueStatusPanel';
import PaymentEntryPanel from './components/PaymentEntryPanel';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  HeartPulse,
  Keyboard,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

export default function ReceptionistDashboardPage() {
  const { accessToken, activeClinicId } = useAuth();

  const [registerLoading, setRegisterLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [flash, setFlash] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [registrationForm, setRegistrationForm] = useState({ fullName: '', phone: '', gender: 'male', age: '' });
  const [bookingForm, setBookingForm] = useState({ patientId: '', doctorId: 'doc-1', appointmentDate: '', startTime: '', endTime: '' });
  const [vitalsForm, setVitalsForm] = useState({ appointmentId: '', temperatureC: '', pulseBpm: '', systolicBp: '', diastolicBp: '' });
  const [statusAppointmentId, setStatusAppointmentId] = useState('');
  const [paymentForm, setPaymentForm] = useState({ billingId: '', amount: '', mode: 'cash' });

  // Operational metrics
  const queueCount = useMemo(() => localAppointments.getQueue().length, [registerLoading, bookLoading, queueLoading]);
  const patientCount = useMemo(() => localPatients.getAll().length, [registerLoading]);

  const withFlash = async (cb, message = 'Saved successfully') => {
    try {
      setFlash('');
      await cb();
      setFlash(message);
      setTimeout(() => setFlash(''), 4500);
    } catch (error) {
      setFlash(error.message || 'Action failed');
    }
  };

  const quickRegister = () =>
    withFlash(async () => {
      setRegisterLoading(true);
      await receptionistApi.quickRegisterPatient({
        clinicId: activeClinicId,
        token: accessToken,
        payload: registrationForm,
      });
      setRegistrationForm({ fullName: '', phone: '', gender: 'male', age: '' });
      setRegisterLoading(false);
    }, 'Patient registered successfully into clinic register.');

  const quickBook = () =>
    withFlash(async () => {
      setBookLoading(true);
      await receptionistApi.quickBookAppointment({
        clinicId: activeClinicId,
        token: accessToken,
        payload: bookingForm,
      });
      setBookingForm({ patientId: '', doctorId: 'doc-1', appointmentDate: '', startTime: '', endTime: '' });
      setBookLoading(false);
    }, 'Appointment booked and added to waiting queue.');

  const saveVitals = () =>
    withFlash(async () => {
      setVitalsLoading(true);
      await receptionistApi.saveVitals({
        clinicId: activeClinicId,
        token: accessToken,
        payload: {
          appointmentId: vitalsForm.appointmentId,
          vitals: {
            temperatureC: Number(vitalsForm.temperatureC),
            pulseBpm: Number(vitalsForm.pulseBpm),
            systolicBp: Number(vitalsForm.systolicBp),
            diastolicBp: Number(vitalsForm.diastolicBp),
          },
        },
      });
      setVitalsLoading(false);
    }, 'Vitals recorded for patient encounter.');

  const markStatus = (status) =>
    withFlash(async () => {
      setQueueLoading(true);
      await receptionistApi.updateAppointmentStatus({
        clinicId: activeClinicId,
        token: accessToken,
        appointmentId: statusAppointmentId,
        status,
      });
      setQueueLoading(false);
    }, `Appointment status updated to ${status}.`);

  const savePayment = () =>
    withFlash(async () => {
      setPaymentLoading(true);
      await receptionistApi.enterPayment({
        clinicId: activeClinicId,
        token: accessToken,
        billingId: paymentForm.billingId,
        payload: {
          amount: Number(paymentForm.amount),
          mode: paymentForm.mode,
        },
      });
      setPaymentForm({ billingId: '', amount: '', mode: 'cash' });
      setPaymentLoading(false);
    }, 'Payment entry recorded and receipt generated.');

  return (
    <div
      className="space-y-6"
      onKeyDown={(e) => {
        if (e.altKey && e.key.toLowerCase() === 'r') quickRegister();
        if (e.altKey && e.key.toLowerCase() === 'b') quickBook();
        if (e.altKey && e.key.toLowerCase() === 'v') saveVitals();
        if (e.altKey && e.key.toLowerCase() === 'w') markStatus('waiting');
        if (e.altKey && e.key.toLowerCase() === 'c') markStatus('completed');
        if (e.altKey && e.key.toLowerCase() === 'm') savePayment();
      }}
    >
      {/* Front Desk Hero Banner */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-3 py-1 text-xs font-semibold text-[#287C75]">
                <UserCheck size={13} />
                Front Desk Operations
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-50 px-2.5 py-1 text-xs font-medium text-[#287C75]">
                <Clock3 size={12} />
                {queueCount} Waiting in Triage
              </span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              Reception Fast Desk
            </h1>
            <p className="mt-1.5 text-sm text-[#4E6460]">
              Fast patient check-in, token triage, vitals pre-check, and fee collection with zero delay.
            </p>
          </div>

          {/* Shortcut Quick Reference Pill */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs text-[#4E6460]">
            <span className="font-bold text-[#123A3A] flex items-center gap-1">
              <Keyboard size={13} className="text-[#287C75]" />
              Hotkeys:
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 border border-[#D9E6E2] font-mono text-[11px]">Alt+R</span> Register
            <span className="rounded bg-white px-1.5 py-0.5 border border-[#D9E6E2] font-mono text-[11px]">Alt+B</span> Book
            <span className="rounded bg-white px-1.5 py-0.5 border border-[#D9E6E2] font-mono text-[11px]">Alt+V</span> Vitals
            <span className="rounded bg-white px-1.5 py-0.5 border border-[#D9E6E2] font-mono text-[11px]">Alt+W</span> Wait
          </div>
        </div>

        {/* Flash banner */}
        {flash && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>{flash}</span>
          </div>
        )}
      </section>

      {/* Reception Action Panels Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Patient Registration */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <QuickPatientRegistration
            form={registrationForm}
            setForm={setRegistrationForm}
            onSubmit={quickRegister}
            loading={registerLoading}
          />
        </div>

        {/* Appointment Booking */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <AppointmentBookingPanel
            form={bookingForm}
            setForm={setBookingForm}
            onSubmit={quickBook}
            loading={bookLoading}
          />
        </div>

        {/* Vitals Entry Panel */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <VitalsEntryPanel
            form={vitalsForm}
            setForm={setVitalsForm}
            onSubmit={saveVitals}
            loading={vitalsLoading}
          />
        </div>

        {/* Queue Status Panel */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <QueueStatusPanel
            appointmentId={statusAppointmentId}
            setAppointmentId={setStatusAppointmentId}
            onMarkWaiting={() => markStatus('waiting')}
            onMarkConsulted={() => markStatus('completed')}
            loading={queueLoading}
          />
        </div>

        {/* Payment Entry Panel */}
        <div className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-2xs md:col-span-2 lg:col-span-2">
          <PaymentEntryPanel
            form={paymentForm}
            setForm={setPaymentForm}
            onSubmit={savePayment}
            loading={paymentLoading}
          />
        </div>
      </div>
    </div>
  );
}
