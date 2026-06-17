import { useMemo, useState } from 'react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useTodayTasks, useUpdateTask } from '@/hooks/useTasks';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO, set } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarClock, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Check, X, CheckSquare, Clock, Link,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

const TASK_PRIORITY_COLOR: Record<string, string> = {
  urgent: '#dc2626',
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#6b7280',
};

export function DayTimeline() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;
  const navigate = useNavigate();

  const { data: allEvents }  = useEvents();
  const { data: todayTasks } = useTodayTasks();
  const createEvent  = useCreateEvent();
  const updateEvent  = useUpdateEvent();
  const deleteEvent  = useDeleteEvent();
  const updateTask   = useUpdateTask();

  const [expanded,    setExpanded]   = useState(true);
  const [showForm,    setShowForm]   = useState(false);
  const [editingId,   setEditingId]  = useState<string | null>(null);
  const [form,        setForm]       = useState<EventForm>(EMPTY_FORM());
  const [deletingId,  setDeletingId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  /* ── Calendar events for today ── */
  const todayEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(e => e.start_time && isToday(parseISO(e.start_time)));
  }, [allEvents]);

  /* ── Tasks split: scheduled (with due_time) vs unscheduled ── */
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    if (!todayTasks) return { scheduledTasks: [], unscheduledTasks: [] };
    const scheduled   = todayTasks.filter(t => t.due_time || t.scheduled_at);
    const unscheduled = todayTasks.filter(t => !t.due_time && !t.scheduled_at);
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [todayTasks]);

  /* ── Build hour → items map (events + scheduled tasks) ── */
  const itemsByHour = useMemo(() => {
    type HourItem =
      | { kind: 'event'; data: typeof todayEvents[number] }
      | { kind: 'task';  data: typeof scheduledTasks[number] };

    const map = new Map<number, HourItem[]>();

    todayEvents.forEach(e => {
      const h = parseISO(e.start_time!).getHours();
      map.set(h, [...(map.get(h) ?? []), { kind: 'event', data: e }]);
    });

    scheduledTasks.forEach(t => {
      let h: number;
      if (t.due_time) {
        h = parseInt(t.due_time.split(':')[0], 10);
      } else if (t.scheduled_at) {
        h = parseISO(t.scheduled_at).getHours();
      } else return;
      map.set(h, [...(map.get(h) ?? []), { kind: 'task', data: t }]);
    });

    return map;
  }, [todayEvents, scheduledTasks]);

  const totalItems = todayEvents.length + (todayTasks?.length ?? 0);
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

  async function handleDeleteEvent(id: string) {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
    setDeletingId(null);
  }

  async function handleCompleteTask(id: string) {
    try {
      await updateTask.mutateAsync({ id, status: 'done' });
      toast.success(isAr ? 'تم إنجاز المهمة' : 'Task done');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;

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
          {totalItems > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
              {totalItems}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); navigate('/calendar'); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={isAr ? 'فتح التقويم' : 'Open calendar'}
          >
            <Link className="w-3.5 h-3.5" />
          </button>
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
      {!expanded && totalItems > 0 && (
        <div className="px-3 pb-2.5 flex gap-1.5 flex-wrap">
          {todayEvents.slice(0, 3).map(ev => (
            <span
              key={ev.id}
              className="shrink-0 text-[11px] text-white px-2 py-0.5 rounded-full truncate max-w-[130px]"
              style={{ backgroundColor: ev.color ?? 'hsl(var(--primary))' }}
            >
              {format(parseISO(ev.start_time!), 'H:mm')} {ev.title}
            </span>
          ))}
          {unscheduledTasks.slice(0, 2).map(t => (
            <span
              key={t.id}
              className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[130px] flex items-center gap-1"
            >
              <CheckSquare className="w-2.5 h-2.5" />
              {t.title}
            </span>
          ))}
          {totalItems > 5 && (
            <span className="shrink-0 text-[11px] text-muted-foreground px-2 py-0.5">
              +{totalItems - 5}
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
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') closeForm(); }}
                placeholder={isAr ? 'عنوان الحدث…' : 'Event title…'}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />

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

          {/* Unscheduled tasks strip (no due_time) */}
          {unscheduledTasks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide px-1">
                {isAr ? 'مهام اليوم' : "Today's tasks"}
              </p>
              {unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="shrink-0 w-4 h-4 rounded border border-primary/40 hover:border-primary hover:bg-primary/10 transition-colors flex items-center justify-center"
                    title={isAr ? 'إنجاز' : 'Complete'}
                  >
                    <Check className="w-2.5 h-2.5 text-primary opacity-0 group-hover:opacity-100" />
                  </button>
                  <CheckSquare className="w-3.5 h-3.5 shrink-0"
                    style={{ color: TASK_PRIORITY_COLOR[task.priority ?? 'medium'] }} />
                  <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                  <button
                    onClick={() => navigate(`/tasks?id=${task.id}`)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-primary transition-all"
                    title={isAr ? 'فتح' : 'Open'}
                  >
                    <Link className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hour grid */}
          <div className="relative">
            {HOURS.map(h => {
              const items      = itemsByHour.get(h) ?? [];
              const isCurrentH = h === nowH;
              const nowTopPct  = isCurrentH ? (nowMin / 60) * 100 : null;

              return (
                <div key={h} className="flex gap-2 min-h-[36px] relative group/row">
                  {/* Hour label */}
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

                    {items.map(item => {
                      if (item.kind === 'event') {
                        const ev = item.data;
                        return (
                          <div
                            key={ev.id}
                            className="group/ev relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white font-medium mb-0.5 cursor-pointer"
                            style={{ backgroundColor: ev.color ?? 'hsl(var(--primary))' }}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate flex-1">{ev.title}</span>
                            <div className="hidden group-hover/ev:flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); openEdit(ev); }}
                                className="p-0.5 rounded hover:bg-white/20 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {deletingId === ev.id ? (
                                <>
                                  <button onClick={e => { e.stopPropagation(); handleDeleteEvent(ev.id); }} className="p-0.5 rounded hover:bg-white/20">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); setDeletingId(null); }} className="p-0.5 rounded hover:bg-white/20">
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <button onClick={e => { e.stopPropagation(); setDeletingId(ev.id); }} className="p-0.5 rounded hover:bg-white/20">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Task in the grid
                      const task = item.data;
                      const taskColor = TASK_PRIORITY_COLOR[task.priority ?? 'medium'];
                      return (
                        <div
                          key={task.id}
                          className="group/task relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium mb-0.5 border"
                          style={{ borderColor: taskColor + '40', backgroundColor: taskColor + '15', color: 'hsl(var(--foreground))' }}
                        >
                          <CheckSquare className="w-3 h-3 shrink-0" style={{ color: taskColor }} />
                          <span className="truncate flex-1">{task.title}</span>
                          {task.due_time && (
                            <span className="text-[10px] opacity-60 shrink-0">{task.due_time.slice(0, 5)}</span>
                          )}
                          <div className="hidden group-hover/task:flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); handleCompleteTask(task.id); }}
                              className="p-0.5 rounded hover:bg-muted transition-colors"
                              title={isAr ? 'إنجاز' : 'Done'}
                            >
                              <Check className="w-3 h-3 text-primary" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/tasks?id=${task.id}`); }}
                              className="p-0.5 rounded hover:bg-muted transition-colors"
                              title={isAr ? 'فتح' : 'Open'}
                            >
                              <Link className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty-hour add hint */}
                    {items.length === 0 && (
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

/* ── Time selects ── */
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
