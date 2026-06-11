/**
 * vibrate.ts — Haptic feedback, platform-aware.
 *
 * Native (Android/iOS) → @capacitor/haptics (richer patterns, real engine)
 * Web                  → navigator.vibrate (Vibration API fallback)
 */
import { isNative } from './capacitor';

// Lazy-load to avoid errors on web build
let _haptics: typeof import('@capacitor/haptics') | null = null;
async function getHaptics() {
  if (!_haptics) _haptics = await import('@capacitor/haptics');
  return _haptics;
}

export const vibrate = {
  /** Short tap — button presses, toggles */
  tap: () => {
    if (isNative) {
      getHaptics().then(({ Haptics, ImpactStyle }) =>
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}));
      return;
    }
    navigator.vibrate?.(10);
  },

  /** Success — task complete, habit logged, goal achieved */
  success: () => {
    if (isNative) {
      getHaptics().then(({ Haptics, NotificationType }) =>
        Haptics.notification({ type: NotificationType.Success }).catch(() => {}));
      return;
    }
    navigator.vibrate?.([30, 40, 80]);
  },

  /** Alert — reminder, due date */
  alert: () => {
    if (isNative) {
      getHaptics().then(({ Haptics, ImpactStyle }) =>
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}));
      return;
    }
    navigator.vibrate?.([100, 50, 100]);
  },

  /** Error — form validation failure */
  error: () => {
    if (isNative) {
      getHaptics().then(({ Haptics, NotificationType }) =>
        Haptics.notification({ type: NotificationType.Error }).catch(() => {}));
      return;
    }
    navigator.vibrate?.([50, 30, 50, 30, 50]);
  },

  /** Long pulse — Pomodoro session complete */
  sessionEnd: () => {
    if (isNative) {
      getHaptics().then(async ({ Haptics, NotificationType }) => {
        await Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
        setTimeout(() =>
          Haptics.notification({ type: NotificationType.Success }).catch(() => {}), 350);
      });
      return;
    }
    navigator.vibrate?.([200, 100, 200]);
  },
};
