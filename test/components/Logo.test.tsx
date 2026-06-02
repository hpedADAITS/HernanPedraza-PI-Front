import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { Logo } from '@/components/common/Logo';

/* Mock the image imports */
vi.mock('@/assets/logo_white.png', () => ({
  default: 'logo_white.png',
}));

vi.mock('@/assets/logo_normal.png', () => ({
  default: 'logo_normal.png',
}));

describe('Logo Component', () => {
  it('should render the logo', () => {
    render(<Logo />);
    const img = screen.getByAltText('Sync Rekuest Logo');
    expect(img).toBeInTheDocument();
  });

  it('should use light variant by default', () => {
    const { container } = render(<Logo variant="light" />);
    const logoContainer = container.querySelector('.flex');
    expect(logoContainer).toBeInTheDocument();
  });

  it('should apply dark variant styles', () => {
    const { container } = render(<Logo variant="dark" />);
    const bgElement = container.querySelector('.bg-slate-900');
    expect(bgElement).toBeInTheDocument();
  });

  it('should position the image layer relative to the logo box', () => {
    const { container } = render(<Logo size="large" />);
    const logoBox = container.querySelector('.relative.overflow-hidden');
    expect(logoBox).toBeInTheDocument();
  });

  it('should use white logo when useWhite is true', () => {
    const { container } = render(<Logo useWhite={true} />);
    expect(container.querySelector('img[src*="logo_white"]')).toBeInTheDocument();
  });

  it('should use normal logo when useWhite is false', () => {
    const { container } = render(<Logo useWhite={false} />);
    expect(container.querySelector('img[src*="logo_normal"]')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Logo className="custom-class" />);
    const logoDiv = container.querySelector('.custom-class');
    expect(logoDiv).toBeInTheDocument();
  });

  it('should render with all variants', () => {
    const variants: Array<'light' | 'dark' | 'color'> = [
      'light',
      'dark',
      'color',
    ];

    variants.forEach((variant) => {
      const { unmount } = render(<Logo variant={variant} />);
      const img = screen.getByAltText('Sync Rekuest Logo');
      expect(img).toBeInTheDocument();
      unmount();
    });
  });

  it('should have select-none class for preventing text selection', () => {
    const { container } = render(<Logo />);
    const logoContainer = container.querySelector('.select-none');
    expect(logoContainer).toBeInTheDocument();
  });

  it('should apply flex and items-center for alignment', () => {
    const { container } = render(<Logo />);
    const logoContainer = container.querySelector('.flex.items-center');
    expect(logoContainer).toBeInTheDocument();
  });
});
