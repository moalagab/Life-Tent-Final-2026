/**
 * FileUploadButton — reusable file-picker + upload button.
 * Uses useFileUpload under the hood. Drop it anywhere a file attachment is needed.
 *
 * Usage:
 *   <FileUploadButton bucket="attachments" onUploaded={(file) => setUrl(file.url)} />
 *
 *   // With camera capture (mobile):
 *   <FileUploadButton bucket="media" accept="image/*" allowCamera onUploaded={...} />
 */
import { useRef } from 'react';
import { Paperclip, Camera, Loader2, X, Image } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { useFileUpload, type StorageBucket, type UploadedFile } from '@/hooks/useFileUpload';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { isNative } from '@/lib/capacitor';
import { cn } from '@/lib/utils';

interface FileUploadButtonProps {
  bucket: StorageBucket;
  accept?: string;
  maxSize?: number;
  onUploaded?: (file: UploadedFile) => void;
  onRemoved?: (path: string) => void;
  /** Show a compact icon-only button */
  compact?: boolean;
  className?: string;
  currentFile?: UploadedFile | null;
  label?: string;
  /**
   * When true and accept includes "image/*", shows a camera capture button
   * alongside the file picker (uses `capture="environment"` on mobile).
   */
  allowCamera?: boolean;
}

export function FileUploadButton({
  bucket, accept, maxSize, onUploaded, onRemoved,
  compact = false, className, currentFile, label, allowCamera = false,
}: FileUploadButtonProps) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const acceptTypes    = accept ? accept.split(',').map(s => s.trim()) : undefined;
  const { takePhoto, pickFromGallery } = useNativeCamera();

  const { upload, remove, uploading, progress } = useFileUpload({
    bucket,
    maxSize,
    accept: acceptTypes,
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await upload(file);
    if (uploaded) onUploaded?.(uploaded);
    e.target.value = '';
  };

  // Native camera capture
  const handleNativeCamera = async () => {
    const photo = await takePhoto();
    if (!photo) return;
    const file = new File([photo.blob], `photo_${Date.now()}.${photo.format}`, { type: photo.blob.type });
    const uploaded = await upload(file);
    if (uploaded) onUploaded?.(uploaded);
  };

  // Native gallery picker
  const handleNativeGallery = async () => {
    const photo = await pickFromGallery();
    if (!photo) return;
    const file = new File([photo.blob], `photo_${Date.now()}.${photo.format}`, { type: photo.blob.type });
    const uploaded = await upload(file);
    if (uploaded) onUploaded?.(uploaded);
  };

  const handleRemove = async () => {
    if (!currentFile) return;
    const ok = await remove(currentFile.path);
    if (ok) onRemoved?.(currentFile.path);
  };

  const showCamera = allowCamera && (accept?.includes('image') ?? false);
  const useNativeCam = isNative && showCamera;

  if (currentFile && !uploading) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-muted/50 border text-sm', className)}>
        <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <a href={currentFile.url} target="_blank" rel="noopener noreferrer"
          className="flex-1 truncate text-primary hover:underline">
          {currentFile.name}
        </a>
        <button onClick={handleRemove} className="text-muted-foreground hover:text-destructive">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Standard file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {/* Camera capture input (mobile opens native camera app) */}
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      )}

      {uploading ? (
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري الرفع...</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : (
        <>
          {/* File picker — hidden on native if camera shown */}
          {!useNativeCam && (
            <Button
              type="button"
              variant="outline"
              size={compact ? 'icon' : 'sm'}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className={cn('w-4 h-4', !compact && 'me-2')} />
              {!compact && (label ?? 'إرفاق ملف')}
            </Button>
          )}

          {/* Native camera buttons */}
          {useNativeCam && (
            <>
              <Button
                type="button"
                variant="outline"
                size={compact ? 'icon' : 'sm'}
                onClick={handleNativeCamera}
                title="التقاط صورة"
              >
                <Camera className={cn('w-4 h-4', !compact && 'me-2')} />
                {!compact && 'كاميرا'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size={compact ? 'icon' : 'sm'}
                onClick={handleNativeGallery}
                title="اختر من المعرض"
              >
                <Image className={cn('w-4 h-4', !compact && 'me-2')} />
                {!compact && 'معرض'}
              </Button>
            </>
          )}

          {/* Web camera capture */}
          {showCamera && !useNativeCam && (
            <Button
              type="button"
              variant="outline"
              size={compact ? 'icon' : 'sm'}
              onClick={() => cameraInputRef.current?.click()}
              title="التقاط صورة"
            >
              <Camera className={cn('w-4 h-4', !compact && 'me-2')} />
              {!compact && 'كاميرا'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
