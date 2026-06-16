/**
 * ProgressiveList — Generic progressive-disclosure list wrapper.
 *
 * Shows `maxVisible` items by default. A "+N more" button expands
 * in-place. Optionally shows a "collapse" link after expansion.
 *
 * Usage:
 *   <ProgressiveList
 *     items={tasks}
 *     maxVisible={3}
 *     renderItem={(task, i) => <TaskRow key={task.id} task={task} />}
 *     expandLabel={n => `+ ${n} مهام أخرى`}
 *   />
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProgressiveListProps<T> {
  items:         T[];
  maxVisible:    number;            // items shown before truncation
  renderItem:    (item: T, index: number, isHidden: boolean) => React.ReactNode;
  expandLabel?:  string | ((hiddenCount: number) => string);
  collapseLabel?: string;
  className?:    string;
  /** If true, hidden items are rendered but visually hidden (for animation) */
  animate?:      boolean;
}

export function ProgressiveList<T>({
  items,
  maxVisible,
  renderItem,
  expandLabel,
  collapseLabel = 'إخفاء',
  className,
  animate = false,
}: ProgressiveListProps<T>) {
  const [expanded, setExpanded] = useState(false);

  const shown  = expanded ? items : items.slice(0, maxVisible);
  const hidden = Math.max(0, items.length - maxVisible);
  const canExpand = !expanded && hidden > 0;
  const canCollapse = expanded && hidden > 0;

  const expandText =
    typeof expandLabel === 'function'
      ? expandLabel(hidden)
      : expandLabel ?? `+ ${hidden} more`;

  return (
    <div className={cn('space-y-0', className)}>
      {animate ? (
        // Render all, clip visually
        items.map((item, i) => (
          <div
            key={i}
            className={cn(
              'transition-all duration-300',
              !expanded && i >= maxVisible ? 'hidden' : '',
            )}
          >
            {renderItem(item, i, i >= maxVisible)}
          </div>
        ))
      ) : (
        shown.map((item, i) => renderItem(item, i, false))
      )}

      {/* Expand / collapse toggle */}
      {canExpand && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors py-1.5 px-1 font-semibold"
        >
          <ChevronDown className="w-3 h-3" />
          {expandText}
        </button>
      )}

      {canCollapse && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors py-1.5 px-1 font-semibold"
        >
          <ChevronUp className="w-3 h-3" />
          {collapseLabel}
        </button>
      )}
    </div>
  );
}
