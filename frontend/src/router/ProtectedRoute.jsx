import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = user?.role || user?.globalRole;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
    // Redirect unauthorized user to their role-specific home panel
    const roleHome =
      userRole === 'DOCTOR'
        ? '/doctor'
        : userRole === 'RECEPTIONIST'
        ? '/reception'
        : userRole === 'SUPER_ADMIN'
        ? '/admin'
        : '/dashboard';
    return <Navigate to={roleHome} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
