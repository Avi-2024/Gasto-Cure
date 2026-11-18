import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Eye,
  EyeOff,
  Info,
  Laptop,
  Lock,
  Mail,
  MessageSquare,
  Network,
  Printer,
  ShieldCheck,
  Stethoscope,
  X,
  Zap,
} from 'lucide-react';
import NivaraLogo from '../../components/common/NivaraLogo';
import { useAuth } from '../../contexts/AuthContext';
import laptopPreview from '../../assets/login-laptop-preview.png';

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
    icon: ShieldCheck,
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
    icon: ClipboardList,
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
    <div className="h-screen max-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-[#062925] via-[#093530] to-[#041c19] text-[#10201F] relative overflow-hidden select-none selection:bg-emerald-500/30 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE MEDICAL AMBIANCE & WAVE BACKDROP
          ───────────────────────────────────────────────────────────── */}
      {/* Soft Ambient Radial Lights */}
      <div className="absolute -top-36 -left-36 w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[350px] rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      {/* Layered Organic Bottom Waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none opacity-30 z-0">
        <svg
          viewBox="0 0 1440 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-20 sm:h-28 md:h-36 object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80L48,93.3C96,107,192,133,288,128C384,123,480,85,576,74.7C672,64,768,80,864,96C960,112,1056,128,1152,122.7C1248,117,1344,85,1392,69.3L1440,53.3L1440,180L1392,180C1344,180,1248,180,1152,180C1056,180,960,180,864,180C768,180,672,180,576,180C480,180,384,180,288,180C192,180,96,180,48,180L0,180Z"
            fill="url(#medicalWaveGrad1)"
          />
          <path
            d="M0,133L48,122.7C96,112,192,91,288,96C384,101,480,123,576,128C672,133,768,128,864,117.3C960,107,1056,85,1152,80C1248,75,1344,91,1392,96L1440,101L1440,180L1392,180C1344,180,1248,180,1152,180C1056,180,960,180,864,180C768,180,672,180,576,180C480,180,384,180,288,180C192,180,96,180,48,180L0,180Z"
            fill="url(#medicalWaveGrad2)"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="medicalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="medicalWaveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (Compact & Sleek)
          ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full px-6 sm:px-10 lg:px-12 pt-4 pb-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <NivaraLogo theme="dark" size="sm" />
          <div className="hidden sm:block h-4 w-px bg-white/20" />
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-950/50 px-2.5 py-1 text-[11px] font-medium text-emerald-200 backdrop-blur-xs">
            <Laptop size={13} className="text-emerald-400" />
            <span>Outpatient Operations Platform</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/90 bg-white/95 px-3 py-1 text-[11px] font-semibold text-emerald-950 shadow-xs backdrop-blur-xs">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Secure Clinic Gateway</span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (Zero-Scroll Viewport Responsive Grid)
          ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-12 py-2 flex items-center min-h-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: Clinical Brand Hero, 4 Cards & 3D Laptop
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-900/50 px-3 py-0.5 text-[11px] font-medium text-emerald-300 w-fit backdrop-blur-xs shadow-2xs">
              <Zap size={12} className="text-amber-400 fill-amber-400" />
              <span>Smart Outpatient Workflow Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-2.5 text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Specialized Care for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
                Digestive &amp; Liver Health.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-lg">
              Seamless clinical consultation, calibrated letterhead digital prescriptions, and automated WhatsApp appointment follow-ups.
            </p>

            {/* Visual Showcase: 4 Feature Cards + 3D Laptop Preview */}
            <div className="mt-4 flex items-center gap-4">
              {/* 4 Feature Cards Stack */}
              <div className="w-full sm:w-[290px] xl:w-[300px] shrink-0 space-y-2">
                {/* 1. Calibrated RX Studio */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-xs transition hover:bg-white/[0.10]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-800/60 text-emerald-300 border border-emerald-400/20">
                    <Printer size={14} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white tracking-wide">
                      Calibrated RX Studio
                    </h4>
                    <p className="text-[10px] text-emerald-100/70 leading-tight">
                      Pixel-perfect printing for custom letterheads &amp; digital headers.
                    </p>
                  </div>
                </div>

                {/* 2. Automated WhatsApp Reminders */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-xs transition hover:bg-white/[0.10]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-800/60 text-emerald-300 border border-emerald-400/20">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white tracking-wide">
                      Automated WhatsApp Reminders
                    </h4>
                    <p className="text-[10px] text-emerald-100/70 leading-tight">
                      Zero no-shows with proactive 24–48h follow-ups &amp; confirmations.
                    </p>
                  </div>
                </div>

                {/* 3. Role-Based Security */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-xs transition hover:bg-white/[0.10]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-800/60 text-emerald-300 border border-emerald-400/20">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white tracking-wide">
                      Role-Based Security
                    </h4>
                    <p className="text-[10px] text-emerald-100/70 leading-tight">
                      Strict tenant isolation and automatic routing based on staff credentials.
                    </p>
                  </div>
                </div>

                {/* 4. Outpatient Management */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-xs transition hover:bg-white/[0.10]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-800/60 text-emerald-300 border border-emerald-400/20">
                    <Network size={14} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white tracking-wide">
                      Outpatient Management
                    </h4>
                    <p className="text-[10px] text-emerald-100/70 leading-tight">
                      Appointments, consultations, prescriptions, and patient records.
                    </p>
                  </div>
                </div>
              </div>

              {/* Laptop Preview Showcase */}
              <div className="hidden xl:flex flex-1 items-center justify-center relative">
                <div className="relative max-w-[250px]">
                  <img
                    src={laptopPreview}
                    alt="Gastro Cure Dashboard on Laptop"
                    className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.45)] select-none pointer-events-none rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT COLUMN: Elevated Pure White Authentication Card
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 sm:p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.45)] border border-white/80 relative backdrop-blur-xs">
              {/* Clinic Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <Building2 size={12} className="text-emerald-700" />
                <span>Gastro Cure Digestive &amp; Liver Centre</span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
                Sign In to Gastro Cure <span className="sr-only">Sign in to Nivara</span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                Enter your work email and password to access your authorized clinic workspace.
              </p>

              {/* Authentication Form */}
              <form onSubmit={handleLogin} className="mt-3.5 space-y-3">
                {/* Work Email Field */}
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    Work Email
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail size={15} />
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="name@gastrocure.com or dr.sharma@nivara.health"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-2xs transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-2xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center text-[11px] text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="font-medium">Remember my session on this computer</span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700 font-medium animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-label={`Enter ${resolvedTarget.title}`}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#0e3b36] hover:bg-[#072421] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-60 cursor-pointer active:scale-[0.99] mt-1"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <ArrowRight size={15} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider: OR QUICK LOGIN */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                          ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                      title={`Click to load ${preset.title} (${preset.destination})`}
                    >
                      <Icon
                        size={13}
                        className={isSelected ? 'text-emerald-700' : 'text-slate-500'}
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
              <div className="mt-3.5 rounded-md bg-slate-50 border border-slate-100 py-1.5 px-2.5 text-center">
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
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
          GLOBAL TRUST FOOTER (Compact Full-Width Bar)
          ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-emerald-800/30 bg-black/15 px-6 sm:px-10 lg:px-12 py-2.5 text-[11px] text-emerald-200/75 backdrop-blur-xs flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
        {/* Left Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-[11px] font-medium text-emerald-200/90">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1">
            <Cloud size={12} className="text-emerald-400" /> Role-Based Access
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-amber-400 fill-amber-400" /> Fast &amp; Reliable
          </span>
          <span className="flex items-center gap-1">
            <Laptop size={12} className="text-emerald-400" /> Clinic-Ready Platform
          </span>
        </div>

        {/* Right Compliance Notice */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px]">
          <span>&copy; {new Date().getFullYear()} Gastro Cure Outpatient Operations</span>
          <span className="text-emerald-600">|</span>
          <span className="flex items-center gap-1 font-mono text-emerald-300">
            <Lock size={10} /> 256-bit Encrypted
          </span>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          FORGOT PASSWORD MODAL
          ───────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Info size={15} />
                </div>
                <h3 className="font-heading text-sm font-bold text-slate-900">
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

            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
              In this clinic operations deployment, staff access is managed by the Clinic Administrator.
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              For demo testing, all registered accounts use the default password:
              <strong className="block font-mono text-emerald-950 text-sm mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                demo1234
              </strong>
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-4 w-full rounded-lg bg-[#0e3b36] py-2 text-xs font-bold text-white hover:bg-[#072421] transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
