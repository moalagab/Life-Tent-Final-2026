import { useMemo, useState } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useFocusTasks } from '@/hooks/useTasks';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO, set } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarClock, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Check, X, CheckSquare, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am – 10pm

const COLORS = [
  { value: 'hsl(var(--primary))',  label: 'default' },
  { value: '#10b981',              label: 'emerald'  },
  { value: '#3b82f6',              label: 'blue'     },
  { value: '#f59e0b',              label: 'amber'    },
  { value: '#ef4444',              label: 'red'      },
  { value: '#8b5cf6',              label: 'violet'   },
];

interface EventForm { title: string; hour: number; minute: number; endHour: number; endMinute: number; color: string }

const EMPTY_FORM = (h = new Date().getHours()): EventForm => ({
  title: '', hour: h, minute: 0, endHour: h + 1, endMinute: 0, color: COLORS[0].value,
});

function buildIso(date: Date, hour: number, minute: number) {
  return set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 }).toISOString();
}

export function DayTimeline() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;

  const { data: allEvents }  = useEvents();
  const { data: focusTasks } = useFocusTasks();
  const createEvent  = useCreateEvent();
  const updateEvent  = useUpdateEvent();
  const deleteEvent  = useDeleteEvent();

  const [expanded,    setExpanded]   = useState(true);
  const [showForm,    setShowForm]   = useState(false);
  const [editingId,   setEditingId]  = useState<string | null>(null);
  const [form,        setForm]       = useState<EventForm>(EMPTY_FORM());
  const [deletingId,  setDeletingId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  const todayEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(e => e.start_time && isToday(parseISO(e.start_time)));
  }, [allEvents]);

  const eventsByHour = useMemo(() => {
    const map = new Map<number, typeof todayEvents>();
    todayEvents.forEach(e => {
      const hour = parseISO(e.start_time!).getHours();
      map.set(hour, [...(map.get(hour) ?? []), e]);
    });
    return map;
  }, [todayEvents]);

  const nowH   = today.getHours();
  const nowMin = today.getMinutes();

  /* ── helpers ── */
  function openAdd(h?: number) {
    setForm(EMPTY_FORM(h ?? nowH));
    setEditingId(null);
    setShowForm(true);
    setExpanded(true);
  }

  function openEdit(ev: NonNullable<typeof todayEvents>[number]) {
    const s = parseISO(ev.start_time!);
    const e = ev.end_time ? parseISO(ev.end_time) : null;
    setForm({
      title:     ev.title,
      hour:      s.getHours(),
      minute:    s.getMinutes(),
      endHour:   e?.getHours()   ?? s.getHours() + 1,
      endMinute: e?.getMinutes() ?? 0,
      color:     ev.color ?? COLORS[0].value,
    });
    setEditingId(ev.id);
    setShowForm(true);
    setExpanded(true);
  }

  function closeForm() { setShowForm(false); setEditingId(null); }

  async function handleSave() {
    if (!form.title.trim()) return;
    const start = buildIso(today, form.hour, form.minute);
    const end   = buildIso(today, form.endHour, form.endMinute);
    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, title: form.title, start_time: start, end_time: end, color: form.color });
        toast.success(isAr ? 'تم التحديث' : 'Updated');
      } else {
        await createEvent.mutateAsync({ title: form.title, start_time: start, end_time: end, color: form.color });
        toast.success(isAr ? 'تم الإضافة' : 'Added');
      }
      closeForm();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
    setDeletingId(null);
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;

  /* ── header date label ── */
  const todayLabel = format(today, isAr ? 'EEEE d MMMM' : 'EEEE, d MMM', { locale: dateLocale });

  return (
    <div className="rounded-xl bg-card/60 border border-border/40 overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarClock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {isAr ? 'جدول اليوم' : "Today's Schedule"}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">{todayLabel}</span>
          {todayEvents.length > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
              {todayEvents.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); openAdd(); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={isAr ? 'إضافة حدث' : 'Add event'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* ── Collapsed summary ── */}
      {!expanded && todayEvents.length > 0 && (
        <div className="px-3 pb-2.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {todayEvents.slice(0, 4).map(ev => (
            <span
              key={ev.id}
              className="shrink-0 text-[11px] text-white px-2 py-0.5 rounded-full truncate max-w-[130px]"
              style={{ backgroundColor: ev.color ?? 'hsl(var(--primary))' }}
            >
              {format(parseISO(ev.start_time!), 'H:mm')} {ev.title}
            </span>
          ))}
          {todayEvents.length > 4 && (
            <span className="shrink-0 text-[11px] text-muted-foreground px-2 py-0.5">
              +{todayEvents.length - 4}
            </span>
          )}
        </div>
      )}

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/20 pt-3">

          {/* Inline form */}
          {showForm && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2.5" onClick={e => e.stopPropagation()}>
              {/* Title */}
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') closeForm(); }}
                placeholder={isAr ? 'عنوان الحدث…' : 'Event title…'}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />

              {/* Time row */}
              <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isAr && 'flex-row-reverse')}>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <TimeSelect hour={form.hour} minute={form.minute}
                  onHour={h => setForm(f => ({ ...f, hour: h }))}
                  onMinute={m => setForm(f => ({ ...f, minute: m }))}
                />
                <span>—</span>
                <TimeSelect hour={form.endHour} minute={form.endMinute}
                  onHour={h => setForm(f => ({ ...f, endHour: h }))}
                  onMinute={m => setForm(f => ({ ...f, endMinute: m }))}
                />
              </div>

              {/* Color swatches */}
              <div className={cn('flex gap-1.5', isAr && 'flex-row-reverse')}>
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={cn('w-5 h-5 rounded-full transition-all', form.color === c.value && 'ring-2 ring-offset-1 ring-foreground scale-110')}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className={cn('flex gap-2', isAr && 'flex-row-reverse')}>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !form.title.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {isSaving ? (isAr ? 'جارٍ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}
                </button>
                <button
                  onClick={closeForm}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Focus tasks strip */}
          {focusTasks && focusTasks.length > 0 && (
            <div className="space-y-1">
              {focusTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hour grid */}
          <div className="relative">
            {HOURS.map(h => {
              const events     = eventsByHour.get(h) ?? [];
              const isCurrentH = h === nowH;
              const nowTopPct  = isCurrentH ? (nowMin / 60) * 100 : null;

              return (
                <div key={h} className="flex gap-2 min-h-[36px] relative group/row">
                  {/* Hour label — click to quick-add */}
                  <button
                    onClick={() => openAdd(h)}
                    className={cn(
                      'w-9 shrink-0 text-[10px] text-right pt-0.5 leading-none select-none transition-colors hover:text-primary',
                      isCurrentH ? 'text-primary font-semibold' : 'text-muted-foreground/40',
                    )}
                  >
                    {isAr
                      ? format(new Date(2000, 0, 1, h), 'h a', { locale: dateLocale })
                      : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`}
                  </button>

                  {/* Track */}
                  <div className="flex-1 border-t border-border/20 pt-1 pb-2 relative min-h-[36px]">
                    {nowTopPct !== null && (
                      <div
                        className="absolute inset-x-0 flex items-center gap-1 pointer-events-none z-10"
                        style={{ top: `${nowTopPct}%` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 h-px bg-primary" />
                      </div>
                    )}

                    {events.map(ev => (
                      <div
                        key={ev.id}
                        className="group/ev relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white font-medium mb-0.5 cursor-pointer"
                        style={{ backgroundColor: ev.color ?? 'hsl(var(--primary))' }}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate flex-1">{ev.title}</span>

                        {/* Edit / Delete — show on hover */}
                        <div className="hidden group-hover/ev:flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(ev); }}
                            className="p-0.5 rounded hover:bg-white/20 transition-colors"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {deletingId === ev.id ? (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(ev.id); }}
                                className="p-0.5 rounded hover:bg-white/20 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setDeletingId(null); }}
                                className="p-0.5 rounded hover:bg-white/20 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setDeletingId(ev.id); }}
                              className="p-0.5 rounded hover:bg-white/20 transition-colors"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty-hour add hint on hover */}
                    {events.length === 0 && (
                      <button
                        onClick={() => openAdd(h)}
                        className="hidden group-hover/row:flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {isAr ? 'إضافة' : 'Add'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tiny time selects ── */
function TimeSelect({ hour, minute, onHour, onMinute }: {
  hour: number; minute: number;
  onHour: (h: number) => void; onMinute: (m: number) => void;
}) {
  const cls = 'bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary';
  return (
    <span className="flex items-center gap-0.5">
      <select value={hour} onChange={e => onHour(+e.target.value)} className={cls}>
        {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>
      <span>:</span>
      <select value={minute} onChange={e => onMinute(+e.target.value)} className={cls}>
        {[0, 15, 30, 45].map(m => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
    </span>
  );
}
