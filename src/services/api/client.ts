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

type JwtSessionPayload = {
  userId?: unknown;
  sub?: unknown;
  id?: unknown;
  _id?: unknown;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );

  return atob(padded);
}

function decodeJwtPayload(token: string | null): JwtSessionPayload | null {
  if (!token || typeof atob === 'undefined') {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtSessionPayload;
  } catch {
    return null;
  }
}

function normalizeTokenIdentity(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getTokenIdentity(token: string | null) {
  const payload = decodeJwtPayload(token);

  return (
    normalizeTokenIdentity(payload?.userId) ??
    normalizeTokenIdentity(payload?.sub) ??
    normalizeTokenIdentity(payload?.id) ??
    normalizeTokenIdentity(payload?._id)
  );
}

function clearStoredSession() {
  removeStoredItem('user');
  removeStoredItem('currentEvent');
  removeStoredItem('currentParticipant');
}

function shouldClearSessionOnTokenChange(
  previousToken: string | null,
  nextToken: string,
) {
  if (!previousToken || previousToken === nextToken) {
    return false;
  }

  const previousIdentity = getTokenIdentity(previousToken);
  const nextIdentity = getTokenIdentity(nextToken);

  /*
   * If a token changed and either side cannot be decoded, prefer clearing stale
   * UI session state over keeping a possibly wrong user/event/participant.
   */
  return !previousIdentity || !nextIdentity || previousIdentity !== nextIdentity;
}


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

/* Retrieve token - exported for external use */
export { getToken };

/* Store token in localStorage */
export function saveToken(token: string) {
  const previousToken = getToken();
  const shouldClearStoredSession =
    typeof window !== 'undefined' &&
    shouldClearSessionOnTokenChange(previousToken, token);

  authToken = token;

  if (typeof window !== 'undefined') {
    if (shouldClearStoredSession) {
      clearStoredSession();
      clearAllCaches();
    }

    localStorage.setItem('authToken', token);
  }
}

/* Clear token */
export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    clearStoredSession();
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
