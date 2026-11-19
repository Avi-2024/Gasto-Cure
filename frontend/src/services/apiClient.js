import { authStorage } from './authStorage';

const DEFAULT_API_URL = 'http://localhost:8081/api/v1';
const configuredUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  configuredUrl && !configuredUrl.includes(':8080')
    ? configuredUrl
    : DEFAULT_API_URL;

/**
 * Universal API Request Helper
 * Automatically injects Bearer token and X-Clinic-Id header
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, activeClinicId } = {}) {
  const token = authStorage.getAccessToken();
  const clinicId = activeClinicId || localStorage.getItem('clinixpulse_active_clinic_id');

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    ...headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
