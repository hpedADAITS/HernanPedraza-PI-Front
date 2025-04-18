import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { RoleSelection } from '@/pages/RoleSelection';

describe('RoleSelection page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders both entry points for the user journey', () => {
    render(
      <RoleSelection
        onNavigate={vi.fn()}
        logoWhite={false}
        onLogoChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /attendee/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^dj$/i })).toBeInTheDocument();
    expect(screen.getByAltText('SyncRequest')).toBeInTheDocument();
  });

  it('navigates to attendee login after choosing Attendee', () => {
    const onNavigate = vi.fn();
    const onLogoChange = vi.fn();

    render(
      <RoleSelection
        onNavigate={onNavigate}
        logoWhite={false}
        onLogoChange={onLogoChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /attendee/i }));

    expect(onNavigate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(onLogoChange).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalledWith('attendee-login');
  });

  it('navigates to DJ login after choosing DJ', () => {
    const onNavigate = vi.fn();
    const onLogoChange = vi.fn();

    render(
      <RoleSelection
        onNavigate={onNavigate}
        logoWhite={false}
        onLogoChange={onLogoChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^dj$/i }));

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(onLogoChange).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalledWith('dj-login');
  });
});
