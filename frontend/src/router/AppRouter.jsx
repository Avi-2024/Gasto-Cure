import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AppointmentsPage from '../pages/Appointments/AppointmentsPage';
import PatientsPage from '../pages/Patients/PatientsPage';
import BillingPage from '../pages/Billing/BillingPage';
import PrescriptionsPage from '../pages/Prescriptions/PrescriptionsPage';
import PrescriptionPage from '../pages/Prescriptions/PrescriptionPage';
import MedicinesPage from '../pages/Medicines/MedicinesPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import DoctorProfilePage from '../pages/Doctor/DoctorProfilePage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import ChatPage from '../pages/Chat/ChatPage';
import DoctorDashboardPage from '../pages/Doctor/DoctorDashboardPage';
import ConsultationPage from '../pages/Doctor/ConsultationPage';
import ReceptionistDashboardPage from '../pages/Receptionist/ReceptionistDashboardPage';
import SuperAdminPage from '../pages/Admin/SuperAdminPage';
import PublicBookingPage from '../pages/Public/PublicBookingPage';
import { useAuth } from '../contexts/AuthContext';

/**
 * Directs authenticated users to their role-specific operational workspace.
 */
function RoleHomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  if (user?.role === 'SUPER_ADMIN' || user?.globalRole === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user?.role === 'RECEPTIONIST') return <Navigate to="/reception" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/book/:clinicSlug" element={<PublicBookingPage />} />
      <Route path="/book" element={<PublicBookingPage />} />

      {/* Shared Clinic Operations (All authenticated roles) */}
      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<DoctorProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Doctor & Clinic Owner Clinical Workspaces */}
      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/doctor/consultation" element={<ConsultationPage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/prescription" element={<PrescriptionPage />} />
          <Route path="/prescription/new" element={<PrescriptionPage />} />
          <Route path="/medicines" element={<MedicinesPage />} />
        </Route>
      </Route>

      {/* Reception Desk & Billing Workspaces */}
      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/reception" element={<ReceptionistDashboardPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>
      </Route>

      {/* Clinic Owner & Doctor Configuration */}
      <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Super Admin Control Plane */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<SuperAdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
}

export default AppRouter;
