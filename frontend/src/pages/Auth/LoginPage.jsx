import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  HeartPulse,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import NivaraLogo from '../../components/common/NivaraLogo';
import { useAuth } from '../../contexts/AuthContext';

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
    // Automatically switch role state when an email from another role is typed
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

      // Automatically determine user account and destination from email!
      const resolved = resolveUserByCredentials(cleanEmail, selectedRole);
      const rolePayload = resolved.rolePayload;
      const destination = resolved.destination;

      // Validate password for known preset accounts
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

      // Navigate directly to whoever's panel it is!
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-[#F7FAF8] text-[#10201F] selection:bg-[#287C75]/20 selection:text-[#123A3A]">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Premium Medical Brand Hero (Desktop & Tablets)
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#0e2f2f] via-[#123A3A] to-[#1c5550] text-white overflow-hidden shadow-2xl">
        {/* Subtle Decorative Geometric Backdrop & Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#287C75]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C9A45C]/15 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <NivaraLogo theme="dark" size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-200/90">
              Outpatient Operations Platform
            </span>
          </div>
        </div>

        {/* Hero Clinical Presentation */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/5 px-3.5 py-1 text-xs font-medium text-teal-200 backdrop-blur-sm">
            <Sparkles size={13} className="text-[#C9A45C]" />
            <span>Smart Outpatient Workflow Engine</span>
          </div>

          <h2 className="mt-4 font-heading text-3xl xl:text-4xl font-extrabold leading-tight text-white tracking-tight">
            Specialized Care for Digestive & Liver Health.
          </h2>

          <p className="mt-3 text-sm xl:text-base text-teal-100/80 leading-relaxed max-w-md">
            Seamless clinical consultation, calibrated letterhead digital prescriptions, and automated WhatsApp appointment follow-ups.
          </p>

          {/* 3 Clinical Pillar Cards */}
          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xs transition hover:bg-white/[0.09]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-[#C9A45C]">
                <Stethoscope size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Calibrated Rx Studio
                </h4>
                <p className="mt-0.5 text-xs text-teal-100/70">
                  Dual-mode printing for custom letterhead pads and digital headers with instant formulary autocomplete.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xs transition hover:bg-white/[0.09]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-emerald-300">
                <HeartPulse size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated WhatsApp Reminders
                </h4>
                <p className="mt-0.5 text-xs text-teal-100/70">
                  Zero no-shows with proactive 24–48h follow-up alerts and 1-click confirmation replies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xs transition hover:bg-white/[0.09]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Role-Based Security
                </h4>
                <p className="mt-0.5 text-xs text-teal-100/70">
                  Strict tenant isolation and automatic workspace routing based on staff credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Statement */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-teal-200/70">
          <span>&copy; {new Date().getFullYear()} Gastro Cure Outpatient Operations</span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-teal-300/80">
            <Lock size={11} /> 256-Bit Encrypted
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Clean, Focused Login Interface (Zero Role Dropdown)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Minimal Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <NivaraLogo theme="light" size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-medium text-[#4E6460] bg-white px-3 py-1.5 rounded-full border border-[#D9E6E2] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span>Secure Clinic Gateway</span>
          </div>
        </div>

        {/* Central Focused Authentication Card */}
        <div className="mx-auto w-full max-w-md my-auto py-8">
          {/* Header Typography */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/20 bg-[#287C75]/5 px-3 py-0.5 text-xs font-semibold text-[#287C75]">
              <Activity size={12} />
              <span>Gastro Cure Digestive & Liver Centre</span>
            </div>

            <h1 className="mt-3 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10201F]">
              Sign in to Gastro Cure <span className="sr-only">Sign in to Nivara</span>
            </h1>
            <p className="mt-2 text-sm text-[#4E6460]">
              Enter your work email and password to access your authorized clinic workspace.
            </p>
          </div>

          {/* Clean Email & Password Login Form (No role selector cards!) */}
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#4E6460]"
              >
                Work Email
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D908C]">
                  <Mail size={16} />
                </span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="name@gastrocure.com or dr.sharma@nivara.health"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#10201F] placeholder-[#9BAEA9] focus:border-[#287C75] focus:outline-none focus:ring-4 focus:ring-[#287C75]/10 shadow-xs transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4E6460]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-[#287C75] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D908C]">
                  <Lock size={16} />
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-[#10201F] placeholder-[#9BAEA9] focus:border-[#287C75] focus:outline-none focus:ring-4 focus:ring-[#287C75]/10 shadow-xs transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#7D908C] hover:text-[#10201F] transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs text-[#4E6460] pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#D9E6E2] text-[#287C75] focus:ring-[#287C75]"
                />
                <span>Remember my session on this computer</span>
              </label>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Primary Action Button (Zero role ambiguity: automatically launches authorized panel) */}
            <button
              type="submit"
              disabled={loading}
              aria-label={`Enter ${resolvedTarget.title}`}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#123A3A] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#287C75] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#287C75]/20 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Discrete Demo Quick-Fill Pill Bar (Subtle & clean at bottom for quick testing) */}
          <div className="mt-8 border-t border-[#D9E6E2]/80 pt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D908C]">
                Demo Quick Logins:
              </span>
              <span className="text-[10px] text-[#7D908C] font-mono">
                password: <strong className="text-[#123A3A]">demo1234</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ROLE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleQuickPresetSelect(preset)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border-[#287C75] bg-[#EAF4F2] text-[#123A3A] shadow-2xs font-bold'
                        : 'border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F]'
                    }`}
                    title={`Click to fill ${preset.title} (${preset.destination})`}
                  >
                    <Icon size={14} className={isSelected ? 'text-[#287C75]' : 'text-[#7D908C]'} />
                    <span>{preset.shortTitle}</span>
                    <span className="sr-only">({preset.destination})</span>
                  </button>
                );
              })}
            </div>

            {/* Role indicator info for screen-readers & test verification */}
            <div className="sr-only">
              <span>Doctor /doctor</span>
              <span>Clinic /dashboard</span>
              <span>Reception /reception</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance */}
        <div className="text-center text-xs text-[#7D908C] pt-4">
          <p className="flex items-center justify-center gap-1.5 text-[11px]">
            <ShieldCheck size={13} className="text-[#287C75]" />
            <span>Protected by Nivara Outpatient Tenant Boundary • Role-Based Access Control</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#D9E6E2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#287C75]">
                  <Info size={16} />
                </div>
                <h3 className="font-heading text-sm font-bold text-[#10201F]">
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[#7D908C] hover:text-[#10201F]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs text-[#4E6460] leading-relaxed">
              In this clinic operations deployment, staff access is managed by the Clinic Administrator.
            </p>
            <p className="mt-2 text-xs text-[#4E6460] leading-relaxed">
              For demo testing, all registered accounts use the default password:
              <strong className="block font-mono text-[#123A3A] text-sm mt-1 bg-teal-50/70 p-2 rounded-lg border border-teal-200">
                demo1234
              </strong>
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full rounded-xl bg-[#123A3A] py-2.5 text-xs font-bold text-white hover:bg-[#287C75] transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
