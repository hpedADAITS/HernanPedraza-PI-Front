import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AttendeeProfileCard,
  DJProfileCard,
} from '@/components/dashboard';

describe('Dashboard profile cards', () => {
  it('renders the DJ saved profile picture when provided', () => {
    render(
      <DJProfileCard
        userName="DJ Nova"
        profilePicture="data:image/png;base64,dj-picture"
        accessCode="PARTY42"
        eventId="event-1"
        onAccessCodeChange={() => {}}
      />,
    );

    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,dj-picture',
    );
  });

  it('renders the attendee saved profile picture when provided', () => {
    render(
      <AttendeeProfileCard
        userName="Bailey"
        djName="Nova"
        profilePicture="data:image/png;base64,bailey-picture"
      />,
    );

    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,bailey-picture',
    );
  });

  it('falls back to the bundled profile image when no picture is saved', () => {
    render(<AttendeeProfileCard userName="Bailey" djName="Nova" />);

    const fallback = screen.getByAltText('Profile');
    expect(fallback.getAttribute('src')).toContain('ProfilePicture');
  });
});
