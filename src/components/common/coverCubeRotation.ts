const fullTurn = Math.PI * 2;

export function getPreviousFrontFacingRotation(rotationY: number) {
  const remainder = ((rotationY % fullTurn) + fullTurn) % fullTurn;
  return rotationY - remainder;
}

export function getNextFrontFacingRotation(rotationY: number) {
  const remainder = ((rotationY % fullTurn) + fullTurn) % fullTurn;
  return rotationY + (fullTurn - remainder);
}

export function getTextureTransitionRotation(
  startRotationX: number,
  startRotationY: number,
  progress: number,
) {
  const eased = 1 - (1 - progress) * (1 - progress);
  const endRotationY = getNextFrontFacingRotation(startRotationY);

  return {
    x: startRotationX + (0 - startRotationX) * eased,
    y: startRotationY + (endRotationY - startRotationY) * eased,
  };
}
