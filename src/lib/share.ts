/**
 * share.ts — Share sheet, platform-aware.
 *
 * Native (Android/iOS) → @capacitor/share (system share sheet)
 * Web                  → navigator.share → clipboard fallback
 */
import { isNative } from './capacitor';

interface ShareData {
  title: string;
  text?: string;
  url?: string;
}

export const canShare = (): boolean =>
  isNative || (typeof navigator !== 'undefined' && 'share' in navigator);

export async function shareOrCopy(data: ShareData): Promise<boolean> {
  // ── Native share sheet ────────────────────────────────────────────────────
  if (isNative) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title:       data.title,
        text:        data.text,
        url:         data.url,
        dialogTitle: data.title,
      });
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.includes('cancel')) return false;
      // fall through to clipboard
    }
  }

  // ── Web Share API ─────────────────────────────────────────────────────────
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
    }
  }

  // ── Clipboard fallback ────────────────────────────────────────────────────
  const text = [data.title, data.text, data.url].filter(Boolean).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
