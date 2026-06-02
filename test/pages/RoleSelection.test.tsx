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

    expect(
      screen.getByRole('button', { name: /attendee/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^dj$/i })).toBeInTheDocument();
    expect(screen.getByAltText('SyncRequest')).toBeInTheDocument();
  });

  it('navigates to attendee login once it is ready', async () => {
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

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(onLogoChange).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalledWith('attendee-login');
  });

  it('navigates to DJ login once it is ready', async () => {
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

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(onLogoChange).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalledWith('dj-login');
  });

  it('keeps expanding while the selected login page is loading', async () => {
    const onNavigate = vi.fn();
    const onLogoChange = vi.fn();
    let resolveLogin = () => {};

    render(
      <RoleSelection
        onNavigate={onNavigate}
        logoWhite={false}
        onLogoChange={onLogoChange}
        onPrepareLogin={() =>
          new Promise<void>((resolve) => {
            resolveLogin = resolve;
          })
        }
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /attendee/i }));

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(onNavigate).not.toHaveBeenCalled();

    await act(async () => {
      resolveLogin();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(onLogoChange).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalledWith('attendee-login');
  });
});
