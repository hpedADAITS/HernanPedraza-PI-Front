const ACTIVE_SESSION_PREFIX = 'activeUserSession:';
const WINDOW_SESSION_ID = crypto.randomUUID();

type StoredUserIdentity = {
  _id?: string;
  id?: string;
  email?: string;
  displayName?: string;
};

function userSessionKey(user: StoredUserIdentity) {
  const id = user._id ?? user.id ?? user.email ?? user.displayName;
  return id ? `${ACTIVE_SESSION_PREFIX}${id}` : null;
}

export function activateSingleUserSession(user: StoredUserIdentity | null | undefined) {
  const key = user ? userSessionKey(user) : null;
  if (!key) return;
  localStorage.setItem(key, WINDOW_SESSION_ID);
}

export function isCurrentUserSessionActive(user: StoredUserIdentity | null | undefined) {
  const key = user ? userSessionKey(user) : null;
  return !key || localStorage.getItem(key) === WINDOW_SESSION_ID;
}

export function onCurrentUserSessionReplaced(
  user: StoredUserIdentity | null | undefined,
  callback: () => void,
) {
  const key = user ? userSessionKey(user) : null;
  if (!key) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key && event.newValue && event.newValue !== WINDOW_SESSION_ID) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
