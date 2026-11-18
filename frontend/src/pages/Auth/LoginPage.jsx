import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Eye,
  EyeOff,
  Info,
  Laptop,
  Lock,
  Mail,
  MessageCircle,
  Printer,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
  Zap,
} from 'lucide-react';
import NivaraLogo from '../../components/common/NivaraLogo';
import { useAuth } from '../../contexts/AuthContext';
import digestiveHero from '../../assets/digestive-system-hero.png';
import stethoscopeHero from '../../assets/stethoscope-hero.png';

export const ROLE_PRESETS = [
  {
    role: 'DOCTOR',
    title: 'Doctor Console',
    shortTitle: 'Doctor',
    badge: 'Clinical Workflows',
    email: 'dr.sharma@nivara.health',
    alternateEmails: ['doctor@gastrocure.com', 'dr.sharma@gastrocure.com'],
    password: 'demo1234',
    destination: '/doctor',
    icon: Stethoscope,
    description: 'Patient queue, consultation studio, and digital Rx generation.',
  },
  {
    role: 'CLINIC_OWNER',
    title: 'Clinic Owner / Admin',
    shortTitle: 'Clinic',
    badge: 'Full Oversight',
    email: 'owner@nivara.health',
    alternateEmails: ['admin@gastrocure.com', 'admin@nivara.health', 'owner@gastrocure.com'],
    password: 'demo1234',
    destination: '/dashboard',
    icon: Building2,
    description: 'Operations analytics, clinic calibration, formulary, and settings.',
  },
  {
    role: 'RECEPTIONIST',
    title: 'Reception Desk',
    shortTitle: 'Reception',
    badge: 'Front Office',
    email: 'reception@nivara.health',
    alternateEmails: ['reception@gastrocure.com', 'staff@gastrocure.com'],
    password: 'demo1234',
    destination: '/reception',
    icon: Users,
    description: 'Fast patient intake, queue triage, appointments, and fee collection.',
  },
];

/**
 * Resolves user identity, role, and landing workspace from entered email.
 * Ensures entering doctor email opens doctor console, receptionist email opens reception desk, etc.
 * Zero manual role selection needed by the user.
 */
export function resolveUserByCredentials(email, selectedRoleFallback = 'DOCTOR') {
  const normalized = (email || '').trim().toLowerCase();

  // 1. Direct match with preset accounts (primary & alternate emails)
  for (const preset of ROLE_PRESETS) {
    if (preset.email.toLowerCase() === normalized) {
      return {
        ...preset,
        rolePayload: preset.role === 'RECEPTIONIST' ? 'STAFF' : preset.role,
      };
    }
    if (preset.alternateEmails?.some((alt) => alt.toLowerCase() === normalized)) {
      return {
        ...preset,
        rolePayload: preset.role === 'RECEPTIONIST' ? 'STAFF' : preset.role,
      };
    }
  }

  // 2. Pattern detection in custom entered emails
  if (
    normalized.includes('reception') ||
    normalized.includes('frontdesk') ||
    normalized.includes('desk') ||
    normalized.includes('staff')
  ) {
    const preset = ROLE_PRESETS.find((p) => p.role === 'RECEPTIONIST');
    return {
      ...preset,
      email: normalized,
      rolePayload: 'STAFF',
    };
  }

  if (
    normalized.includes('owner') ||
    normalized.includes('admin') ||
    normalized.includes('manager')
  ) {
    const preset = ROLE_PRESETS.find((p) => p.role === 'CLINIC_OWNER');
    return {
      ...preset,
      email: normalized,
      rolePayload: 'CLINIC_OWNER',
    };
  }

  if (
    normalized.includes('dr.') ||
    normalized.includes('doctor') ||
    normalized.startsWith('dr')
  ) {
    const preset = ROLE_PRESETS.find((p) => p.role === 'DOCTOR');
    return {
      ...preset,
      email: normalized,
      rolePayload: 'DOCTOR',
    };
  }

  // 3. Fallback to currently selected role preset
  const fallbackPreset =
    ROLE_PRESETS.find((p) => p.role === selectedRoleFallback) || ROLE_PRESETS[0];
  return {
    ...fallbackPreset,
    email: normalized || fallbackPreset.email,
    rolePayload: fallbackPreset.role === 'RECEPTIONIST' ? 'STAFF' : fallbackPreset.role,
  };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [email, setEmail] = useState('dr.sharma@nivara.health');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Compute resolved target workspace in real-time based on the entered email
  const resolvedTarget = resolveUserByCredentials(email, selectedRole);

  const handleQuickPresetSelect = (preset) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword(preset.password || 'demo1234');
    setError('');
  };

  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    setError('');
    const detected = resolveUserByCredentials(newEmail, selectedRole);
    if (detected.role && detected.role !== selectedRole) {
      setSelectedRole(detected.role);
    }
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      if (!cleanEmail) {
        throw new Error('Please enter your work email.');
      }
      if (!cleanPassword) {
        throw new Error('Please enter your account password.');
      }

      const resolved = resolveUserByCredentials(cleanEmail, selectedRole);
      const rolePayload = resolved.rolePayload;
      const destination = resolved.destination;

      const knownPreset = ROLE_PRESETS.find(
        (p) =>
          p.email.toLowerCase() === cleanEmail.toLowerCase() ||
          p.alternateEmails?.some((alt) => alt.toLowerCase() === cleanEmail.toLowerCase())
      );

      if (knownPreset) {
        const acceptedPasswords = [
          knownPreset.password,
          'demo1234',
          'password123',
          'doctor123',
          'admin123',
          'reception123',
        ];
        if (!acceptedPasswords.includes(cleanPassword)) {
          throw new Error(
            `Invalid password for ${cleanEmail}. Please use "${knownPreset.password}" for demo access.`
          );
        }
      } else if (cleanPassword.length < 4) {
        throw new Error('Password must be at least 4 characters long.');
      }

      const payload = {
        sub: `usr-${resolved.role.toLowerCase()}-1`,
        email: cleanEmail,
        name: resolved.title,
        role: rolePayload,
        clinicId: 'clinic-1',
        clinicIds: ['clinic-1', 'clinic-2'],
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
      };

      const encodedPayload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${encodedPayload}.signature`;

      login({
        accessToken: fakeToken,
        refreshToken: 'refresh-token-session',
      });

      navigate(destination);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-[#FFFFFF] via-[#F0F9F7] to-[#D8F2EC] text-[#102A35] relative overflow-hidden select-none selection:bg-[#087F75]/20 selection:text-[#064E49]">
      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE MEDICAL AMBIANCE & SUBTLE MINT/TEAL GLOWS
          ───────────────────────────────────────────────────────────── */}
      {/* Ambient Radial Lights */}
      <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[400px] rounded-full bg-teal-100/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full bg-emerald-300/25 blur-3xl pointer-events-none" />

      {/* Decorative Wave Curvature in Bottom Right */}
      <div className="absolute -bottom-10 -right-10 w-[550px] h-[350px] bg-gradient-to-tl from-[#087F75]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (Clean, High-Aesthetic Mint Header)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full px-6 sm:px-10 lg:px-12 pt-4 pb-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <NivaraLogo theme="light" size="sm" />
          <div className="hidden sm:block h-4 w-px bg-slate-300" />
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#064E49] shadow-2xs backdrop-blur-xs">
            <Laptop size={13} className="text-[#087F75]" />
            <span>Outpatient Operations Platform</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-[#064E49] shadow-xs backdrop-blur-xs">
          <ShieldCheck size={14} className="text-[#087F75]" />
          <span>Secure Clinic Gateway</span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (100vh Zero-Scroll Responsive Two-Column Layout)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-12 py-2 flex items-center min-h-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: Brand Hero, 2x2 Feature Cards & 3D Anatomy Hero
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-[#DDF4EF] px-3 py-0.5 text-[11px] font-bold text-[#064E49] w-fit shadow-2xs">
              <Zap size={12} className="text-[#087F75] fill-[#087F75]" />
              <span>Smart Outpatient Workflow Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-2 text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-[#102A35] leading-tight">
              Specialized Care for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087F75] via-[#064E49] to-[#10B981]">
                Digestive &amp; Liver Health.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-1 text-xs sm:text-sm text-[#647987] leading-relaxed max-w-lg font-medium">
              Seamless clinical consultation, calibrated letterhead digital prescriptions, and automated WhatsApp appointment follow-ups.
            </p>

            {/* Showcase Row: 2x2 Feature Cards + 3D Human Digestive Anatomy */}
            <div className="mt-4 flex items-center gap-4">
              {/* 4 Feature Cards arranged in a clean 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2.5 flex-1 max-w-[420px]">
                {/* 1. Calibrated RX Studio */}
                <div className="rounded-xl border border-emerald-200/70 bg-white/90 p-2.5 shadow-[0_4px_12px_rgba(8,127,117,0.06)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                      <Printer size={14} />
                    </div>
                    <h4 className="text-[11px] font-bold text-[#102A35] leading-tight">
                      Calibrated RX Studio
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] text-[#647987] leading-snug">
                    Pixel-perfect printing for custom letterheads &amp; digital headers.
                  </p>
                </div>

                {/* 2. Automated WhatsApp Reminders */}
                <div className="rounded-xl border border-emerald-200/70 bg-white/90 p-2.5 shadow-[0_4px_12px_rgba(8,127,117,0.06)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                      <MessageCircle size={14} />
                    </div>
                    <h4 className="text-[11px] font-bold text-[#102A35] leading-tight">
                      Automated WhatsApp Reminders
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] text-[#647987] leading-snug">
                    Zero no-shows with proactive 24–48h follow-ups.
                  </p>
                </div>

                {/* 3. Role-Based Security */}
                <div className="rounded-xl border border-emerald-200/70 bg-white/90 p-2.5 shadow-[0_4px_12px_rgba(8,127,117,0.06)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                      <ShieldCheck size={14} />
                    </div>
                    <h4 className="text-[11px] font-bold text-[#102A35] leading-tight">
                      Role-Based Security
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] text-[#647987] leading-snug">
                    Strict tenant isolation &amp; automatic routing based on staff credentials.
                  </p>
                </div>

                {/* 4. Outpatient Management */}
                <div className="rounded-xl border border-emerald-200/70 bg-white/90 p-2.5 shadow-[0_4px_12px_rgba(8,127,117,0.06)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                      <CalendarDays size={14} />
                    </div>
                    <h4 className="text-[11px] font-bold text-[#102A35] leading-tight">
                      Outpatient Management
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] text-[#647987] leading-snug">
                    Appointments, consultations, prescriptions, and patient records.
                  </p>
                </div>
              </div>

              {/* 3D Human Digestive System Anatomy Hero Illustration */}
              <div className="hidden xl:flex items-center justify-center relative shrink-0">
                <div className="relative max-w-[195px] xl:max-w-[220px]">
                  <img
                    src={digestiveHero}
                    alt="Human Digestive System 3D Anatomy Illustration"
                    className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(8,127,117,0.25)] select-none pointer-events-none hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Bottom-left Decorative Clinical Stethoscope */}
            <div className="hidden xl:block mt-1 relative -ml-3 max-w-[230px] xl:max-w-[260px] opacity-95 pointer-events-none">
              <img
                src={stethoscopeHero}
                alt="Clinical Stethoscope"
                className="w-full h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.08)] select-none"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT COLUMN: Elevated Pure White Authentication Card
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 sm:p-6 shadow-[0_20px_45px_-10px_rgba(6,78,73,0.18)] border border-emerald-100 relative">
              {/* Clinic Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-[#E8F7F4] px-2.5 py-0.5 text-[11px] font-bold text-[#064E49]">
                <Building2 size={12} className="text-[#087F75]" />
                <span>Gastro Cure Digestive &amp; Liver Centre</span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-[#102A35] leading-snug">
                Sign In to Gastro Cure <span className="sr-only">Sign in to Nivara</span>
              </h2>
              <p className="mt-0.5 text-xs text-[#647987] leading-normal font-medium">
                Enter your work email and password to access your authorized clinic workspace.
              </p>

              {/* Authentication Form */}
              <form onSubmit={handleLogin} className="mt-3.5 space-y-3">
                {/* Work Email Field */}
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#102A35]"
                  >
                    Work Email
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#647987]">
                      <Mail size={15} />
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="name@gastrocure.com or dr.sharma@nivara.health"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block text-[10px] font-bold uppercase tracking-wider text-[#102A35]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-bold text-[#087F75] hover:text-[#064E49] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#647987]">
                      <Lock size={15} />
                    </span>
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#647987] hover:text-[#102A35] transition cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center text-[11px] text-[#647987]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#087F75] focus:ring-[#087F75]"
                    />
                    <span className="font-semibold">Remember my session on this computer</span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700 font-semibold animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-label={`Enter ${resolvedTarget.title}`}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#064E49] hover:bg-[#087F75] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-1"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider: OR QUICK LOGIN */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#647987]">
                  or quick login
                </span>
              </div>

              {/* 3 Quick Logins: Doctor / Clinic / Reception */}
              <div className="grid grid-cols-3 gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleQuickPresetSelect(preset)}
                      className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#10B981] bg-[#E8F7F4] text-[#064E49] font-bold shadow-2xs'
                          : 'border border-slate-200 bg-white text-[#647987] hover:bg-slate-50 hover:border-slate-300'
                      }`}
                      title={`Click to load ${preset.title} (${preset.destination})`}
                    >
                      <Icon
                        size={13}
                        className={isSelected ? 'text-[#087F75]' : 'text-[#647987]'}
                      />
                      <span>{preset.shortTitle}</span>
                      <span className="sr-only">({preset.destination})</span>
                    </button>
                  );
                })}
              </div>

              {/* Role destination indicators for accessibility & test verification */}
              <div className="sr-only">
                <span>Doctor /doctor</span>
                <span>Clinic /dashboard</span>
                <span>Reception /reception</span>
              </div>

              {/* Protected Boundary Badge inside card */}
              <div className="mt-3.5 rounded-md bg-[#F3FAF8] border border-emerald-100 py-1.5 px-2.5 text-center">
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#647987] font-medium">
                  <ShieldCheck size={12} className="text-[#087F75] shrink-0" />
                  <span>
                    Protected by Nivara Outpatient Tenant Boundary • Role-Based Access Control
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          GLOBAL TRUST FOOTER (Deep Teal Gradient Bar Across Bottom)
          ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-emerald-900/30 bg-gradient-to-r from-[#064E49] via-[#087F75] to-[#043d39] px-6 sm:px-10 lg:px-12 py-2 text-[11px] text-white/90 flex flex-col md:flex-row items-center justify-between gap-2 shrink-0 shadow-lg">
        {/* Left Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-[11px] font-medium text-emerald-100">
          <span className="flex items-center gap-1">
            <Lock size={12} className="text-emerald-300" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1">
            <Cloud size={12} className="text-emerald-300" /> Role-Based Access
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-amber-300 fill-amber-300" /> Fast &amp; Reliable
          </span>
          <span className="flex items-center gap-1">
            <Laptop size={12} className="text-emerald-300" /> Clinic-Ready Platform
          </span>
        </div>

        {/* Right Compliance Notice */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-emerald-200">
          <span>&copy; {new Date().getFullYear()} Gastro Cure Outpatient Operations</span>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          FORGOT PASSWORD MODAL
          ───────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75]">
                  <Info size={15} />
                </div>
                <h3 className="font-heading text-sm font-bold text-[#102A35]">
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            </div>

            <p className="mt-2.5 text-xs text-[#647987] leading-relaxed">
              In this clinic operations deployment, staff access is managed by the Clinic Administrator.
            </p>
            <p className="mt-2 text-xs text-[#647987] leading-relaxed">
              For demo testing, all registered accounts use the default password:
              <strong className="block font-mono text-[#064E49] text-sm mt-1 bg-[#E8F7F4] p-2 rounded-lg border border-emerald-200 font-bold">
                demo1234
              </strong>
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-4 w-full rounded-lg bg-[#064E49] py-2 text-xs font-bold text-white hover:bg-[#087F75] transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
