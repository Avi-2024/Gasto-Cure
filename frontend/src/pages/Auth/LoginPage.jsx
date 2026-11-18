import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
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
 * Resolves user identity, role, and landing workspace from credentials.
 * Ensures entering doctor email opens doctor console, receptionist email opens reception desk, etc.
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
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(false);

  // Compute resolved target workspace in real-time based on the entered email
  const resolvedTarget = resolveUserByCredentials(email, selectedRole);
  const currentPreset =
    ROLE_PRESETS.find((p) => p.role === selectedRole) || ROLE_PRESETS[0];

  const handleRoleSelect = (preset) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword(preset.password || 'demo1234');
    setError('');
  };

  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    setError('');
    // Automatically switch role tab when an email from another role is typed
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

      // Navigate to the user's dedicated workspace!
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#F7FAF8] text-[#10201F] selection:bg-[#287C75]/20 selection:text-[#123A3A]">
      {/* Top Brand Bar */}
      <header className="w-full border-b border-[#D9E6E2]/80 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-8 shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <NivaraLogo theme="light" size="md" />
            <span className="hidden sm:inline-block h-4 w-px bg-[#D9E6E2]" />
            <span className="hidden sm:inline-block text-xs font-semibold text-[#4E6460]">
              Gastro Cure Digestive & Liver Centre
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#4E6460]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span>Secure Clinic Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-xl shadow-[#123A3A]/5 sm:p-9">
            {/* Header copy */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/20 bg-[#287C75]/5 px-3 py-1 text-xs font-semibold text-[#287C75]">
                <Activity size={13} />
                Outpatient Operations Platform
              </span>
              <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
                Sign in to Gastro Cure <span className="sr-only">Sign in to Nivara</span>
              </h1>
              <p className="mt-2 text-sm text-[#4E6460]">
                Enter your authorized clinic email and password to launch your personal workspace.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#4E6460]">
                  Select Your Clinical Role
                </label>
                <span className="text-[11px] text-[#7D908C]">Auto-detects from email</span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleRoleSelect(preset)}
                      className={`group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#287C75] bg-[#123A3A] text-white shadow-md ring-2 ring-[#287C75]/20'
                          : 'border-[#D9E6E2] bg-[#F7FAF8] text-[#10201F] hover:border-[#287C75]/50 hover:bg-white'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`transition-colors ${
                          isSelected ? 'text-[#C9A45C]' : 'text-[#287C75] group-hover:text-[#123A3A]'
                        }`}
                      />
                      <span className="mt-1.5 text-xs font-bold leading-tight line-clamp-1">
                        {preset.shortTitle}
                      </span>
                      <span
                        className={`text-[10px] mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-teal-200/90' : 'text-[#7D908C]'
                        }`}
                      >
                        {preset.badge}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A45C] text-[#123A3A] shadow-xs">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Workspace Indicator */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-teal-200/70 bg-teal-50/50 px-3.5 py-2 text-xs">
                <span className="text-[#4E6460] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#287C75]" />
                  <span>Landing Workspace:</span>
                </span>
                <span className="font-semibold text-[#123A3A] flex items-center gap-1.5">
                  <span>{resolvedTarget.title}</span>
                  <span className="font-mono text-[11px] text-[#287C75] bg-white px-1.5 py-0.5 rounded border border-teal-200">
                    ({resolvedTarget.destination})
                  </span>
                  <ArrowRight size={12} className="text-[#287C75]" />
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E6460]"
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
                    placeholder="doctor@gastrocure.com or dr.sharma@nivara.health"
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#4E6460]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('demo1234')}
                    className="text-[11px] font-semibold text-[#287C75] hover:underline"
                    title="Fill demo password"
                  >
                    Use default (demo1234)
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
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
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

              {/* Remember Me & Help toggle */}
              <div className="flex items-center justify-between text-xs text-[#4E6460]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#D9E6E2] text-[#287C75] focus:ring-[#287C75]"
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
                  className="inline-flex items-center gap-1 font-semibold text-[#287C75] hover:underline"
                >
                  <KeyRound size={12} />
                  <span>{showCredentialsHelper ? 'Hide Staff Logins' : 'View Staff Logins'}</span>
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#123A3A] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/25 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Authenticating...' : `Enter ${resolvedTarget.title}`}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Staff Credentials Helper Card */}
            {showCredentialsHelper && (
              <div className="mt-4 rounded-2xl border border-teal-200 bg-[#F7FAF8] p-3.5 text-xs animate-in fade-in duration-150">
                <p className="font-bold text-[#123A3A] flex items-center gap-1.5 mb-2">
                  <Info size={13} className="text-[#287C75]" />
                  <span>Authorized Staff Accounts & Panels:</span>
                </p>
                <div className="space-y-1.5">
                  {ROLE_PRESETS.map((preset) => (
                    <div
                      key={preset.role}
                      onClick={() => handleRoleSelect(preset)}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#D9E6E2] hover:border-[#287C75] cursor-pointer transition"
                    >
                      <div>
                        <p className="font-semibold text-[#10201F]">{preset.title}</p>
                        <p className="font-mono text-[11px] text-[#4E6460]">{preset.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] bg-teal-50 text-[#287C75] px-2 py-0.5 rounded border border-teal-200">
                          {preset.destination}
                        </span>
                        <p className="text-[10px] text-[#7D908C] mt-0.5">Click to auto-fill</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick 1-Click Access for Demos */}
            <div className="mt-6 border-t border-[#D9E6E2] pt-5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">
                Instant 1-Click Demo Login
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 justify-center">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => {
                      handleRoleSelect(preset);
                      const rolePayload = preset.role === 'RECEPTIONIST' ? 'STAFF' : preset.role;
                      const payload = {
                        sub: `usr-${preset.role.toLowerCase()}-1`,
                        email: preset.email,
                        name: preset.title,
                        role: rolePayload,
                        clinicId: 'clinic-1',
                        clinicIds: ['clinic-1', 'clinic-2'],
                        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
                      };
                      const encodedPayload = btoa(JSON.stringify(payload));
                      const fakeToken = `header.${encodedPayload}.signature`;
                      login({ accessToken: fakeToken, refreshToken: 'demo-refresh' });
                      navigate(preset.destination);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#287C75] hover:text-white hover:border-[#287C75] transition cursor-pointer"
                  >
                    <span>{preset.shortTitle}</span>
                    <span className="text-[10px] text-opacity-70">({preset.destination})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trust footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7D908C]">
            <ShieldCheck size={14} className="text-[#287C75]" />
            <span>Protected by Nivara Outpatient Tenant Boundary • Role-Based Access Control</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#D9E6E2]/80 bg-white/80 py-3 text-center text-xs text-[#7D908C]">
        &copy; {new Date().getFullYear()} Gastro Cure Digestive & Liver Centre • Nivara Platform. All rights reserved.
      </footer>
    </div>
  );
}
