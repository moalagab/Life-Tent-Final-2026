/**
 * useEmptyStateIntelligence — detects which data layers are empty and
 * generates prioritized suggestions so the user never sees a blank screen.
 *
 * Priority order:
 *   1. Goals   — define the destination before the path
 *   2. Projects — group related work
 *   3. Tasks   — the daily execution layer
 *   4. Habits  — build consistency
 *   5. Finance — connect the money layer
 */
import { useMemo } from 'react';
import { useTasks }    from './useTasks';
import { useProjects } from './useProjects';
import { useGoals }    from './useGoals';
import { useHabits }   from './useHabits';
import { useAccounts } from './useFinance';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EmptyLayer = 'goals' | 'projects' | 'tasks' | 'habits' | 'finance';

export interface SetupStep {
  id:           EmptyLayer;
  title:        string;
  titleEn:      string;
  description:  string;
  descriptionEn:string;
  cta:          string;
  ctaEn:        string;
  route:        string;
  done:         boolean;
  color:        string;
  bgClass:      string;
}

export interface EmptyStateData {
  isNewUser:    boolean;                              // all 5 layers empty
  emptyLayers:  EmptyLayer[];                         // which ones are empty
  nextStep:     SetupStep | null;                     // first empty step
  allSteps:     SetupStep[];                          // full checklist
  doneCount:    number;
  totalSteps:   number;
  isLoading:    boolean;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEP_DEFS: Array<Omit<SetupStep, 'done'> & { layer: EmptyLayer }> = [
  {
    id:           'goals',
    layer:        'goals',
    title:        'حدد هدفك الأول',
    titleEn:      'Set your first goal',
    description:  'الأهداف هي البوصلة — ابدأ بتحديد ما تريد تحقيقه قبل أي شيء آخر.',
    descriptionEn:'Goals are your compass — start by deciding what you want to achieve.',
    cta:          'أنشئ هدفاً',
    ctaEn:        'Create goal',
    route:        '/goals',
    color:        'violet',
    bgClass:      'from-violet-500/10 to-purple-500/5',
  },
  {
    id:           'projects',
    layer:        'projects',
    title:        'أنشئ مشروعك الأول',
    titleEn:      'Create your first project',
    description:  'جمّع المهام المترابطة في مشروع واحد لتتبع التقدم بسهولة.',
    descriptionEn:'Group related tasks in one project to track progress easily.',
    cta:          'أنشئ مشروعاً',
    ctaEn:        'Create project',
    route:        '/projects',
    color:        'blue',
    bgClass:      'from-blue-500/10 to-indigo-500/5',
  },
  {
    id:           'tasks',
    layer:        'tasks',
    title:        'أضف مهمتك الأولى',
    titleEn:      'Add your first task',
    description:  'المهام هي وحدة الإنجاز اليومي — ابدأ بشيء صغير وقابل للإنجاز.',
    descriptionEn:'Tasks are your daily execution unit — start small and achievable.',
    cta:          'أضف مهمة',
    ctaEn:        'Add task',
    route:        '/tasks',
    color:        'emerald',
    bgClass:      'from-emerald-500/10 to-teal-500/5',
  },
  {
    id:           'habits',
    layer:        'habits',
    title:        'ابنِ عادتك الأولى',
    titleEn:      'Build your first habit',
    description:  'العادات تبني النتائج على المدى البعيد — اختر عادة واحدة وابدأ بها.',
    descriptionEn:'Habits build long-term results — pick one and start today.',
    cta:          'أضف عادة',
    ctaEn:        'Add habit',
    route:        '/habits',
    color:        'amber',
    bgClass:      'from-amber-500/10 to-orange-500/5',
  },
  {
    id:           'finance',
    layer:        'finance',
    title:        'أضف حسابك البنكي',
    titleEn:      'Add your bank account',
    description:  'ربط المالية يمنحك رؤية شاملة — أضف حسابك لتبدأ تتبع دخلك ومصروفاتك.',
    descriptionEn:'Connecting finances gives you a full picture — track income and expenses.',
    cta:          'أضف حساباً',
    ctaEn:        'Add account',
    route:        '/finance',
    color:        'rose',
    bgClass:      'from-rose-500/10 to-pink-500/5',
  },
];

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useEmptyStateIntelligence(): EmptyStateData {
  const { data: tasks     = [], isLoading: tL } = useTasks();
  const { data: projects  = [], isLoading: pL } = useProjects();
  const { data: goals     = [], isLoading: gL } = useGoals();
  const { data: habits    = [], isLoading: hL } = useHabits();
  const { data: accounts  = [], isLoading: aL } = useAccounts();

  const isLoading = tL || pL || gL || hL || aL;

  const result = useMemo<Omit<EmptyStateData, 'isLoading'>>(() => {
    const emptyLayers: EmptyLayer[] = [];
    if (goals.length    === 0) emptyLayers.push('goals');
    if (projects.length === 0) emptyLayers.push('projects');
    if (tasks.length    === 0) emptyLayers.push('tasks');
    if (habits.length   === 0) emptyLayers.push('habits');
    if (accounts.length === 0) emptyLayers.push('finance');

    const allSteps: SetupStep[] = STEP_DEFS.map(def => ({
      ...def,
      done: !emptyLayers.includes(def.layer),
    }));

    const isNewUser = emptyLayers.length === 5;
    const nextStep  = allSteps.find(s => !s.done) ?? null;
    const doneCount = allSteps.filter(s => s.done).length;

    return { isNewUser, emptyLayers, nextStep, allSteps, doneCount, totalSteps: 5 };
  }, [tasks, projects, goals, habits, accounts]);

  return { ...result, isLoading };
}
