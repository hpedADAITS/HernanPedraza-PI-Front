import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { VerifyEmail } from '@/pages/VerifyEmail';

const { verifyEmailTokenMock, writeStoredJsonMock, toastErrorMock } =
  vi.hoisted(() => ({
    verifyEmailTokenMock: vi.fn(),
    writeStoredJsonMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }));

vi.mock('@/services/api', () => ({
  authAPI: {
    verifyEmailToken: verifyEmailTokenMock,
  },
}));

vi.mock('@/utils/storage', () => ({
  writeStoredJson: writeStoredJsonMock,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

describe('VerifyEmail page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    verifyEmailTokenMock.mockReset();
    writeStoredJsonMock.mockReset();
    toastErrorMock.mockReset();
    window.history.pushState({}, '', '/verify-email?verifyEmailToken=test-token');
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('verifies the token, stores the user, and closes the window on success', async () => {
    verifyEmailTokenMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          displayName: 'DJ Test',
          email: 'dj@example.com',
          role: 'DJ',
          emailRegistered: true,
        },
      },
    });

    render(<VerifyEmail />);

    expect(
      screen.getByText(/Please wait while we verify your email/i),
    ).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole('heading', { name: /Email Verified!/i }),
    ).toBeInTheDocument();

    expect(writeStoredJsonMock).toHaveBeenCalledWith('user', {
      id: 'user-123',
      displayName: 'DJ Test',
      email: 'dj@example.com',
      role: 'DJ',
      emailRegistered: true,
    });

    expect(window.close).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(window.close).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
