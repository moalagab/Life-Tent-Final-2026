/**
 * capacitor.ts — Platform detection + native bridge utilities.
 *
 * Uses runtime window.Capacitor check instead of a static import
 * so @capacitor/core is NOT bundled into the web critical path.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cap = (window as any).Capacitor as
  | { isNativePlatform(): boolean; getPlatform(): string; isPluginAvailable(name: string): boolean }
  | undefined;

export const isNative  = typeof cap !== 'undefined' && cap.isNativePlatform();
export const platform  = isNative ? cap!.getPlatform() : 'web';   // 'android' | 'ios' | 'web'
export const isAndroid = platform === 'android';
export const isIOS     = platform === 'ios';
export const isWeb     = !isNative;

/** Safe plugin availability check */
export function isPluginAvailable(name: string): boolean {
  return cap?.isPluginAvailable(name) ?? false;
}

/**
 * convertFileToBase64 — reads a File/Blob as base64 string.
 * Used when passing file data to native plugins.
 */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
}

/**
 * base64ToBlob — converts a base64 string back to a Blob.
 * Used when receiving image data from native camera.
 */
export function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const bytes = atob(base64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
