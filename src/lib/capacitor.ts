/**
 * capacitor.ts — Platform detection + native bridge utilities.
 *
 * Import this instead of checking Capacitor directly so all
 * platform logic is centralised and testable.
 */
import { Capacitor } from '@capacitor/core';

export const platform   = Capacitor.getPlatform();   // 'android' | 'ios' | 'web'
export const isNative   = Capacitor.isNativePlatform();
export const isAndroid  = platform === 'android';
export const isIOS      = platform === 'ios';
export const isWeb      = platform === 'web';

/** Safe plugin availability check */
export function isPluginAvailable(name: string): boolean {
  return Capacitor.isPluginAvailable(name);
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
