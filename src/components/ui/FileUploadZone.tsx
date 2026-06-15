import { useCallback, useState, useRef } from 'react';
import { Upload, File, X, Loader2, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFileInfo {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  uploading?: boolean;
  progress?: number;
  uploaded?: UploadedFileInfo | null;
  onRemove?: () => void;
  accept?: string;
  maxSizeMb?: number;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  uploading = false,
  progress = 0,
  uploaded,
  onRemove,
  accept = '*/*',
  maxSizeMb = 10,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  if (uploaded) {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border', className)}>
        <FileTypeIcon name={uploaded.name} mime={uploaded.type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{uploaded.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <a
              href={uploaded.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              عرض الملف
            </a>
            <span className="text-xs text-muted-foreground">
              {formatSize(uploaded.size)}
            </span>
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={uploading ? undefined : handleDrop}
      disabled={uploading}
      className={cn(
        'w-full p-5 rounded-xl border-2 border-dashed transition-all duration-200',
        'flex flex-col items-center gap-2.5 text-center',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30',
        uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {uploading ? (
        <>
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جار الرفع...</p>
          {progress > 0 && (
            <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Upload className="w-7 h-7 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">اسحب وأفلت الملف هنا</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              أو اضغط للاختيار · حتى {maxSizeMb} MB
            </p>
          </div>
        </>
      )}
    </button>
  );
}

function FileTypeIcon({ name, mime }: { name: string; mime: string }) {
  if (mime.startsWith('image/')) {
    return <Image className="w-5 h-5 text-blue-500 shrink-0" />;
  }
  if (mime === 'application/pdf') {
    return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileText className="w-5 h-5 text-green-600 shrink-0" />;
  return <File className="w-5 h-5 text-muted-foreground shrink-0" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
