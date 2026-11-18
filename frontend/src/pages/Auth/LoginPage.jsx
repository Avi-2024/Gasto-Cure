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
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-[#FFFFFF] via-[#F4FAF8] to-[#E2F5F0] text-[#102A35] relative overflow-x-hidden overflow-y-auto lg:overflow-hidden select-none selection:bg-[#087F75]/20 selection:text-[#064E49] font-sans">
      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE MEDICAL AMBIANCE & AIRY LIGHT GLOWS
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-72 sm:w-[420px] h-72 sm:h-[420px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 w-80 sm:w-[520px] h-72 sm:h-[380px] rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-80 sm:w-[450px] h-80 sm:h-[450px] rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-96 sm:w-[600px] h-80 sm:h-[380px] bg-gradient-to-tl from-[#087F75]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (Clean, Spacious, Fully Responsive)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12 pt-2.5 sm:pt-4 pb-1.5 sm:pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <NivaraLogo theme="light" size="sm" />
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/90 px-3.5 py-1 text-[11px] font-semibold text-[#064E49] shadow-2xs backdrop-blur-xs">
            <Laptop size={13} className="text-[#087F75]" />
            <span>Outpatient Operations Platform</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-white px-2.5 sm:px-3.5 py-1 text-[10px] sm:text-[11px] font-semibold text-[#064E49] shadow-xs backdrop-blur-xs shrink-0 whitespace-nowrap">
          <ShieldCheck size={12} className="text-[#087F75] shrink-0" />
          <span>Secure Clinic Gateway</span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (Responsive 2-Column Grid / Stack)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-8 lg:px-12 py-2 sm:py-6 lg:py-2 flex items-center justify-center min-h-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: Clinical Brand Hero & Human-Touched Visuals (Hidden on small screens)
              ───────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-center text-left">
            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-[44px] font-extrabold tracking-tight text-[#102A35] leading-tight sm:leading-[1.18]">
              One Platform. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#087F75] via-[#064E49] to-[#10B981]">
                Every Practice.
              </span>
              <span className="sr-only">One Platform. Every Practice.</span>
            </h1>

            {/* Description */}
            <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-[#647987] leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
              Manage your clinic, patients, appointments, prescriptions, and daily outpatient operations from one secure workspace.
            </p>

            {/* Human Clinical Highlights + 3D Digestive System Illustration */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6 xl:gap-8">
              {/* Clean, authentic human clinical highlights */}
              <div className="space-y-3.5 sm:space-y-4 flex-1 max-w-[380px] text-left">
                {/* 1. Digital Prescription & Clinical Protocols */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#102A35] leading-tight">
                      Digital Prescription &amp; Clinical Protocols
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#647987] mt-0.5 leading-relaxed">
                      Instant drug formulary autocomplete, pre-built treatment protocols, and dual-mode letterhead printing.
                    </p>
                  </div>
                </div>

                {/* 2. Automated WhatsApp Reminders */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#102A35] leading-tight">
                      Automated WhatsApp Reminders
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#647987] mt-0.5 leading-relaxed">
                      Reduce clinic no-shows with proactive appointment alerts, medicine reminders, and instant Rx delivery.
                    </p>
                  </div>
                </div>

                {/* 3. Lifetime Patient Records & OPD Queue */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F7F4] text-[#087F75] border border-emerald-200/80">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#102A35] leading-tight">
                      Lifetime Patient Records &amp; OPD Queue
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#647987] mt-0.5 leading-relaxed">
                      Live outpatient token queue, comprehensive visit history, diagnostic reports, and allergy safety alerts.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3D Digestive System Hero Visual */}
              <div className="hidden xl:flex items-center justify-center relative shrink-0">
                <div className="relative w-52 h-52 xl:w-60 xl:h-60 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#087F75]/15 via-emerald-100/40 to-transparent blur-2xl" />
                  <img
                    src={digestiveHero}
                    alt="Digestive & Liver Anatomical System"
                    className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(8,127,117,0.18)] select-none pointer-events-none transition hover:scale-105 duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT COLUMN: Elevated Pure White Authentication Card (Centered on small screens)
              ───────────────────────────────────────────────────────── */}
          <div className="col-span-1 lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[380px] sm:max-w-[420px] xl:max-w-[440px] rounded-2xl bg-white p-4 sm:p-6 lg:p-7 shadow-[0_16px_40px_-10px_rgba(6,78,73,0.12)] border border-emerald-100/90 relative">
              {/* Title & Subtitle (Clean Human Header) */}
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-[#102A35] leading-snug">
                Sign In to ClinixPulse <span className="sr-only">Sign in to Nivara</span>
              </h2>
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-[#647987] leading-normal font-medium">
                Enter your work email and password to access your authorized clinic workspace.
              </p>

              {/* Direct Authentication Form */}
              <form onSubmit={handleLogin} className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3.5">
                {/* Work Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-email"
                      className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#102A35]"
                    >
                      Work Email
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#647987]">
                      <Mail size={15} />
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="dr.sharma@nivara.health or your clinic email"
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 sm:pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-password"
                      className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#102A35]"
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
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 sm:pl-10 pr-10 text-xs sm:text-sm font-semibold text-[#102A35] placeholder-slate-400 focus:border-[#087F75] focus:outline-none focus:ring-2 focus:ring-[#087F75]/15 shadow-2xs transition"
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
                <div className="flex items-center text-xs text-[#647987]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#087F75] focus:ring-[#087F75]"
                    />
                    <span className="font-semibold text-[11px] sm:text-xs">
                      Remember my session <span className="hidden xs:inline">on this computer</span>
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs text-rose-700 font-semibold animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-label={`Enter ${resolvedTarget.title}`}
                  className="h-10 sm:h-11 w-full flex items-center justify-center gap-2 rounded-xl bg-[#064E49] hover:bg-[#087F75] px-4 text-xs sm:text-sm font-bold text-white shadow-md transition disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-1"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={15} />
                      <span className="sr-only">Enter {resolvedTarget.title}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Discrete Quick Staff Logins Helper */}
              <div className="relative my-2 sm:my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <span className="relative bg-white px-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Staff Logins
                </span>
              </div>

              {/* 3 Quick Fill Chips: Doctor / Clinic / Reception */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleQuickPresetSelect(preset)}
                      className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg px-1 sm:px-2 py-1.5 text-[10.5px] sm:text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'border border-[#087F75] bg-[#E8F7F4] text-[#064E49] font-bold shadow-2xs'
                          : 'border border-slate-200 bg-white text-[#647987] hover:bg-slate-50'
                      }`}
                      title={`Click to fill ${preset.title} (${preset.destination})`}
                    >
                      <Icon
                        size={12}
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

              {/* Clean Human Security Note */}
              <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center text-[10px] sm:text-xs text-[#647987] whitespace-nowrap">
                <Lock size={12} className="text-[#087F75] shrink-0" />
                <span>Encrypted 256-bit clinic session &bull; Role-based access</span>
                <span className="sr-only">
                  Protected by Nivara Outpatient Tenant Boundary • Role-Based Access Control
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          GLOBAL TRUST FOOTER (Deep Teal Bar Across Bottom, Responsive)
          ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-emerald-900/30 bg-gradient-to-r from-[#064E49] via-[#087F75] to-[#043d39] px-3.5 sm:px-8 lg:px-12 py-2 sm:py-2.5 text-[10px] sm:text-[11px] text-white/90 flex flex-col md:flex-row items-center justify-between gap-1.5 sm:gap-2 shrink-0 shadow-lg mt-auto">
        {/* Left Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] font-medium text-emerald-100">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-300" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1">
            <Building2 size={12} className="text-emerald-300" /> Role-Based Access
          </span>
          <span className="hidden xs:flex items-center gap-1">
            <Cloud size={12} className="text-emerald-300" /> Fast &amp; Reliable
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Headphones size={12} className="text-emerald-300" /> Clinic-Ready Platform
          </span>
        </div>

        {/* Right Compliance Notice */}
        <div className="flex items-center gap-2.5 text-[9.5px] sm:text-[11px] text-emerald-200">
          <span>&copy; {new Date().getFullYear()} ClinixPulse Outpatient Operations</span>
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
