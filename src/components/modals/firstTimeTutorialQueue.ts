export type TutorialRole = 'attendee' | 'dj';

const STORAGE_KEY = 'firstTimeTutorialRole:v1';

export function queueFirstTimeTutorial(role: TutorialRole) {
  sessionStorage.setItem(STORAGE_KEY, role);
}

export function consumePendingTutorial(role: TutorialRole) {
  if (sessionStorage.getItem(STORAGE_KEY) !== role) return false;
  sessionStorage.removeItem(STORAGE_KEY);
  return true;
}
