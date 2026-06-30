import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sparkles, Send, Check, X, Loader2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryClient } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────────

type OpType   = 'create' | 'update' | 'delete';
type OpEntity = 'task' | 'initiative' | 'goal' | 'project' | 'table';

interface AIOp {
  type: OpType;
  entity: OpEntity;
  data: Record<string, unknown>;
}

interface AIResult {
  understood: string;
  operations: AIOp[];
}

export type EntityType = 'area' | 'project' | 'goal' | 'initiative' | 'global';

interface WorkspaceAIProps {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  workspaceData?: {
    tasks?: Array<{ id: string; title: string }>;
    initiatives?: Array<{ id: string; title: string }>;
  };
}

// ── DB executors ──────────────────────────────────────────────────────────────

const TABLE_MAP: Record<OpEntity, string> = {
  task: 'tasks', initiative: 'initiatives', goal: 'goals', project: 'projects', table: 'custom_tables',
};

async function executeOp(op: AIOp, userId: string): Promise<void> {
  const table = TABLE_MAP[op.entity];
  if (!table) throw new Error(`Unknown entity: ${op.entity}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (op.type === 'create') {
    const { error } = await db.from(table).insert({ ...op.data, user_id: userId });
    if (error) throw error;
  } else if (op.type === 'update') {
    const { id, ...fields } = op.data;
    if (!id) throw new Error('update requires id');
    const { error } = await db.from(table).update(fields).eq('id', id);
    if (error) throw error;
  } else if (op.type === 'delete') {
    if (!op.data.id) throw new Error('delete requires id');
    const { error } = await db.from(table).delete().eq('id', op.data.id);
    if (error) throw error;
  }
}

// ── Op preview card ───────────────────────────────────────────────────────────

const TYPE_COLORS: Record<OpType, string> = {
  create: 'bg-success/10 text-success border-success/20',
  update: 'bg-primary/10 text-primary border-primary/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
};

const TYPE_AR: Record<OpType, string> = { create: 'إنشاء', update: 'تعديل', delete: 'حذف' };
const ENTITY_AR: Record<OpEntity, string> = { task: 'مهمة', initiative: 'مبادرة', goal: 'هدف', project: 'مشروع', table: 'جدول' };

function OpCard({ op }: { op: AIOp }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 text-sm">
      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 mt-0.5', TYPE_COLORS[op.type])}>
        {TYPE_AR[op.type]}
      </span>
      <div className="min-w-0">
        <span className="font-medium text-muted-foreground text-xs">{ENTITY_AR[op.entity]}</span>
        {op.data.title && <p className="truncate">{String(op.data.title)}</p>}
        {op.type === 'delete' && <p className="text-xs text-muted-foreground">سيتم حذف العنصر نهائياً</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkspaceAI({ entityType, entityId, entityTitle, workspaceData }: WorkspaceAIProps) {
  const { user }           = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr               = currentLanguage === 'ar';
  const queryClient        = useQueryClient();

  const [open, setOpen]         = useState(false);
  const [command, setCommand]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<AIResult | null>(null);
  const [executing, setExec]    = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = async () => {
    if (!command.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('workspace-ai', {
        body: {
          command: command.trim(),
          context: { entity_type: entityType, entity_id: entityId, entity_title: entityTitle },
          workspace_data: workspaceData ?? {},
        },
      });

      if (fnError) throw fnError;
      setResult(data as AIResult);
    } catch (e) {
      toast.error(isAr ? 'خطأ في الاتصال بالذكاء الاصطناعي' : 'AI connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!result?.operations.length || !user) return;
    setExec(true);
    try {
      for (const op of result.operations) {
        await executeOp(op, user.id);
      }
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['custom-tables'] });

      toast.success(isAr ? `تم تنفيذ ${result.operations.length} عملية بنجاح` : `${result.operations.length} operation(s) executed`);
      setResult(null);
      setCommand('');
    } catch (e) {
      toast.error(isAr ? 'خطأ في التنفيذ' : 'Execution error');
    } finally {
      setExec(false);
    }
  };

  const handleCancel = () => { setResult(null); setCommand(''); };

  const SUGGESTIONS = isAr ? [
    'أضف مهمة جديدة بأولوية عالية',
    'أنشئ مبادرة جديدة',
    'أضف مهمة تصميم الشعار',
  ] : [
    'Add a high priority task',
    'Create a new initiative',
    'Add a logo design task',
  ];

  return (
    <div className={cn('rounded-2xl border transition-all duration-300 overflow-hidden', open ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/20')}>
      {/* Toggle bar */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) setTimeout(() => inputRef.current?.focus(), 100); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 text-start">
          <p className="text-xs font-semibold text-foreground">{isAr ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? 'أنشئ وعدّل وحذف بالأوامر النصية' : 'Create, edit, delete with natural language'}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/20">
          {/* Input */}
          <div className="flex gap-2 pt-3">
            <Input
              ref={inputRef}
              placeholder={isAr ? 'اكتب أمرك... مثال: أضف مهمة تصميم الشعار بأولوية عالية' : 'Type a command... e.g. Add logo design task high priority'}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              dir="auto"
              className="flex-1"
              disabled={loading || executing}
            />
            <Button onClick={handleAsk} disabled={!command.trim() || loading || executing} size="icon" className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Suggestions */}
          {!result && !loading && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setCommand(s); inputRef.current?.focus(); }}
                  className="px-2.5 py-1 rounded-full text-xs bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/40 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div className="space-y-3">
              {/* AI understanding */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-background/60 border border-border/40">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{result.understood}</p>
              </div>

              {/* Operations */}
              {result.operations.length > 0 ? (
                <div className="space-y-2">
                  {result.operations.map((op, i) => <OpCard key={i} op={op} />)}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning border border-warning/20 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {isAr ? 'لا توجد عمليات للتنفيذ' : 'No operations to execute'}
                </div>
              )}

              {/* Confirm/Cancel */}
              {result.operations.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={handleExecute} disabled={executing} className="flex-1 gap-1.5" size="sm">
                    {executing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {isAr ? 'جاري التنفيذ...' : 'Executing...'}</>
                      : <><Check className="w-3.5 h-3.5" /> {isAr ? 'تأكيد وتنفيذ' : 'Confirm & Execute'}</>
                    }
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={executing}>
                    <X className="w-3.5 h-3.5 me-1.5" />
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
