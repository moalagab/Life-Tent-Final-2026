import { useState } from 'react';
import {
  Star, Edit3, Trash2, Archive, RotateCcw, ShoppingCart,
  Target, MoreHorizontal, BookOpen, Film, Tv2, Mic2, FileText, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';
import { MediaItem } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

/* ── Type config ────────────────────────────────────────────────────────────── */
const TYPE_CFG: Record<string, {
  Icon: React.ElementType;
  gradient: string;
  ring: string;
  statusIn: { ar: string; en: string };
  statusWant: { ar: string; en: string };
  statusDone: { ar: string; en: string };
}> = {
  book: {
    Icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'ring-blue-500/30',
    statusIn:   { ar: 'جاري القراءة', en: 'Reading' },
    statusWant: { ar: 'أريد القراءة', en: 'Want to Read' },
    statusDone: { ar: 'مكتمل',        en: 'Completed' },
  },
  movie: {
    Icon: Film,
    gradient: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-500/30',
    statusIn:   { ar: 'جاري المشاهدة', en: 'Watching' },
    statusWant: { ar: 'أريد المشاهدة', en: 'Want to Watch' },
    statusDone: { ar: 'تمت المشاهدة', en: 'Watched' },
  },
  series: {
    Icon: Tv2,
    gradient: 'from-orange-500 to-amber-600',
    ring: 'ring-orange-500/30',
    statusIn:   { ar: 'جاري المشاهدة', en: 'Watching' },
    statusWant: { ar: 'أريد المشاهدة', en: 'Want to Watch' },
    statusDone: { ar: 'تمت المشاهدة', en: 'Watched' },
  },
  podcast: {
    Icon: Mic2,
    gradient: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-500/30',
    statusIn:   { ar: 'جاري الاستماع',  en: 'Listening' },
    statusWant: { ar: 'أريد الاستماع',  en: 'Want to Listen' },
    statusDone: { ar: 'مكتمل',           en: 'Completed' },
  },
  article: {
    Icon: FileText,
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-500/30',
    statusIn:   { ar: 'جاري القراءة', en: 'Reading' },
    statusWant: { ar: 'أريد القراءة', en: 'Want to Read' },
    statusDone: { ar: 'مكتمل',        en: 'Completed' },
  },
};

const STATUS_BADGE: Record<string, string> = {
  in_progress: 'bg-blue-500/12 text-blue-600 border border-blue-500/20',
  want:        'bg-muted/80 text-muted-foreground border border-border/60',
  completed:   'bg-green-500/12 text-green-600 border border-green-500/20',
  abandoned:   'bg-destructive/10 text-destructive border border-destructive/20',
};

interface MediaItemCardProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onAddToWishlist: (item: MediaItem) => void;
  onLinkToGoal: (item: MediaItem) => void;
  onUpdateProgress: (item: MediaItem, progress: number) => void;
  isArchived?: boolean;
}

export function MediaItemCard({
  item,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onAddToWishlist,
  onLinkToGoal,
  onUpdateProgress,
  isArchived = false,
}: MediaItemCardProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [showActions, setShowActions] = useState(false);

  const cfg = TYPE_CFG[item.type] ?? TYPE_CFG.book;
  const { Icon } = cfg;

  /* status label */
  const statusLabel =
    item.status === 'in_progress' ? cfg.statusIn[isAr ? 'ar' : 'en'] :
    item.status === 'want'        ? cfg.statusWant[isAr ? 'ar' : 'en'] :
    item.status === 'completed'   ? cfg.statusDone[isAr ? 'ar' : 'en'] :
    isAr ? 'مؤرشف' : 'Archived';

  const inProgress  = item.status === 'in_progress';
  const completed   = item.status === 'completed';
  const canWishlist = item.type === 'book' && item.status === 'want';
  const progress    = item.progress ?? 0;

  const quickProgress = (delta: number) => {
    const next = Math.min(Math.max(progress + delta, 0), 100);
    onUpdateProgress(item, next);
  };

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl overflow-hidden border transition-all duration-200',
        'bg-card/60 backdrop-blur-sm border-border/50',
        'hover:shadow-lg hover:shadow-black/5 hover:border-border active:scale-[0.98]',
      )}
    >
      {/* ── Coloured header ── */}
      <div className={cn(
        'relative h-20 bg-gradient-to-br flex items-end justify-between px-3 pb-2.5',
        cfg.gradient,
      )}>
        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>

        {/* Completed checkmark */}
        {completed && (
          <div className="absolute top-2.5 end-2.5">
            <CheckCircle2 className="w-5 h-5 text-white/90" strokeWidth={2} />
          </div>
        )}

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-3.5 h-3.5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isArchived ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit3 className="w-4 h-4 me-2" />
                  {isAr ? 'تعديل' : 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLinkToGoal(item)}>
                  <Target className="w-4 h-4 me-2" />
                  {isAr ? 'ربط بهدف' : 'Link to Goal'}
                </DropdownMenuItem>
                {canWishlist && (
                  <DropdownMenuItem onClick={() => onAddToWishlist(item)}>
                    <ShoppingCart className="w-4 h-4 me-2" />
                    {isAr ? 'أضف لقائمة الأمنيات' : 'Add to Wishlist'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchive(item.id)}>
                  <Archive className="w-4 h-4 me-2" />
                  {isAr ? 'أرشفة' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 me-2" />
                  {isAr ? 'حذف' : 'Delete'}
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onRestore(item.id)}>
                  <RotateCcw className="w-4 h-4 me-2" />
                  {isAr ? 'استعادة' : 'Restore'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 me-2" />
                  {isAr ? 'حذف نهائي' : 'Delete Permanently'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title + author */}
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          {item.author && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.author}</p>
          )}
        </div>

        {/* Status + rating row */}
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap',
            STATUS_BADGE[item.status ?? 'want'],
          )}>
            {statusLabel}
          </span>
          {item.rating && item.rating > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn('w-2.5 h-2.5',
                    i < item.rating! ? 'text-amber-400 fill-amber-400' : 'text-muted/60')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress */}
        {inProgress && (
          <div className="space-y-1.5 mt-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{isAr ? 'التقدم' : 'Progress'}</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />

            {/* Quick progress buttons — always visible on mobile, hover on desktop */}
            <div
              className={cn(
                'flex items-center gap-1.5 mt-1 transition-all duration-200',
                'md:opacity-0 md:group-hover:opacity-100',
              )}
            >
              <button
                onClick={() => quickProgress(-10)}
                className="flex-1 py-1 text-[10px] font-medium rounded-lg bg-muted/70 hover:bg-muted text-muted-foreground transition-colors"
              >
                −10%
              </button>
              <button
                onClick={() => quickProgress(10)}
                className="flex-1 py-1 text-[10px] font-medium rounded-lg bg-muted/70 hover:bg-muted text-muted-foreground transition-colors"
              >
                +10%
              </button>
              <button
                onClick={() => onUpdateProgress(item, 100)}
                className="flex-1 py-1 text-[10px] font-semibold rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-600 transition-colors"
              >
                {isAr ? 'اكتمل' : 'Done'}
              </button>
            </div>
          </div>
        )}

        {/* Notes preview */}
        {item.notes && (
          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
