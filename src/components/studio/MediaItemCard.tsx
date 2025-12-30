import { useState } from 'react';
import { 
  Star, Edit3, Trash2, Archive, RotateCcw, ShoppingCart, 
  ExternalLink, Target, MoreHorizontal, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';
import { MediaItem } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

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
  isArchived = false
}: MediaItemCardProps) {
  const { currentLanguage } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const getTypeEmoji = () => {
    switch (item.type) {
      case 'book': return '📘';
      case 'movie': return '🎬';
      case 'series': return '📺';
      case 'podcast': return '🎧';
      case 'article': return '📄';
      default: return '📖';
    }
  };

  const getStatusConfig = () => {
    const configs: Record<string, { label: string; className: string }> = {
      in_progress: {
        label: currentLanguage === 'ar' 
          ? (['movie', 'series'].includes(item.type) ? 'جاري المشاهدة' : 'جاري القراءة')
          : (['movie', 'series'].includes(item.type) ? 'Watching' : 'Reading'),
        className: 'bg-primary/10 text-primary border-primary/20'
      },
      want: {
        label: currentLanguage === 'ar'
          ? (['movie', 'series'].includes(item.type) ? 'أريد المشاهدة' : 'أريد القراءة')
          : (['movie', 'series'].includes(item.type) ? 'Want to Watch' : 'Want to Read'),
        className: 'bg-muted text-muted-foreground border-muted'
      },
      completed: {
        label: currentLanguage === 'ar'
          ? (['movie', 'series'].includes(item.type) ? 'تمت المشاهدة' : 'مكتمل')
          : (['movie', 'series'].includes(item.type) ? 'Watched' : 'Completed'),
        className: 'bg-green-500/10 text-green-600 border-green-500/20'
      },
      abandoned: {
        label: currentLanguage === 'ar' ? 'مؤرشف' : 'Archived',
        className: 'bg-destructive/10 text-destructive border-destructive/20'
      }
    };
    return configs[item.status || 'want'] || configs.want;
  };

  const statusConfig = getStatusConfig();
  const hasProgress = item.progress !== null && item.progress > 0 && item.status !== 'completed';
  const canAddToWishlist = item.type === 'book' && item.status === 'want';

  const handleQuickProgress = (increment: number) => {
    const newProgress = Math.min(Math.max((item.progress || 0) + increment, 0), 100);
    onUpdateProgress(item, newProgress);
  };

  return (
    <div 
      className={cn(
        'group relative rounded-2xl border transition-all duration-300',
        'bg-card/50 backdrop-blur-sm hover:bg-card',
        'border-border hover:border-primary/30',
        isHovered && 'shadow-lg shadow-primary/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        {/* Top Row: Emoji + Info + Actions */}
        <div className="flex items-start gap-3">
          {/* Emoji/Cover */}
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center text-3xl',
            'bg-gradient-to-br from-muted/80 to-muted/40',
            'transition-transform duration-300',
            isHovered && 'scale-105'
          )}>
            {getTypeEmoji()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            {item.author && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {item.author}
              </p>
            )}
            
            {/* Rating */}
            {item.rating && item.rating > 0 && (
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3 h-3',
                      i < item.rating! ? 'text-primary fill-primary' : 'text-muted'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Status Badge */}
            <span className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
              statusConfig.className
            )}>
              {statusConfig.label}
            </span>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  'h-8 w-8 transition-opacity',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!isArchived ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit3 className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onLinkToGoal(item)}>
                    <Target className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'ربط بهدف' : 'Link to Goal'}
                  </DropdownMenuItem>

                  {canAddToWishlist && (
                    <DropdownMenuItem onClick={() => onAddToWishlist(item)}>
                      <ShoppingCart className="w-4 h-4 me-2" />
                      {currentLanguage === 'ar' ? 'أضف لقائمة الأمنيات' : 'Add to Wishlist'}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => onArchive(item.id)}>
                    <Archive className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'أرشفة' : 'Archive'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onRestore(item.id)}>
                    <RotateCcw className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'استعادة' : 'Restore'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'حذف نهائي' : 'Delete Permanently'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Section */}
        {hasProgress && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {currentLanguage === 'ar' ? 'التقدم' : 'Progress'}
              </span>
              <span className="font-medium text-foreground">{item.progress}%</span>
            </div>
            <Progress value={item.progress || 0} className="h-2" />
            
            {/* Quick Progress Buttons */}
            <div className={cn(
              'flex items-center justify-center gap-2 transition-all',
              isHovered ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
            )}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleQuickProgress(-10)}
              >
                -10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleQuickProgress(10)}
              >
                +10%
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onUpdateProgress(item, 100)}
              >
                <BookOpen className="w-3 h-3 me-1" />
                {currentLanguage === 'ar' ? 'إكمال' : 'Complete'}
              </Button>
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {item.notes && (
          <p className={cn(
            'mt-3 text-xs text-muted-foreground line-clamp-2 transition-all',
            isHovered ? 'opacity-100' : 'opacity-60'
          )}>
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
