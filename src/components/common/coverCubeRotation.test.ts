import { describe, expect, it } from 'vitest';
import {
  getPreviousFrontFacingRotation,
  getTextureTransitionRotation,
} from './coverCubeRotation';

describe('cover cube texture transition rotation', () => {
  it('returns backward to the previous front-facing Y rotation', () => {
    const startRotationY = Math.PI * 8 + Math.PI / 3;
    const endRotationY = getPreviousFrontFacingRotation(startRotationY);

    expect(endRotationY).toBeCloseTo(Math.PI * 8);
    expect(endRotationY).toBeLessThan(startRotationY);
    expect(startRotationY - endRotationY).toBeCloseTo(Math.PI / 3);
  });

  it('eases texture changes back to the front face before spin state restarts', () => {
    const startRotationX = 0.7;
    const startRotationY = Math.PI * 6 + Math.PI / 2;
    const midpoint = getTextureTransitionRotation(
      startRotationX,
      startRotationY,
      0.5,
    );
    const finished = getTextureTransitionRotation(
      startRotationX,
      startRotationY,
      1,
    );

    expect(midpoint.x).toBeGreaterThan(0);
    expect(midpoint.x).toBeLessThan(startRotationX);
    expect(midpoint.y).toBeLessThan(startRotationY);
    expect(finished.x).toBe(0);
    expect(finished.y).toBeCloseTo(Math.PI * 6);
  });
});
