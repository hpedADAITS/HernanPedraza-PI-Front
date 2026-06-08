import { cacheManager } from '../cache/cacheManager';
import { removeStoredItem } from '../../utils/storage';

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


type AuthMode = 'attendee' | 'dj';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_TOKEN_KEY_V1 = `${AUTH_TOKEN_KEY}:v1`;

function getCurrentAuthMode(): AuthMode | null {
  if (typeof window === 'undefined') return null;

  const { pathname } = window.location;
  if (pathname.startsWith('/attendee')) return 'attendee';
  if (pathname.startsWith('/dj')) return 'dj';
  return null;
}

function getTokenMode(token: string | null): AuthMode | null {
  const payload = decodeJwtPayload(token) as (JwtSessionPayload & { role?: unknown }) | null;
  const role = typeof payload?.role === 'string' ? payload.role.toLowerCase() : null;

  if (role === 'attendee') return 'attendee';
  if (role === 'dj') return 'dj';
  return null;
}

function scopedAuthTokenKey(mode = getCurrentAuthMode()) {
  return mode ? `${mode}:${AUTH_TOKEN_KEY_V1}` : AUTH_TOKEN_KEY_V1;
}

function scopedLegacyAuthTokenKey(mode = getCurrentAuthMode()) {
  return mode ? `${mode}:${AUTH_TOKEN_KEY}` : AUTH_TOKEN_KEY;
}

function migrateLegacyAuthToken(token: string) {
  const tokenMode = getTokenMode(token);
  const currentMode = getCurrentAuthMode();
  const targetMode = tokenMode ?? currentMode;

  if (targetMode) {
    window.sessionStorage.setItem(scopedAuthTokenKey(targetMode), token);
  } else {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY_V1, token);
  }

  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY_V1);

  return !currentMode || !tokenMode || currentMode === tokenMode ? token : null;
}

/*
 * Auth tokens are stored in sessionStorage under route-scoped keys so DJ and
 * ATTENDEE routes can be open in separate windows without clobbering auth.
 */
function readStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const sessionToken =
    window.sessionStorage.getItem(scopedAuthTokenKey()) ??
    window.sessionStorage.getItem(scopedLegacyAuthTokenKey());
  if (sessionToken) {
    return sessionToken;
  }

  const unscopedSessionToken =
    window.sessionStorage.getItem(AUTH_TOKEN_KEY_V1) ??
    window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (unscopedSessionToken) {
    return migrateLegacyAuthToken(unscopedSessionToken);
  }

  const legacyToken =
    window.localStorage.getItem(AUTH_TOKEN_KEY_V1) ??
    window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (legacyToken) {
    return migrateLegacyAuthToken(legacyToken);
  }

  return null;
}

/* Retrieve token from sessionStorage */
export function loadToken() {
  authToken = readStoredAuthToken();
}

function getToken() {
  authToken = readStoredAuthToken();
  return authToken;
}

/* Retrieve token - exported for external use */
export { getToken };
export { decodeJwtPayload };
export type { JwtSessionPayload };

/* Store token in sessionStorage */
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

    window.sessionStorage.setItem(
      scopedAuthTokenKey(getTokenMode(token) ?? getCurrentAuthMode()),
      token,
    );
    /* Drop any legacy browser-wide token so other tabs don't inherit it. */
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY_V1);
  }
}

/* Clear token */
export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(scopedAuthTokenKey());
    window.sessionStorage.removeItem(scopedLegacyAuthTokenKey());
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY_V1);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY_V1);
    clearStoredSession();
  }
  clearAllCaches();
}

/* Helper to make API calls */
export async function apiCall(
  endpoint: string,
  options: RequestInit & { auth?: boolean; contentType?: string | null } = {},
) {
  const { auth = true, contentType, ...rest } = options;
  const headers: Record<string, string> = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  } else if (contentType !== null) {
    headers['Content-Type'] = 'application/json';
  }

  /* Add auth token if available */
  const token = auth ? getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
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
