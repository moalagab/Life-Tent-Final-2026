/**
 * useNativeCamera — Native camera + photo library access.
 *
 * Native → @capacitor/camera (full resolution, system UI)
 * Web    → <input type="file" capture="environment"> fallback
 *
 * Usage:
 *   const { takePhoto, pickFromGallery, isSupported } = useNativeCamera();
 */
import { useCallback } from 'react';
import { isNative } from '@/lib/capacitor';
import { base64ToBlob } from '@/lib/capacitor';

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
  format: string;
}

export function useNativeCamera() {
  const isSupported = isNative || (typeof navigator !== 'undefined');

  const takePhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
    if (!isNative) return null; // caller falls back to <input capture>

    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      await Camera.requestPermissions({ permissions: ['camera'] });

      const photo = await Camera.getPhoto({
        quality:      90,
        allowEditing: false,
        resultType:   CameraResultType.Base64,
        source:       CameraSource.Camera,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      const mimeType = `image/${photo.format ?? 'jpeg'}`;
      const blob     = base64ToBlob(photo.base64String, mimeType);
      const dataUrl  = `data:${mimeType};base64,${photo.base64String}`;

      return { blob, dataUrl, format: photo.format ?? 'jpeg' };
    } catch (err) {
      // User cancelled
      if (err instanceof Error && err.message.toLowerCase().includes('cancel')) return null;
      console.error('[Camera] takePhoto error:', err);
      return null;
    }
  }, []);

  const pickFromGallery = useCallback(async (): Promise<CapturedPhoto | null> => {
    if (!isNative) return null;

    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      await Camera.requestPermissions({ permissions: ['photos'] });

      const photo = await Camera.getPhoto({
        quality:    90,
        resultType: CameraResultType.Base64,
        source:     CameraSource.Photos,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      const mimeType = `image/${photo.format ?? 'jpeg'}`;
      const blob     = base64ToBlob(photo.base64String, mimeType);
      const dataUrl  = `data:${mimeType};base64,${photo.base64String}`;

      return { blob, dataUrl, format: photo.format ?? 'jpeg' };
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('cancel')) return null;
      console.error('[Camera] pickFromGallery error:', err);
      return null;
    }
  }, []);

  return { isSupported, takePhoto, pickFromGallery };
}
