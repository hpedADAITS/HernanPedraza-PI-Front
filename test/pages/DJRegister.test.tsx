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
  verifyEmailTokenMock,
  saveTokenMock,
  initSocketMock,
  writeStoredJsonMock,
} = vi.hoisted(() => ({
  authRegisterMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  createEventMock: vi.fn(),
  verifyEmailTokenMock: vi.fn(),
  saveTokenMock: vi.fn(),
  initSocketMock: vi.fn(),
  writeStoredJsonMock: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  __esModule: true,
  authAPI: {
    register: authRegisterMock,
    getCurrentUser: getCurrentUserMock,
    verifyEmailToken: verifyEmailTokenMock,
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
    verifyEmailTokenMock.mockReset();
    saveTokenMock.mockReset();
    initSocketMock.mockReset();
    writeStoredJsonMock.mockReset();
    localStorage.clear();
  });

  it('saves the verified token before creating the event and navigates to the DJ dashboard', async () => {
    const onNavigate = vi.fn();

    // Return non-JWT token to trigger email modal (no debug mode)
    authRegisterMock.mockResolvedValue({
      token: 'registration-token',
      user: {
        id: 'user-1',
        email: 'dj@example.com',
        displayName: 'DJ Test',
        role: 'DJ',
        emailRegistered: false,
        profilePicture: null,
      },
    });
    verifyEmailTokenMock.mockResolvedValue({ data: { token: 'verified-token' } });
    getCurrentUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'dj@example.com',
      displayName: 'DJ Test',
      role: 'DJ',
      emailRegistered: true,
      token: 'verified-token',
    });
    createEventMock.mockResolvedValue({
      id: 'event-1',
      accessCode: 'ABCD1234',
    });

    render(<DJRegister onNavigate={onNavigate} />);

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

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(authRegisterMock).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole('button', { name: /verify email/i }));

    fireEvent.click(await screen.findByRole('button', { name: /create event/i }));

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('dj-dashboard'));
    expect(saveTokenMock).toHaveBeenCalledWith('verified-token');
    expect(createEventMock).toHaveBeenCalledWith(
      "DJ Test's Event",
      'Welcome to your event!',
      expect.any(String),
      expect.any(String),
    );
    expect(initSocketMock).toHaveBeenCalledWith('verified-token');
  });
});