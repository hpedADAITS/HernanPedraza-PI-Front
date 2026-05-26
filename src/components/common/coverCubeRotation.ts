const fullTurn = Math.PI * 2;

export function getPreviousFrontFacingRotation(rotationY: number) {
  const remainder = ((rotationY % fullTurn) + fullTurn) % fullTurn;
  return rotationY - remainder;
}

export function getTextureTransitionRotation(
  startRotationX: number,
  startRotationY: number,
  progress: number,
) {
  const eased = 1 - (1 - progress) * (1 - progress);
  const endRotationY = getPreviousFrontFacingRotation(startRotationY);

  return {
    x: startRotationX + (0 - startRotationX) * eased,
    y: startRotationY + (endRotationY - startRotationY) * eased,
  };
}
