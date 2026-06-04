export type TutorialRole = 'attendee' | 'dj';

const STORAGE_KEY_PREFIX = 'firstTimeTutorialSeen:';

/**
 * Gets the stored tutorial seen flag from localStorage.
 */
function getLocalStorageFlag(role: TutorialRole): boolean {
  return localStorage.getItem(STORAGE_KEY_PREFIX + role) === 'true';
}

/**
 * Sets the tutorial seen flag in localStorage.
 */
function setLocalStorageFlag(role: TutorialRole) {
  localStorage.setItem(STORAGE_KEY_PREFIX + role, 'true');
}

/**
 * Decides whether to show the tutorial.
 * Combines backend flag (dbSeen Tutorial: from API login response) with localStorage.
 * Priority: 1. If dbSeen is true → don't show
 *          2. If dbSeen is false/undefined → fall back to localStorage
 *
 * @param role - The role to check
 * @param dbSeen - Whether user has seen tutorial on backend (from login API)
 * @returns true if tutorial should be shown
 */
export function shouldShowTutorial(role: TutorialRole, dbSeen?: boolean): boolean {
  // Priority 1: Backend says already seen → don't show
  if (dbSeen) return false;

  // Priority 2: Check localStorage
  if (getLocalStorageFlag(role)) return false;

  // Show tutorial, mark as seen in localStorage
  setLocalStorageFlag(role);
  return true;
}

/**
 * Marks tutorial as seen in localStorage only.
 * Used by queueFirstTimeTutorial for backward compatibility.
 */
export function markTutorialAsSeen(role: TutorialRole) {
  setLocalStorageFlag(role);
}

/**
 * Queues tutorial (legacy - now uses shouldShowTutorial with dbSeen).
 * @deprecated Kept for backward compatibility
 */
export function queueFirstTimeTutorial(_role: TutorialRole) {
  // Deprecated: Now handled by shouldShowTutorial with dbSeen parameter
}
