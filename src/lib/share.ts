/**
 * Web Share API wrapper.
 * Falls back to clipboard copy when share is not supported.
 */

interface ShareData {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Returns true if the native share sheet is available on this device.
 */
export const canShare = (): boolean =>
  typeof navigator !== 'undefined' && 'share' in navigator;

/**
 * Opens the native share sheet if available, otherwise copies `text` to clipboard.
 * Returns whether the share/copy succeeded.
 */
export async function shareOrCopy(data: ShareData): Promise<boolean> {
  if (canShare()) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      // User cancelled — not an error
      if (err instanceof Error && err.name === 'AbortError') return false;
      // Fall through to clipboard
    }
  }

  // Clipboard fallback
  const text = [data.title, data.text, data.url].filter(Boolean).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
