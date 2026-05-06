// @ts-ignore
const VITE_API_URL = import.meta.env?.VITE_API_URL as string | undefined;
export const API_BASE: string = VITE_API_URL
  ? `${VITE_API_URL}`
  : 'http://localhost:5000/api/v1';

let authToken: string | null = null;

// Retrieve token from localStorage
export function loadToken() {
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
}

// Store token in localStorage
export function saveToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

// Clear token
export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// Helper to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API Error');
  }

  return response.json();
}

// Health check endpoint
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/ping/health`);
    if (!response.ok) {
      return { api: false, database: false };
    }
    return response.json();
  } catch {
    return { api: false, database: false };
  }
}

// Load token on module init
loadToken();