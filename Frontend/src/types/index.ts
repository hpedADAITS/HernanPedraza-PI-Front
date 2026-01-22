export type UserRole = 'attendee' | 'dj';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  username: string | null;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
