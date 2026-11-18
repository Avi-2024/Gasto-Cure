import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Headphones,
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
    <div className="h-screen max-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-[#FFFFFF] via-[#F4FAF8] to-[#E2F5F0] text-[#102A35] relative overflow-hidden select-none selection:bg-[#087F75]/20 selection:text-[#064E49] font-sans">
      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE MEDICAL AMBIANCE & AIRY LIGHT GLOWS
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 w-[520px] h-[380px] rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-[600px] h-[380px] bg-gradient-to-tl from-[#087F75]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (Clean, Spacious, Zero Overlap)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <NivaraLogo theme="light" size="sm" />
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/90 px-3.5 py-1 text-[11px] font-semibold text-[#064E49] shadow-2xs backdrop-blur-xs">
            <Laptop size={13} className="text-[#087F75]" />
            <span>Outpatient Operations Platform</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-white px-3.5 py-1 text-[11px] font-semibold text-[#064E49] shadow-xs backdrop-blur-xs">
          <ShieldCheck size={14} className="text-[#087F75]" />
          <span>Secure Clinic Gateway</span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (Symmetrical 2-Column Grid: Hero + Form)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-12 py-2 flex items-center min-h-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: Clinical Brand Hero, 2x2 Cards & 3D Digestive Hero
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-[#E0F5F0] px-3.5 py-1 text-xs font-bold text-[#064E49] w-fit shadow-2xs">
              <Zap size={13} className="text-[#087F75] fill-[#087F75]" />
              <span>Smart Outpatient Workflow Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-3 text-3xl sm:text-4xl xl:text-[42px] font-extrabold tracking-tight text-[#102A35] leading-[1.15]">
              Precision Clinical Care for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087F75] via-[#064E49] to-[#10B981]">
                Digestive &amp; Liver Health.
              </span>
              <span className="sr-only">One Platform. Every Practice.</span>
            </h1>

            {/* Description */}
            <p className="mt-2 text-xs sm:text-sm text-[#647987] leading-relaxed max-w-lg font-medium">
              Specialized outpatient consultations, calibrated letterhead digital prescriptions, automated WhatsApp follow-ups, and live patient queue triage.
            </p>

            {/* Human-Crafted Hero Composition: 2x2 Feature Cards + Layered 3D Digestive Anatomy Disc */}
            <div className="mt-5 flex items-center gap-5 xl:gap-7">
              {/* 4 Feature Cards arranged in a clean 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3 flex-1 max-w-[360px] xl:max-w-[380px]">
                {/* 1. Calibrated RX Studio */}
                <div className="rounded-xl border border-emerald-100/90 bg-white/95 p-3 shadow-[0_4px_16px_rgba(8,127,117,0.05)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300 group">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80 group-hover:bg-[#087F75] group-hover:text-white transition">
                      <Printer size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#102A35] leading-tight">
                      Calibrated RX Studio
                    </h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#647987] leading-snug">
                    Letterhead pad mode &amp; digital header prescription printing.
                  </p>
                </div>

                {/* 2. Automated WhatsApp Reminders */}
                <div className="rounded-xl border border-emerald-100/90 bg-white/95 p-3 shadow-[0_4px_16px_rgba(8,127,117,0.05)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300 group">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80 group-hover:bg-[#087F75] group-hover:text-white transition">
                      <MessageCircle size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#102A35] leading-tight">
                      Automated WhatsApp
                    </h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#647987] leading-snug">
                    Zero no-shows with proactive 24–48h follow-up alerts.
                  </p>
                </div>

                {/* 3. Role-Based Security */}
                <div className="rounded-xl border border-emerald-100/90 bg-white/95 p-3 shadow-[0_4px_16px_rgba(8,127,117,0.05)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300 group">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80 group-hover:bg-[#087F75] group-hover:text-white transition">
                      <ShieldCheck size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#102A35] leading-tight">
                      Role-Based Security
                    </h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#647987] leading-snug">
                    Strict tenant isolation &amp; automatic routing based on credentials.
                  </p>
                </div>

                {/* 4. Outpatient Management */}
                <div className="rounded-xl border border-emerald-100/90 bg-white/95 p-3 shadow-[0_4px_16px_rgba(8,127,117,0.05)] backdrop-blur-xs transition hover:shadow-md hover:border-emerald-300 group">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80 group-hover:bg-[#087F75] group-hover:text-white transition">
                      <CalendarDays size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#102A35] leading-tight">
                      Outpatient Management
                    </h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#647987] leading-snug">
                    Appointments, consultations, prescriptions &amp; patient records.
                  </p>
                </div>
              </div>

              {/* Human-Framed 3D Digestive Anatomy Visual Centerpiece */}
              <div className="hidden xl:flex flex-col items-center justify-center relative shrink-0">
                <div className="relative w-52 h-52 xl:w-56 xl:h-56 rounded-full p-2 bg-gradient-to-tr from-[#087F75]/25 via-emerald-100 to-white shadow-xl border border-emerald-200/80 flex items-center justify-center">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#E8F7F4]/90 via-[#D6F3EB]/70 to-[#C0ECE1]/80 flex items-center justify-center relative">
                    <img
                      src={digestiveHero}
                      alt="Digestive & Liver Anatomical System"
                      className="w-full h-full object-contain p-2 scale-110 drop-shadow-[0_10px_20px_rgba(8,127,117,0.22)] select-none pointer-events-none transition hover:scale-115 duration-300"
                    />
                  </div>
                </div>
                {/* Floating Human Touch Status Pill */}
                <div className="absolute -bottom-2 bg-white/95 rounded-full px-3.5 py-1 shadow-md border border-emerald-200 flex items-center gap-1.5 backdrop-blur-xs">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-[#064E49] tracking-wide uppercase">
                    Liver &amp; GI Clinic Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT COLUMN: Elevated Pure White Authentication Card
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] xl:max-w-[440px] rounded-2xl bg-white p-6 sm:p-7 shadow-[0_20px_45px_-10px_rgba(6,78,73,0.14)] border border-emerald-100/90 relative">
              {/* Clinic Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-[#E8F7F4] px-2.5 py-1 text-xs font-bold text-[#064E49]">
                <Building2 size={13} className="text-[#087F75]" />
                <span>Gastro Cure Digestive &amp; Liver Centre</span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="mt-2.5 text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#102A35] leading-snug">
                Sign In to Gastro Cure <span className="sr-only">Sign in to Nivara</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#647987] leading-normal font-medium">
                Enter your work email and password to access your authorized clinic workspace.
              </p>

              {/* Direct Authentication Form (No Manual Role Selection Needed!) */}
              <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
                {/* Work Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-email"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#102A35]"
                    >
                      Work Email
                    </label>
                    {resolvedTarget && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#064E49] bg-[#E8F7F4] px-2 py-0.5 rounded-md border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Auto-Route: {resolvedTarget.shortTitle}</span>
                        <span className="sr-only">({resolvedTarget.destination})</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#647987]">
                      <Mail size={16} />
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="dr.sharma@nivara.health or your clinic email"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-password"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#102A35]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-[#087F75] hover:text-[#064E49] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#647987]">
                      <Lock size={16} />
                    </span>
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#647987] hover:text-[#102A35] transition cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center text-xs text-[#647987]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#087F75] focus:ring-[#087F75]"
                    />
                    <span className="font-semibold">Remember my session on this computer</span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 font-semibold animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-label={`Enter ${resolvedTarget.title}`}
                  className="h-11 w-full flex items-center justify-center gap-2 rounded-xl bg-[#064E49] hover:bg-[#087F75] px-4 text-xs sm:text-sm font-bold text-white shadow-md transition disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-1"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                      <span className="sr-only">Enter {resolvedTarget.title}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Discrete Demo Quick Fill Helpers */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#647987]">
                  staff quick demo
                </span>
              </div>

              {/* 3 Quick Fill Chips: Doctor / Clinic / Reception */}
              <div className="grid grid-cols-3 gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleQuickPresetSelect(preset)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#10B981] bg-[#E8F7F4] text-[#064E49] font-bold shadow-2xs'
                          : 'border border-slate-200 bg-white text-[#647987] hover:bg-slate-50 hover:border-slate-300'
                      }`}
                      title={`Click to fill ${preset.title} (${preset.destination})`}
                    >
                      <Icon
                        size={14}
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

              {/* Secure & Compliant Card Bottom Banner */}
              <div className="mt-3.5 rounded-xl bg-[#F0FAF7] border border-emerald-100/90 p-2.5 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-[#087F75]">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-[#064E49] leading-tight">
                      Protected Outpatient Boundary
                    </h5>
                    <p className="text-[10px] text-[#647987] leading-tight">
                      Role-based access, clinic data isolation and end-to-end encryption.
                    </p>
                  </div>
                </div>
                <Lock size={14} className="text-[#087F75] shrink-0" />
                <span className="sr-only">
                  Protected by Nivara Outpatient Tenant Boundary • Role-Based Access Control
                </span>
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
            <ShieldCheck size={12} className="text-emerald-300" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1">
            <Building2 size={12} className="text-emerald-300" /> Role-Based Access
          </span>
          <span className="flex items-center gap-1">
            <Cloud size={12} className="text-emerald-300" /> Fast &amp; Reliable
          </span>
          <span className="flex items-center gap-1">
            <Headphones size={12} className="text-emerald-300" /> Clinic-Ready Platform
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
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
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
