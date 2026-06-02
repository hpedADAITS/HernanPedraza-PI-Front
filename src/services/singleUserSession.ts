const ACTIVE_SESSION_PREFIX = 'activeUserSession:';
const WINDOW_SESSION_HEARTBEAT_PREFIX = 'singleUserSession:windowHeartbeat:';
const WINDOW_SESSION_KEY = 'singleUserSession:windowId';
const SESSION_CHECK_SUSPENSION_KEY = 'singleUserSession:skipNextCheck';
const WINDOW_SESSION_HEARTBEAT_TTL_MS = 4000;
const WINDOW_SESSION_HEARTBEAT_INTERVAL_MS = 1000;
const SESSION_CHECK_SUSPENSION_TTL_MS = 30000;
const WINDOW_INSTANCE_ID = crypto.randomUUID();
let windowSessionId =
  sessionStorage.getItem(WINDOW_SESSION_KEY) ?? crypto.randomUUID();
let heartbeatTimer: number | null = null;

sessionStorage.setItem(WINDOW_SESSION_KEY, windowSessionId);

type StoredUserIdentity = {
  _id?: string;
  id?: string;
  email?: string;
  displayName?: string;
};

type WindowSessionHeartbeat = {
  instanceId?: string;
  updatedAt?: number;
};

function windowSessionHeartbeatKey() {
  return `${WINDOW_SESSION_HEARTBEAT_PREFIX}${windowSessionId}`;
}

function getWindowSessionHeartbeat() {
  try {
    return JSON.parse(
      localStorage.getItem(windowSessionHeartbeatKey()) || '{}',
    ) as WindowSessionHeartbeat;
  } catch {
    return {};
  }
}

function writeWindowSessionHeartbeat() {
  localStorage.setItem(
    windowSessionHeartbeatKey(),
    JSON.stringify({ instanceId: WINDOW_INSTANCE_ID, updatedAt: Date.now() }),
  );
}

function isWindowSessionIdInUse() {
  const heartbeat = getWindowSessionHeartbeat();
  return (
    heartbeat.instanceId &&
    heartbeat.instanceId !== WINDOW_INSTANCE_ID &&
    Date.now() - Number(heartbeat.updatedAt || 0) < WINDOW_SESSION_HEARTBEAT_TTL_MS
  );
}

function rotateWindowSessionId() {
  windowSessionId = crypto.randomUUID();
  sessionStorage.setItem(WINDOW_SESSION_KEY, windowSessionId);
}

function releaseWindowSessionHeartbeat() {
  const key = windowSessionHeartbeatKey();
  const heartbeat = getWindowSessionHeartbeat();
  if (heartbeat.instanceId === WINDOW_INSTANCE_ID) {
    localStorage.removeItem(key);
  }
}

function ensureUniqueWindowSessionId() {
  if (isWindowSessionIdInUse()) {
    rotateWindowSessionId();
  }

  writeWindowSessionHeartbeat();

  if (heartbeatTimer === null) {
    heartbeatTimer = window.setInterval(
      writeWindowSessionHeartbeat,
      WINDOW_SESSION_HEARTBEAT_INTERVAL_MS,
    );
    window.addEventListener('pagehide', releaseWindowSessionHeartbeat);
  }
}

function userSessionKey(user: StoredUserIdentity) {
  const id = user._id ?? user.id ?? user.email ?? user.displayName;
  return id ? `${ACTIVE_SESSION_PREFIX}${id}` : null;
}

export function activateSingleUserSession(user: StoredUserIdentity | null | undefined) {
  ensureUniqueWindowSessionId();
  const key = user ? userSessionKey(user) : null;
  if (!key) return;
  localStorage.setItem(key, windowSessionId);
}

export function suspendNextSingleUserSessionCheck() {
  const expiresAt = String(Date.now() + SESSION_CHECK_SUSPENSION_TTL_MS);
  sessionStorage.setItem(SESSION_CHECK_SUSPENSION_KEY, expiresAt);
  localStorage.setItem(SESSION_CHECK_SUSPENSION_KEY, expiresAt);
}

export function consumeSingleUserSessionCheckSuspension() {
  const expiresAt = Number(
    sessionStorage.getItem(SESSION_CHECK_SUSPENSION_KEY) ??
      localStorage.getItem(SESSION_CHECK_SUSPENSION_KEY) ??
      0,
  );
  sessionStorage.removeItem(SESSION_CHECK_SUSPENSION_KEY);
  localStorage.removeItem(SESSION_CHECK_SUSPENSION_KEY);
  return expiresAt > Date.now();
}

export function isCurrentUserSessionActive(user: StoredUserIdentity | null | undefined) {
  ensureUniqueWindowSessionId();
  const key = user ? userSessionKey(user) : null;
  return !key || localStorage.getItem(key) === windowSessionId;
}

export function onCurrentUserSessionReplaced(
  user: StoredUserIdentity | null | undefined,
  callback: () => void,
) {
  const key = user ? userSessionKey(user) : null;
  if (!key) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key && event.newValue && event.newValue !== windowSessionId) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
