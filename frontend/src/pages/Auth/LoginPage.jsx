import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import NivaraLogo from '../../components/common/NivaraLogo';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_PRESETS = [
  {
    role: 'DOCTOR',
    title: 'Doctor Console',
    badge: 'Clinical Workflows',
    email: 'dr.sharma@nivara.health',
    destination: '/doctor',
    icon: Stethoscope,
    description: 'Patient queue, consultation studio, and digital Rx generation.',
  },
  {
    role: 'CLINIC_OWNER',
    title: 'Clinic Owner / Admin',
    badge: 'Full Oversight',
    email: 'owner@nivara.health',
    destination: '/dashboard',
    icon: ShieldCheck,
    description: 'Operations analytics, clinic calibration, formulary, and settings.',
  },
  {
    role: 'RECEPTIONIST',
    title: 'Reception Desk',
    badge: 'Front Office',
    email: 'reception@nivara.health',
    destination: '/reception',
    icon: ClipboardList,
    description: 'Fast patient intake, queue triage, appointments, and fee collection.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [email, setEmail] = useState('dr.sharma@nivara.health');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPreset = ROLE_PRESETS.find((p) => p.role === selectedRole) || ROLE_PRESETS[0];

  const handleRoleSelect = (preset) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setError('');
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const rolePayload = selectedRole === 'RECEPTIONIST' ? 'STAFF' : selectedRole;
      const destination = currentPreset.destination;

      const payload = {
        sub: `usr-${selectedRole.toLowerCase()}-1`,
        email: email || currentPreset.email,
        role: rolePayload,
        clinicId: 'clinic-1',
        clinicIds: ['clinic-1', 'clinic-2'],
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12 hours
      };

      const encodedPayload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${encodedPayload}.signature`;

      login({ accessToken: fakeToken, refreshToken: 'refresh-token-session' });
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#F7FAF8] text-[#10201F] selection:bg-[#287C75]/20 selection:text-[#123A3A]">
      {/* Top Brand Bar */}
      <header className="w-full border-b border-[#D9E6E2]/80 bg-white/70 px-4 py-3.5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <NivaraLogo theme="light" size="md" />
          <div className="flex items-center gap-2 text-xs font-medium text-[#4E6460]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span>Secure Clinic Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-xl shadow-[#123A3A]/5 sm:p-10">
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
                Select your clinical role to open your dedicated workspace.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#4E6460]">
                Select Your Role
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleRoleSelect(preset)}
                      className={`group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                        isSelected
                          ? 'border-[#287C75] bg-[#123A3A] text-white shadow-md'
                          : 'border-[#D9E6E2] bg-[#F7FAF8] text-[#10201F] hover:border-[#287C75]/40 hover:bg-white'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`transition-colors ${
                          isSelected ? 'text-[#C9A45C]' : 'text-[#287C75] group-hover:text-[#123A3A]'
                        }`}
                      />
                      <span className="mt-1.5 text-xs font-bold leading-tight line-clamp-1">
                        {preset.title.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[10px] mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-teal-200/80' : 'text-[#7D908C]'
                        }`}
                      >
                        {preset.badge}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A45C] text-[#123A3A]">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Destination preview banner */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-xs">
                <span className="text-[#4E6460]">Landing Workspace:</span>
                <span className="font-semibold text-[#123A3A] flex items-center gap-1">
                  {currentPreset.title} ({currentPreset.destination})
                  <ArrowRight size={12} className="text-[#287C75]" />
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@nivara.health"
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#4E6460]"
                >
                  Password
                </label>
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#7D908C] hover:text-[#10201F] transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#123A3A] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/25 transition disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : `Enter ${currentPreset.title}`}
                <ArrowRight size={16} />
              </button>
            </form>

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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#287C75] hover:text-white hover:border-[#287C75] transition"
                  >
                    <span>{preset.title.split(' ')[0]}</span>
                    <span className="text-[10px] text-opacity-70">({preset.destination})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trust footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7D908C]">
            <ShieldCheck size={14} className="text-[#287C75]" />
            <span>Protected by Nivara Outpatient Tenant Boundary</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#D9E6E2]/80 bg-white/70 py-3 text-center text-xs text-[#7D908C]">
        &copy; {new Date().getFullYear()} Nivara Healthcare Operations. All rights reserved.
      </footer>
    </div>
  );
}
