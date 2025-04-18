import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE, clearToken } from '@/services/api';

const fetchMock = vi.fn();

function mockApiResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response);
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    clearToken();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with null user and no error', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle successful login through the real auth API service', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'ATTENDEE',
    };

    fetchMock.mockResolvedValueOnce(
      await mockApiResponse({
        data: {
          user: mockUser,
          token: 'test-token',
        },
      }),
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.login(
        'test@example.com',
        'password',
      );
      expect(response.user).toEqual(mockUser);
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(localStorage.getItem('authToken')).toBe('test-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login error from the API response body', async () => {
    fetchMock.mockResolvedValueOnce(
      await mockApiResponse(
        {
          error: {
            message: 'Invalid credentials',
          },
        },
        false,
      ),
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(
        result.current.login('wrong@example.com', 'wrong'),
      ).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('should handle successful registration through the real auth API service', async () => {
    const mockUser = {
      id: '124',
      email: 'newuser@example.com',
      displayName: 'New User',
      role: 'ATTENDEE',
    };

    fetchMock.mockResolvedValueOnce(
      await mockApiResponse({
        data: {
          user: mockUser,
          token: 'new-token',
        },
      }),
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.register(
        'newuser@example.com',
        'password123',
        'New User',
      );
      expect(response.user).toEqual(mockUser);
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        role: 'ATTENDEE',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(localStorage.getItem('authToken')).toBe('new-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should clear token and user on logout after a real API logout call', async () => {
    fetchMock
      .mockResolvedValueOnce(
        await mockApiResponse({
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'ATTENDEE',
            },
            token: 'test-token',
          },
        }),
      )
      .mockResolvedValueOnce(await mockApiResponse({ data: { success: true } }));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).not.toBeNull();
    expect(localStorage.getItem('authToken')).toBe('test-token');

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
    });
    expect(fetchMock).toHaveBeenLastCalledWith(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('should expose loading while an API call is pending', async () => {
    let resolveLogin: (response: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveLogin = resolve;
      }),
    );

    const { result } = renderHook(() => useAuth());

    let loginPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      loginPromise = result.current.login('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolveLogin(
      (await mockApiResponse({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'ATTENDEE',
          },
          token: 'token',
        },
      })) as Response,
    );

    await act(async () => {
      await loginPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('should clear a previous error when a later request succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(
        await mockApiResponse(
          {
            error: {
              message: 'First error',
            },
          },
          false,
        ),
      )
      .mockResolvedValueOnce(
        await mockApiResponse({
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'ATTENDEE',
            },
            token: 'token',
          },
        }),
      );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(
        result.current.login('test@example.com', 'wrong'),
      ).rejects.toThrow('First error');
    });

    expect(result.current.error).toBe('First error');

    await act(async () => {
      await result.current.login('test@example.com', 'correct');
    });

    expect(result.current.error).toBeNull();
  });
});
