/**
 * useCommandCenter — Orchestration hook for the Command Center.
 *
 * Aggregates day plan, focus task, predictions, and exposes
 * recalculate() which forces a full priority re-computation by
 * invalidating all task-related React Query caches.
 *
 * Focus mode state is managed externally (in the calling component)
 * via usePersistedState to avoid cross-component sync issues.
 */
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskAgent } from './useTaskAgent';
import { useDecisionEngine } from './useDecisionEngine';
import { usePredictiveEngine } from './usePredictiveEngine';
import type { ScoredTask } from './useAdaptivePriority';

export const CMD_KILL_THRESHOLD = 38;

export interface CommandCenterData {
  plan:               ReturnType<typeof useTaskAgent>['plan'];
  planLoading:        boolean;
  focusTask:          ScoredTask | null;
  mode:               ReturnType<typeof useDecisionEngine>['mode'];
  predictions:        ReturnType<typeof usePredictiveEngine>['predictions'];
  riskScore:          number;
  riskLabel:          string;
  mostUrgent:         ReturnType<typeof usePredictiveEngine>['mostUrgent'];
  eliminatableTasks:  ScoredTask[];
  isRecalculating:    boolean;
  lastRecalculated:   Date | null;
  recalculate:        () => Promise<void>;
}

export function useCommandCenter(): CommandCenterData {
  const queryClient = useQueryClient();

  const { plan, isLoading: planLoading } = useTaskAgent();
  const { focusTask, mode }              = useDecisionEngine();
  const { predictions, riskScore, riskLabel, mostUrgent } = usePredictiveEngine();

  const [isRecalculating,  setIsRecalculating]  = useState(false);
  const [lastRecalculated, setLastRecalculated] = useState<Date | null>(null);

  const recalculate = useCallback(async () => {
    setIsRecalculating(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks']          }),
      queryClient.invalidateQueries({ queryKey: ['habit_logs']     }),
      queryClient.invalidateQueries({ queryKey: ['projects']       }),
      queryClient.invalidateQueries({ queryKey: ['behavior-engine'] }),
      queryClient.invalidateQueries({ queryKey: ['operational-memory'] }),
    ]);
    await new Promise(r => setTimeout(r, 700));
    setIsRecalculating(false);
    setLastRecalculated(new Date());
  }, [queryClient]);

  // Tasks eligible to be "killed" (below score threshold, not the current focus)
  const focusTaskId = focusTask?.id;
  const allPlanTasks: ScoredTask[] = [
    ...plan.morning,
    ...plan.afternoon,
    ...plan.evening,
  ];
  const eliminatableTasks = allPlanTasks.filter(
    t => t.score < CMD_KILL_THRESHOLD && t.id !== focusTaskId,
  );

  return {
    plan,
    planLoading,
    focusTask,
    mode,
    predictions,
    riskScore,
    riskLabel,
    mostUrgent,
    eliminatableTasks,
    isRecalculating,
    lastRecalculated,
    recalculate,
  };
}
