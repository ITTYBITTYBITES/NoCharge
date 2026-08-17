export type ColorId = 'green' | 'blue' | 'amber' | 'rose';

export const INITIAL_PLAYER_COLOR: ColorId = 'green';

/**
 * Return the requested color directly when visual input is available.
 * Blocking input keeps the current color, including during a pause.
 */
export function selectColorDirectly(
  currentColor: ColorId,
  requestedColor: ColorId,
  inputAvailable = true,
): ColorId {
  return inputAvailable ? requestedColor : currentColor;
}
