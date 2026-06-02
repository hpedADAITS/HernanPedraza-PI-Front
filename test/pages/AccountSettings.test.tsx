import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AccountSettings } from '@/pages/AccountSettings';
import { disconnectSocket, initSocket } from '@/services/socket';
import { writeStoredJson } from '@/utils/storage';

describe('AccountSettings debug diagnostics', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem('authToken', 'token-123');
    writeStoredJson('currentEvent', { eventId: 'event-1' });
    writeStoredJson('currentParticipant', { _id: 'participant-1' });

    const socket = initSocket('token-123');
    socket.connected = true;
  });

  afterEach(() => {
    disconnectSocket();
  });

  it('shows auth token, event id, participant id, and socket connection state', () => {
    render(<AccountSettings mode="attendee" onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Debug / Diagnostics' }));

    const dialog = screen.getByRole('dialog', { name: 'Debug Info' });

    expect(within(dialog).getByText('Auth Token:')).toBeInTheDocument();
    expect(within(dialog).getByText('Present')).toBeInTheDocument();
    expect(within(dialog).getByText('Event ID:')).toBeInTheDocument();
    expect(within(dialog).getByText('event-1')).toBeInTheDocument();
    expect(within(dialog).getByText('Participant ID:')).toBeInTheDocument();
    expect(within(dialog).getByText('participant-1')).toBeInTheDocument();
    expect(within(dialog).getByText('Socket:')).toBeInTheDocument();
    expect(within(dialog).getByText('Connected')).toBeInTheDocument();
  });
});
