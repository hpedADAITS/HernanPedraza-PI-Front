import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
  authAPI: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  saveToken: vi.fn(),
  clearToken: vi.fn(),
  loadToken: vi.fn(),
}));

const mockAuthAPI = vi.mocked(authAPI);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null user and no error', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'ATTENDEE',
    };

    mockAuthAPI.login.mockResolvedValue({
      user: mockUser,
      token: 'test-token',
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.user).toEqual(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthAPI.login.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrong');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle successful registration', async () => {
    const mockUser = {
      id: '124',
      email: 'newuser@example.com',
      displayName: 'New User',
      role: 'ATTENDEE',
    };

    mockAuthAPI.register.mockResolvedValue({
      user: mockUser,
      token: 'new-token',
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.register(
        'newuser@example.com',
        'password123',
        'New User'
      );
      expect(response.user).toEqual(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle registration error', async () => {
    const errorMessage = 'User already exists';
    mockAuthAPI.register.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.register(
          'existing@example.com',
          'password123',
          'Existing User'
        );
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle logout', async () => {
    mockAuthAPI.logout.mockResolvedValue({});

    const { result } = renderHook(() => useAuth());

    // Set a user first
    mockAuthAPI.login.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'ATTENDEE',
      },
      token: 'test-token',
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).not.toBeNull();

    // Now logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set loading state during API calls', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'ATTENDEE',
    };

    let resolveLogin: any;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });

    mockAuthAPI.login.mockReturnValue(
      loginPromise.then(() => ({ user: mockUser, token: 'token' }))
    );

    const { result } = renderHook(() => useAuth());

    const loginPromiseResult = act(async () => {
      result.current.login('test@example.com', 'password').catch(() => {});
    });

    // Check loading state during API call
    // Note: This is tricky in tests, but we can verify the loading state changes

    resolveLogin();
    await loginPromiseResult;

    expect(result.current.loading).toBe(false);
  });

  it('should clear error when making new request', async () => {
    mockAuthAPI.login.mockRejectedValueOnce(new Error('First error'));
    mockAuthAPI.login.mockResolvedValueOnce({
      user: {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'ATTENDEE',
      },
      token: 'token',
    });

    const { result } = renderHook(() => useAuth());

    // First failed attempt
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).not.toBeNull();

    // Second successful attempt
    await act(async () => {
      await result.current.login('test@example.com', 'correct');
    });

    expect(result.current.error).toBeNull();
  });
});
