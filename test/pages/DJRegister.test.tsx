import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Set DEV before importing the component
// @ts-expect-error test controls Vite env branch
import.meta.env.DEV = true;

import { DJRegister } from '@/pages/DJRegister';

const {
  authRegisterMock,
  getCurrentUserMock,
  createEventMock,
  saveTokenMock,
  initSocketMock,
  writeStoredJsonMock,
} = vi.hoisted(() => ({
  authRegisterMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  createEventMock: vi.fn(),
  saveTokenMock: vi.fn(),
  initSocketMock: vi.fn(),
  writeStoredJsonMock: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  __esModule: true,
  authAPI: {
    register: authRegisterMock,
    getCurrentUser: getCurrentUserMock,
    verifyEmailToken: vi.fn(),
  },
  eventsAPI: {
    createEvent: createEventMock,
  },
}));

vi.mock('@/services/api/client', () => ({
  __esModule: true,
  saveToken: saveTokenMock,
}));

vi.mock('@/services/socket', () => ({
  __esModule: true,
  initSocket: initSocketMock,
}));

vi.mock('@/utils/storage', () => ({
  __esModule: true,
  writeStoredJson: writeStoredJsonMock,
}));

vi.mock('@/services/singleUserSession', () => ({
  __esModule: true,
  activateSingleUserSession: vi.fn(),
  suspendNextSingleUserSessionCheck: vi.fn(),
}));

describe('DJRegister page', () => {
  beforeEach(() => {
    authRegisterMock.mockReset();
    getCurrentUserMock.mockReset();
    createEventMock.mockReset();
    saveTokenMock.mockReset();
    initSocketMock.mockReset();
    writeStoredJsonMock.mockReset();
    localStorage.clear();
  });

  it('creates account and navigates to dj-dashboard', async () => {
    const onNavigate = vi.fn();

    // Mock registration with emailVerificationToken to trigger auto-verify flow
    // This bypasses the email modal and goes directly to event setup
    authRegisterMock.mockResolvedValue({
      token: 'registration-token',
      emailVerificationToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.debug.token',
      user: {
        id: 'user-1',
        email: 'dj@example.com',
        displayName: 'DJ Test',
        role: 'DJ',
        emailRegistered: false,
        profilePicture: null,
      },
    });

    createEventMock.mockResolvedValue({
      id: 'event-1',
      accessCode: 'ABCD1234',
    });

    render(<DJRegister onNavigate={onNavigate} />);

    // Fill out the registration form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'dj@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/dj name/i), {
      target: { value: 'DJ Test' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for registration to complete
    await waitFor(() => expect(authRegisterMock).toHaveBeenCalledTimes(1));

    // Wait for the event setup modal to appear (auto-verify succeeds)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /create event/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    // Click create event button
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    // Verify navigation and API calls
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('dj-dashboard'));
    expect(createEventMock).toHaveBeenCalledWith(
      "DJ Test's Event",
      'Welcome to your event!',
      expect.any(String),
      expect.any(String),
    );
    expect(initSocketMock).toHaveBeenCalled();
    expect(writeStoredJsonMock).toHaveBeenCalled();
  });
});
