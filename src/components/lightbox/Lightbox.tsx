/**
 * Lightbox — full-screen file/image previewer.
 *
 * Features:
 *  - Image: zoom (wheel / +- / double-click), pan (drag when zoomed)
 *  - Non-image: type icon + name + download
 *  - Gallery: prev/next arrows + thumbnail strip
 *  - Keyboard: Escape close · ←/→ navigate · +/- zoom · 0 reset
 *  - Download button for all file types
 *  - RTL-safe, theme-aware overlay
 */
import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  X, Download, ZoomIn, ZoomOut, RotateCcw,
  ChevronLeft, ChevronRight,
  FileText, Film, Music, File, FileArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LightboxItem } from './useLightbox';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileCategory(type: string, name: string) {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return 'archive';
  return 'other';
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  pdf:     FileText,
  video:   Film,
  audio:   Music,
  archive: FileArchive,
  other:   File,
};

const CATEGORY_COLOR: Record<string, string> = {
  pdf:     'text-red-400',
  video:   'text-violet-400',
  audio:   'text-emerald-400',
  archive: 'text-amber-400',
  other:   'text-muted-foreground',
};

// ── Image viewer with zoom / pan ──────────────────────────────────────────────

interface ImageViewerProps { url: string; name: string; }

function ImageViewer({ url, name }: ImageViewerProps) {
  const [zoom, setZoom]   = useState(1);
  const [pos,  setPos]    = useState({ x: 0, y: 0 });
  const [drag, setDrag]   = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const clampZoom = (z: number) => Math.min(5, Math.max(0.5, z));

  const reset = useCallback(() => { setZoom(1); setPos({ x: 0, y: 0 }); }, []);

  const zoomBy = useCallback((delta: number) =>
    setZoom(z => clampZoom(z + delta)), []);

  // Mouse wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(z => clampZoom(z + delta));
  }, []);

  // Double-click toggle fit ↔ 2×
  const onDblClick = useCallback(() => {
    if (zoom > 1.05) { reset(); } else { setZoom(2); }
  }, [zoom, reset]);

  // Drag to pan (only when zoomed)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDrag({ sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y });
  }, [zoom, pos]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return;
    setPos({ x: drag.ox + (e.clientX - drag.sx), y: drag.oy + (e.clientY - drag.sy) });
  }, [drag]);

  const endDrag = useCallback(() => setDrag(null), []);

  // Keyboard zoom (delegated from parent via global listener)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(0.25); }
      if (e.key === '-')                  { e.preventDefault(); zoomBy(-0.25); }
      if (e.key === '0')                  { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomBy, reset]);

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
      ref={imgRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      style={{ cursor: zoom > 1 ? (drag ? 'grabbing' : 'grab') : 'zoom-in' }}
    >
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      <img
        src={url}
        alt={name}
        onLoad={() => setLoaded(true)}
        onDoubleClick={onDblClick}
        draggable={false}
        className={cn(
          'max-w-full max-h-full object-contain transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          transform:        `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)`,
          transformOrigin:  'center center',
          transition:       drag ? 'none' : 'transform 0.15s ease',
        }}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-3 start-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
        <button
          onClick={() => zoomBy(-0.25)}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="تصغير (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={reset}
          className="px-2 text-[11px] font-bold text-white/60 hover:text-white transition-colors tabular-nums"
          title="إعادة ضبط (0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => zoomBy(0.25)}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="تكبير (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-white/20 mx-0.5" />
        <button
          onClick={reset}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="إعادة ضبط"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Non-image file viewer ─────────────────────────────────────────────────────

function FileViewer({ item }: { item: LightboxItem }) {
  const cat  = fileCategory(item.type, item.name);
  const Icon = CATEGORY_ICON[cat] ?? File;
  const col  = CATEGORY_COLOR[cat] ?? 'text-muted-foreground';

  if (cat === 'pdf') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <iframe
          src={item.url}
          title={item.name}
          className="w-full h-full rounded-xl border border-white/10"
        />
      </div>
    );
  }

  if (cat === 'video') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <video
          src={item.url}
          controls
          className="max-w-full max-h-full rounded-xl"
        />
      </div>
    );
  }

  if (cat === 'audio') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Music className="w-10 h-10 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-white/80 text-center max-w-xs truncate">{item.name}</p>
        <audio src={item.url} controls className="w-full max-w-sm" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
      <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className={cn('w-10 h-10', col)} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-white/80">{item.name}</p>
        {item.size && <p className="text-xs text-white/40">{formatSize(item.size)}</p>}
        <p className="text-[11px] text-white/30">{item.type || 'ملف'}</p>
      </div>
      <a
        href={item.url}
        download={item.name}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        تحميل الملف
      </a>
    </div>
  );
}

// ── Thumbnail strip ───────────────────────────────────────────────────────────

function ThumbnailStrip({
  items, index, onSelect,
}: {
  items: LightboxItem[];
  index: number;
  onSelect: (i: number) => void;
}) {
  const cat = (item: LightboxItem) => fileCategory(item.type, item.name);

  return (
    <div className="shrink-0 flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
      {items.map((item, i) => {
        const isImg  = cat(item) === 'image';
        const active = i === index;
        const Icon   = CATEGORY_ICON[cat(item)] ?? File;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              'shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
              active ? 'border-primary scale-110' : 'border-white/10 opacity-50 hover:opacity-80',
            )}
          >
            {isImg ? (
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <Icon className={cn('w-5 h-5', CATEGORY_COLOR[cat(item)] ?? 'text-white/40')} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Lightbox component ───────────────────────────────────────────────────

interface LightboxProps {
  items:    LightboxItem[];
  index:    number;
  onClose:  () => void;
  onGoTo:   (i: number) => void;
}

export function Lightbox({ items, index, onClose, onGoTo }: LightboxProps) {
  const item  = items[index];
  const total = items.length;
  const cat   = fileCategory(item.type, item.name);
  const isImg = cat === 'image';

  const goPrev = useCallback(() => onGoTo(Math.max(0, index - 1)),            [index, onGoTo]);
  const goNext = useCallback(() => onGoTo(Math.min(total - 1, index + 1)),    [index, total, onGoTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowLeft')   { e.preventDefault(); goPrev();  }
      if (e.key === 'ArrowRight')  { e.preventDefault(); goNext();  }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/92 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/8">
        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 truncate">{item.name}</p>
          {item.size && (
            <p className="text-[11px] text-white/40 mt-0.5">
              {formatSize(item.size)}
              {total > 1 && (
                <span className="ms-2">{index + 1} / {total}</span>
              )}
            </p>
          )}
          {!item.size && total > 1 && (
            <p className="text-[11px] text-white/40 mt-0.5">{index + 1} / {total}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Download */}
          <a
            href={item.url}
            download={item.name}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="تحميل"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="إغلاق (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Prev arrow */}
        {total > 1 && index > 0 && (
          <button
            onClick={goPrev}
            className="absolute start-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Viewer */}
        {isImg ? (
          <ImageViewer key={item.url} url={item.url} name={item.name} />
        ) : (
          <FileViewer item={item} />
        )}

        {/* Next arrow */}
        {total > 1 && index < total - 1 && (
          <button
            onClick={goNext}
            className="absolute end-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip (gallery mode) ── */}
      {total > 1 && (
        <div className="shrink-0 border-t border-white/8 bg-black/40">
          <ThumbnailStrip items={items} index={index} onSelect={onGoTo} />
        </div>
      )}

      {/* Keyboard hint */}
      {isImg && (
        <div className="shrink-0 pb-2 flex items-center justify-center gap-3">
          {[
            { key: 'Scroll', label: 'تكبير' },
            { key: 'Double-click', label: 'ملاءمة' },
            ...(total > 1 ? [{ key: '←→', label: 'تنقل' }] : []),
            { key: 'Esc', label: 'إغلاق' },
          ].map(h => (
            <span key={h.key} className="flex items-center gap-1 text-[9px] text-white/20">
              <kbd className="bg-white/8 rounded px-1 py-0.5 font-mono">{h.key}</kbd>
              {h.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
