/**
 * UI messages and strings used throughout the application
 */

export const MESSAGES = {
  /* Authentication */
  AUTH: {
    REGISTER_SUCCESS: 'Account created successfully!',
    LOGIN_SUCCESS: 'Logged in successfully!',
    LOGOUT_SUCCESS: 'Logged out successfully',
    LOGIN_FAILED: 'Invalid email or password',
    INVALID_CREDENTIALS: 'Email or password is incorrect',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    NOT_AUTHENTICATED: 'You must be logged in to access this',
  },

  /* Events */
  EVENTS: {
    CREATE_SUCCESS: 'Event created successfully!',
    JOIN_SUCCESS: 'Joined event successfully!',
    LEAVE_SUCCESS: 'Left event successfully',
    EVENT_NOT_FOUND: 'Event not found',
    INVALID_ACCESS_CODE: 'Invalid event access code',
    EVENT_FULL: 'Event is full. Cannot join.',
    EVENT_ENDED: 'Event has ended',
    EVENT_CANCELLED: 'Event has been cancelled',
  },

  /* Songs */
  SONGS: {
    SUGGEST_SUCCESS: 'Song suggested successfully!',
    SONG_NOT_FOUND: 'Song not found',
    DUPLICATE_SONG: 'This song is already in the queue',
    FREQUENT_SONG_WARNING: "You've already suggested this song recently",
    APPROVE_SUCCESS: 'Song approved!',
    REJECT_SUCCESS: 'Song rejected',
    SKIP_SUCCESS: 'Song skipped',
  },

  /* Participants */
  PARTICIPANTS: {
    KICK_SUCCESS: 'Participant removed',
    COOLDOWN_SET: 'Cooldown applied',
    PREMIUM_UPDATED: 'Premium status updated',
  },

  /* Votes */
  VOTES: {
    VOTE_SUCCESS: 'Vote cast successfully!',
    VOTE_REMOVED: 'Vote removed',
    ALREADY_VOTED: "You've already voted on this song",
  },

  /* Validation */
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email format',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORD_WEAK: 'Password must contain uppercase, lowercase, and numbers',
    NAME_TOO_SHORT: 'Name must be at least 2 characters',
    NAME_TOO_LONG: 'Name must not exceed 50 characters',
    NICKNAME_INVALID:
      'Nickname can only contain letters, numbers, and underscores',
    ACCESS_CODE_INVALID: 'Access code must be 6 alphanumeric characters',
  },

  /* Network/System */
  NETWORK: {
    CONNECTION_ERROR:
      'Unable to connect to server. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    OFFLINE: 'You are offline. Please check your connection.',
  },

  /* General */
  GENERAL: {
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    SUCCESS: 'Success!',
    ERROR: 'Error',
    WARNING: 'Warning',
    INFO: 'Info',
    CONFIRM: 'Are you sure?',
    CANCEL: 'Cancel',
    OK: 'OK',
    RETRY: 'Retry',
    TRY_AGAIN: 'Try Again',
    BACK: 'Back',
    HOME: 'Home',
    SETTINGS: 'Settings',
    PROFILE: 'Profile',
    LOGOUT: 'Logout',
  },

  /* Buttons */
  BUTTONS: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    SUBMIT: 'Submit',
    CANCEL: 'Cancel',
    SAVE: 'Save',
    DELETE: 'Delete',
    EDIT: 'Edit',
    BACK: 'Back',
    NEXT: 'Next',
    SKIP: 'Skip',
    RETRY: 'Retry',
    CLOSE: 'Close',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    REMOVE: 'Remove',
  },
} as const;

/**
 * Get error message based on error type or code
 */
export function getErrorMessage(
  code: string | number,
  defaultMessage?: string,
): string {
  const errorMap: Record<string, string> = {
    VALIDATION_ERROR: MESSAGES.VALIDATION.REQUIRED_FIELD,
    AUTH_ERROR: MESSAGES.AUTH.LOGIN_FAILED,
    NOT_FOUND: MESSAGES.EVENTS.EVENT_NOT_FOUND,
    UNAUTHORIZED: MESSAGES.AUTH.NOT_AUTHENTICATED,
    FORBIDDEN: MESSAGES.AUTH.NOT_AUTHENTICATED,
    CONFLICT: 'This resource already exists',
    SERVER_ERROR: MESSAGES.NETWORK.SERVER_ERROR,
    TIMEOUT: MESSAGES.NETWORK.TIMEOUT,
    NETWORK_ERROR: MESSAGES.NETWORK.CONNECTION_ERROR,
  };

  return errorMap[code.toString()] || defaultMessage || MESSAGES.GENERAL.ERROR;
}

/**
 * Get success message for an action
 */
export function getSuccessMessage(action: string): string {
  const actionMap: Record<string, string> = {
    create: 'Created successfully!',
    update: 'Updated successfully!',
    delete: 'Deleted successfully!',
    save: 'Saved successfully!',
    submit: 'Submitted successfully!',
    join: MESSAGES.EVENTS.JOIN_SUCCESS,
    leave: MESSAGES.EVENTS.LEAVE_SUCCESS,
    login: MESSAGES.AUTH.LOGIN_SUCCESS,
    logout: MESSAGES.AUTH.LOGOUT_SUCCESS,
  };

  return actionMap[action] || MESSAGES.GENERAL.SUCCESS;
}
