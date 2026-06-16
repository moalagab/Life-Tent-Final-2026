import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Target, FolderOpen, Brain, Cpu, TrendingUp } from 'lucide-react';
import type { SuccessLoopResult, ProgressUpdate } from '@/lib/successLoop';
import { cn } from '@/lib/utils';

// ── Progress chip ─────────────────────────────────────────────────────────────

function ProgressChip({ update }: { update: ProgressUpdate }) {
  const delta = update.newProgress - update.oldProgress;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-white/40">{update.oldProgress}%</span>
      <span className="text-white/30">→</span>
      <span className="font-black text-emerald-400">{update.newProgress}%</span>
      {delta > 0 && (
        <span className="text-[10px] text-emerald-400/70 font-bold">+{delta}</span>
      )}
    </span>
  );
}

// ── Step row ─────────────────────────────────────────────────────────────────

interface StepProps {
  icon:    React.ElementType;
  label:   string;
  detail?: React.ReactNode;
  delay:   number;
  color:   string;
}

function Step({ icon: Icon, label, detail, delay, color }: StepProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 transition-all duration-300',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', color)}>
        <Icon className="w-2.5 h-2.5 text-white" />
      </div>
      <span className="text-[12px] text-white/70 leading-tight flex-1">{label}</span>
      {detail && (
        <span className="text-[11px] text-white/50 shrink-0">{detail}</span>
      )}
      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
    </div>
  );
}

// ── Main feedback card ────────────────────────────────────────────────────────

interface FeedbackCardProps {
  result:    SuccessLoopResult;
  onDismiss: () => void;
}

function FeedbackCard({ result, onDismiss }: FeedbackCardProps) {
  const AUTO_DISMISS_MS = 5000;
  const barRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    // Animate progress bar
    if (barRef.current) {
      requestAnimationFrame(() => {
        if (barRef.current) {
          barRef.current.style.width = '0%';
        }
      });
    }
    return () => clearTimeout(t);
  }, [onDismiss]);

  const steps: StepProps[] = [];

  if (result.goalUpdate) {
    steps.push({
      icon:   Target,
      label:  result.goalUpdate.title,
      detail: <ProgressChip update={result.goalUpdate} />,
      delay:  120,
      color:  'bg-violet-500',
    });
  }

  if (result.projectUpdate) {
    steps.push({
      icon:   FolderOpen,
      label:  result.projectUpdate.title,
      detail: <ProgressChip update={result.projectUpdate} />,
      delay:  240,
      color:  'bg-blue-500',
    });
  }

  steps.push({
    icon:  TrendingUp,
    label: 'تحديث التوقعات',
    delay: 360,
    color: 'bg-amber-500',
  });

  steps.push({
    icon:  Brain,
    label: 'تحديث ذاكرة الوكيل',
    delay: 480,
    color: 'bg-pink-500',
  });

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border border-emerald-500/20',
        'bg-[#0d1117] shadow-2xl shadow-black/60',
        'overflow-hidden',
        'animate-in slide-in-from-bottom-4 fade-in duration-400',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-emerald-400 leading-tight">دائرة النجاح</p>
          <p
            className="text-xs text-white/80 font-medium leading-snug mt-0.5 truncate"
            title={result.taskTitle}
          >
            {result.taskTitle}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/20 hover:text-white/50 text-lg leading-none -mt-0.5 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-2.5" dir="rtl">
        {steps.map((s, i) => (
          <Step key={i} {...s} />
        ))}
      </div>

      {/* Auto-dismiss bar */}
      <div className="h-0.5 bg-white/5">
        <div
          ref={barRef}
          className="h-full bg-emerald-500/40 transition-none"
          style={{
            width:      '100%',
            transition: `width ${AUTO_DISMISS_MS}ms linear`,
          }}
        />
      </div>
    </div>
  );
}

// ── Listener & container ─────────────────────────────────────────────────────

export function SuccessLoopFeedback() {
  const [cards, setCards] = useState<Array<SuccessLoopResult & { key: number }>>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const result = (e as CustomEvent<SuccessLoopResult>).detail;
      const key    = ++counterRef.current;
      setCards(prev => [...prev, { ...result, key }]);
    };

    window.addEventListener('success-loop:complete', handler);
    return () => window.removeEventListener('success-loop:complete', handler);
  }, []);

  const dismiss = (key: number) => {
    setCards(prev => prev.filter(c => c.key !== key));
  };

  if (cards.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none"
      style={{ direction: 'rtl' }}
    >
      {cards.map(card => (
        <div key={card.key} className="pointer-events-auto">
          <FeedbackCard
            result={card}
            onDismiss={() => dismiss(card.key)}
          />
        </div>
      ))}
    </div>
  );
}
