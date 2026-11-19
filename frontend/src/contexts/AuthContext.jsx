import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authStorage } from '../services/authStorage';
import { decodeJwtPayload, isTokenExpired } from '../utils/jwt';
import { authApi } from '../services/authApi';
import { clinicApi } from '../services/clinicApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(authStorage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState(authStorage.getRefreshToken());

  const jwtPayload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);

  const isAuthenticated = Boolean(accessToken && jwtPayload && !isTokenExpired(jwtPayload));

  // Stored clinics list & active clinic profile
  const [availableClinics, setAvailableClinics] = useState(() => {
    try {
      const saved = localStorage.getItem('clinixpulse_available_clinics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeClinic, setActiveClinic] = useState(() => {
    try {
      const saved = localStorage.getItem('clinixpulse_active_clinic');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const user = useMemo(() => {
    if (!jwtPayload) return null;

    const normalizedRole = jwtPayload.role === 'STAFF' ? 'RECEPTIONIST' : jwtPayload.role;

    return {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      name: jwtPayload.name || (jwtPayload.email ? jwtPayload.email.split('@')[0] : 'User'),
      role: normalizedRole,
      globalRole: jwtPayload.globalRole || normalizedRole,
      clinicId: jwtPayload.clinicId,
      clinicIds: jwtPayload.clinicIds || (jwtPayload.clinicId ? [jwtPayload.clinicId] : []),
      rawRole: jwtPayload.role,
      clinics: availableClinics,
    };
  }, [jwtPayload, availableClinics]);

  const [activeClinicId, setActiveClinicId] = useState(
    () => activeClinic?.id || user?.clinicId || localStorage.getItem('clinixpulse_active_clinic_id') || null
  );

  // Sync activeClinicId when user changes
  useEffect(() => {
    if (user?.clinicId && !activeClinicId) {
      setActiveClinicId(user.clinicId);
      try {
        localStorage.setItem('clinixpulse_active_clinic_id', user.clinicId);
      } catch {}
    }
  }, [user?.clinicId]);

  // Fetch active clinic branding when activeClinicId changes
  useEffect(() => {
    if (!activeClinicId || !accessToken) return;

    let isMounted = true;
    clinicApi
      .getCurrentBranding(activeClinicId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setActiveClinic(res.data);
          try {
            localStorage.setItem('clinixpulse_active_clinic', JSON.stringify(res.data));
          } catch {}
        }
      })
      .catch(() => {
        // Fallback to local default / existing cached clinic profile
      });

    return () => {
      isMounted = false;
    };
  }, [activeClinicId, accessToken]);

  const login = ({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData, activeClinic: clinicData }) => {
    authStorage.setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken || refreshToken);

    const payload = decodeJwtPayload(newAccessToken);
    const resolvedClinicId = clinicData?.id || payload?.clinicId || null;

    setActiveClinicId(resolvedClinicId);
    if (resolvedClinicId) {
      try {
        localStorage.setItem('clinixpulse_active_clinic_id', resolvedClinicId);
      } catch {}
    }

    if (clinicData) {
      setActiveClinic(clinicData);
      try {
        localStorage.setItem('clinixpulse_active_clinic', JSON.stringify(clinicData));
      } catch {}
    }

    if (userData?.clinics) {
      setAvailableClinics(userData.clinics);
      try {
        localStorage.setItem('clinixpulse_available_clinics', JSON.stringify(userData.clinics));
      } catch {}
    }
  };

  const logout = () => {
    authStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setActiveClinicId(null);
    setActiveClinic(null);
    setAvailableClinics([]);
    try {
      localStorage.removeItem('clinixpulse_active_clinic_id');
      localStorage.removeItem('clinixpulse_active_clinic');
      localStorage.removeItem('clinixpulse_available_clinics');
    } catch {}
  };

  const switchClinic = async (targetClinicId) => {
    if (!targetClinicId || targetClinicId === activeClinicId) return;

    try {
      // 1. Call backend to issue a clinic-scoped token
      const res = await authApi.switchClinic({ clinicId: targetClinicId });
      if (res.success && res.data) {
        const { accessToken: nextToken, activeClinic: nextClinic } = res.data;
        authStorage.setTokens({ accessToken: nextToken, refreshToken });
        setAccessToken(nextToken);
        setActiveClinicId(targetClinicId);
        setActiveClinic(nextClinic);

        try {
          localStorage.setItem('clinixpulse_active_clinic_id', targetClinicId);
          localStorage.setItem('clinixpulse_active_clinic', JSON.stringify(nextClinic));
        } catch {}
        return true;
      }
    } catch (err) {
      // Offline fallback: allow switching local clinic context
      setActiveClinicId(targetClinicId);
      try {
        localStorage.setItem('clinixpulse_active_clinic_id', targetClinicId);
      } catch {}
    }
  };

  const updateActiveClinic = (updatedData) => {
    setActiveClinic((prev) => {
      const merged = { ...prev, ...updatedData };
      try {
        localStorage.setItem('clinixpulse_active_clinic', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  const value = {
    isAuthenticated,
    accessToken,
    refreshToken,
    user,
    activeClinicId,
    activeClinic,
    availableClinics,
    login,
    logout,
    switchClinic,
    updateActiveClinic,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      activeClinicId: 'default-clinic',
      activeClinic: null,
      availableClinics: [],
      switchClinic: () => {},
      login: () => {},
      logout: () => {},
      isAuthenticated: false,
      accessToken: null,
    };
  }
  return ctx;
}
