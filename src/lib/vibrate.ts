/**
 * Haptic feedback patterns via the Vibration API.
 * Safe to call on devices that don't support it — will silently no-op.
 */

const supported = () => 'vibrate' in navigator;

export const vibrate = {
  /** Short tap — button presses, toggles */
  tap: () => supported() && navigator.vibrate(10),

  /** Success — task complete, habit logged, goal achieved */
  success: () => supported() && navigator.vibrate([30, 40, 80]),

  /** Alert — session end, reminder, due date */
  alert: () => supported() && navigator.vibrate([100, 50, 100]),

  /** Error — form validation failure */
  error: () => supported() && navigator.vibrate([50, 30, 50, 30, 50]),

  /** Long pulse — Pomodoro session complete */
  sessionEnd: () => supported() && navigator.vibrate([200, 100, 200]),
};
