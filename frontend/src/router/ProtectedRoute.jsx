import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect unauthorized user to their role-specific home panel
    const roleHome =
      user?.role === 'DOCTOR'
        ? '/doctor'
        : user?.role === 'RECEPTIONIST'
        ? '/reception'
        : '/dashboard';
    return <Navigate to={roleHome} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
