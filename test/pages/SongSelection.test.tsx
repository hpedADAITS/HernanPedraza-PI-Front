import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SongSelection } from '@/pages/SongSelection';

describe('SongSelection attendee request form', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the light request card styling by default', () => {
    render(<SongSelection mode="attendee" onNavigate={vi.fn()} />);

    const form = screen.getByText('Request a track').closest('form');
    if (!form) {
      throw new Error('Expected request form to render');
    }

    expect(form.className).toContain(
      'bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfffd_100%)]',
    );
    expect(form.className).toContain('border-slate-900/10');
    expect(form.className).toContain('text-slate-900');

    const submitButton = screen.getByRole('button', { name: 'Suggest Song' });
    expect(submitButton).toBeDisabled();
  });

  it('renders the request card in dark mode and preserves button behavior', () => {
    localStorage.setItem('darkMode', 'true');

    render(<SongSelection mode="attendee" onNavigate={vi.fn()} />);

    const form = screen.getByText('Request a track').closest('form');
    if (!form) {
      throw new Error('Expected request form to render');
    }

    expect(form.className).toContain(
      'bg-[radial-gradient(circle_at_72%_18%,rgba(70,156,255,0.16),transparent_24%),linear-gradient(180deg,#182235_0%,#111827_100%)]',
    );
    expect(form.className).toContain('border-white/10');
    expect(form.className).toContain('text-white');

    const titleInput = screen.getByPlaceholderText('Song title');
    const artistInput = screen.getByPlaceholderText('Artist');
    const submitButton = screen.getByRole('button', { name: 'Suggest Song' });

    expect(titleInput.className).toContain('text-white');
    expect(titleInput.className).toContain('placeholder:text-slate-400');
    expect(artistInput.className).toContain('text-white');
    expect(artistInput.className).toContain('placeholder:text-slate-400');
    expect(submitButton).toBeDisabled();

    fireEvent.change(titleInput, { target: { value: 'Midnight City' } });
    fireEvent.change(artistInput, { target: { value: 'M83' } });

    expect(submitButton).toBeEnabled();
    expect(submitButton.className).toContain('bg-emerald-500');
  });
});
