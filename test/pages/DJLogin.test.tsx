import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DJLogin } from '@/pages/DJLogin';

const {
  authLoginMock,
  getMyActiveEventMock,
  createEventMock,
  initSocketMock,
  writeStoredJsonMock,
} = vi.hoisted(() => ({
  authLoginMock: vi.fn(),
  getMyActiveEventMock: vi.fn(),
  createEventMock: vi.fn(),
  initSocketMock: vi.fn(),
  writeStoredJsonMock: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  authAPI: {
    login: authLoginMock,
  },
  eventsAPI: {
    getMyActiveEvent: getMyActiveEventMock,
    createEvent: createEventMock,
  },
}));

vi.mock('@/services/socket', () => ({
  initSocket: initSocketMock,
}));

vi.mock('@/utils/storage', () => ({
  writeStoredJson: writeStoredJsonMock,
}));

// Mock the new useToast hook - supports both patterns
vi.mock('@/hooks/useToast', () => {
  const mockFn = () => {};
  const mockToastMethods = {
    success: mockFn,
    error: mockFn,
    info: mockFn,
    warning: mockFn,
    promise: mockFn,
  };
  return {
    useToast: () => ({
      ...mockToastMethods,
      toast: mockToastMethods,
    }),
    useToastStore: () => ({
      toasts: [],
      addToast: mockFn,
      removeToast: mockFn,
      clearAll: mockFn,
    }),
  };
});

describe('DJLogin page', () => {
  beforeEach(() => {
    authLoginMock.mockReset();
    getMyActiveEventMock.mockReset();
    createEventMock.mockReset();
    initSocketMock.mockReset();
    writeStoredJsonMock.mockReset();
    localStorage.clear();
  });

  it('blocks login when the password matches the email address', async () => {
    const onNavigate = vi.fn();

    render(<DJLogin onNavigate={onNavigate} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'dj@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'dj@example.com' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(authLoginMock).not.toHaveBeenCalled();
    expect(getMyActiveEventMock).not.toHaveBeenCalled();
    expect(createEventMock).not.toHaveBeenCalled();
    expect(initSocketMock).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.getByText(
      'Your password cannot be the same as your email address.',
    )).toBeInTheDocument();
  });

  it('continues with a normal login when the password is different', async () => {
    const onNavigate = vi.fn();

    authLoginMock.mockResolvedValue({
      user: {
        id: '123',
        email: 'dj@example.com',
        displayName: 'DJ Test',
        profilePicture: null,
      },
      authToken: 'token',
    });
    getMyActiveEventMock.mockResolvedValue(null);
    createEventMock.mockResolvedValue({
      id: 'event-1',
      accessCode: 'ABCD',
    });

    render(<DJLogin onNavigate={onNavigate} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'dj@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'different-password' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(authLoginMock).toHaveBeenCalledWith(
      'dj@example.com',
      'different-password',
    );
    expect(getMyActiveEventMock).toHaveBeenCalledTimes(1);
    expect(createEventMock).toHaveBeenCalledTimes(1);
    expect(initSocketMock).toHaveBeenCalledWith('token');
    expect(onNavigate).toHaveBeenCalledWith('dj-dashboard');
  });
});
