import { cacheManager } from '../cache/cacheManager';
import { removeStoredItem } from '../../utils/storage';

// @ts-ignore
const VITE_API_URL = import.meta.env?.VITE_API_URL as string | undefined;

function buildApiBase(apiUrl?: string) {
  if (!apiUrl) {
    return '/api/v1';
  }

  const trimmedUrl = apiUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api/v1') ? trimmedUrl : `${trimmedUrl}/api/v1`;
}

export const API_BASE: string = buildApiBase(VITE_API_URL);

let authToken: string | null = null;

/* Retrieve token from localStorage */
export function loadToken() {
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
}

function getToken() {
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

/* Store token in localStorage */
export function saveToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

/* Clear token */
export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    removeStoredItem('user');
    removeStoredItem('currentEvent');
    removeStoredItem('currentParticipant');
  }
  clearAllCaches();
}

/* Helper to make API calls */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  /* Add auth token if available */
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'API Error';
    try {
      const error = await response.json();
      errorMessage = error?.error?.message || error?.message || error?.error || 'API Error';
    } catch {
      // Response wasn't valid JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Ignore text errors
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/* Health check endpoint */
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

/* Clear all caches when token changes (logout/login) */
export function clearAllCaches() {
  cacheManager.clear();
}

/* Load token on module init */
loadToken();
