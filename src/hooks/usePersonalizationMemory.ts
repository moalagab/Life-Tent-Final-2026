/**
 * usePersonalizationMemory — Persistent behavioral profile accumulator.
 *
 * Stores rolling history of BehaviorProfile snapshots in localStorage.
 * Exposes derived trends:
 *   - weeklyCompletionTrend: improving / declining / stable
 *   - avgEnergy: rolling 7-day average
 *   - consistentPeakHour: most common peak hour in last 14 snapshots
 *   - preferredFocusWindow: morning / afternoon / evening
 *   - totalTasksCompleted: lifetime counter
 *
 * Also stores user-acknowledged insights so the morning brief
 * doesn't repeat the same advice every day.
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { BehaviorProfile } from './useBehaviorEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProfileSnapshot {
  date: string;                     // yyyy-MM-dd
  completionRate: number;
  procrastinationScore: number;
  energyEstimate: number;
  peakHour: number;
  stalledCount: number;
  riskLevel: BehaviorProfile['todayRiskLevel'];
}

export interface PersonalizationMemory {
  snapshots: ProfileSnapshot[];     // max 30, newest first
  acknowledgedInsights: string[];   // insight keys user has dismissed
  totalTasksCompleted: number;
  lastUpdated: string;
}

export interface DerivedTrends {
  weeklyCompletionTrend: 'improving' | 'declining' | 'stable';
  avgEnergy: number;                // 1–5
  consistentPeakHour: number;       // most frequent peak hour
  preferredFocusWindow: 'morning' | 'afternoon' | 'evening' | 'unknown';
  totalTasksCompleted: number;
  snapshotCount: number;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const MEMORY_VERSION = 1;

function storageKey(userId: string) {
  return `lt.personalization.v${MEMORY_VERSION}.${userId}`;
}

function loadMemory(userId: string): PersonalizationMemory {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw) as PersonalizationMemory;
  } catch {
    // corrupt data — start fresh
  }
  return {
    snapshots: [],
    acknowledgedInsights: [],
    totalTasksCompleted: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function saveMemory(userId: string, memory: PersonalizationMemory): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(memory));
  } catch {
    // storage full — remove oldest snapshot and retry
    memory.snapshots = memory.snapshots.slice(0, 15);
    try { localStorage.setItem(storageKey(userId), JSON.stringify(memory)); } catch { /* give up */ }
  }
}

function mode(arr: number[]): number {
  if (arr.length === 0) return 9; // default morning
  const freq: Record<number, number> = {};
  for (const v of arr) freq[v] = (freq[v] ?? 0) + 1;
  return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function usePersonalizationMemory() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';

  /** Persist a new snapshot from the behavior engine */
  const recordSnapshot = useCallback((profile: BehaviorProfile, completedToday: number) => {
    const today = new Date().toISOString().split('T')[0];
    const memory = loadMemory(userId);

    // Avoid duplicate snapshots for the same day
    const already = memory.snapshots[0]?.date === today;
    if (!already) {
      const snapshot: ProfileSnapshot = {
        date: today,
        completionRate: profile.completionRate,
        procrastinationScore: profile.procrastinationScore,
        energyEstimate: profile.energyEstimate,
        peakHour: profile.peakHour,
        stalledCount: profile.stalledTaskIds.length,
        riskLevel: profile.todayRiskLevel,
      };
      memory.snapshots = [snapshot, ...memory.snapshots].slice(0, 30);
    }

    memory.totalTasksCompleted += completedToday;
    memory.lastUpdated = new Date().toISOString();
    saveMemory(userId, memory);
  }, [userId]);

  /** Mark an insight as acknowledged so it won't repeat */
  const acknowledgeInsight = useCallback((key: string) => {
    const memory = loadMemory(userId);
    if (!memory.acknowledgedInsights.includes(key)) {
      memory.acknowledgedInsights = [...memory.acknowledgedInsights, key].slice(-50);
      saveMemory(userId, memory);
    }
  }, [userId]);

  /** Check if an insight was already acknowledged */
  const isInsightAcknowledged = useCallback((key: string): boolean => {
    const memory = loadMemory(userId);
    return memory.acknowledgedInsights.includes(key);
  }, [userId]);

  /** Derive trends from stored snapshots */
  const trends = useMemo((): DerivedTrends => {
    const memory = loadMemory(userId);
    const snaps  = memory.snapshots;

    if (snaps.length === 0) {
      return {
        weeklyCompletionTrend: 'stable',
        avgEnergy: 3,
        consistentPeakHour: 9,
        preferredFocusWindow: 'unknown',
        totalTasksCompleted: memory.totalTasksCompleted,
        snapshotCount: 0,
      };
    }

    // Weekly completion trend: compare last 7 vs previous 7
    const last7  = snaps.slice(0, 7).map(s => s.completionRate);
    const prev7  = snaps.slice(7, 14).map(s => s.completionRate);
    const avg    = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const diff   = avg(last7) - avg(prev7);
    const weeklyCompletionTrend =
      diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable';

    // Average energy (last 7)
    const avgEnergy = Math.round(avg(last7.map((_, i) => snaps[i]?.energyEstimate ?? 3)));

    // Consistent peak hour
    const peakHours = snaps.slice(0, 14).map(s => s.peakHour);
    const consistentPeakHour = mode(peakHours);

    // Focus window
    const preferredFocusWindow =
      consistentPeakHour >= 5 && consistentPeakHour <= 11  ? 'morning'
      : consistentPeakHour >= 12 && consistentPeakHour <= 17 ? 'afternoon'
      : consistentPeakHour >= 18                              ? 'evening'
      : 'unknown';

    return {
      weeklyCompletionTrend,
      avgEnergy,
      consistentPeakHour,
      preferredFocusWindow,
      totalTasksCompleted: memory.totalTasksCompleted,
      snapshotCount: snaps.length,
    };
  }, [userId]);

  /** Raw memory (for debugging / export) */
  const rawMemory = useMemo(() => loadMemory(userId), [userId]);

  return {
    trends,
    rawMemory,
    recordSnapshot,
    acknowledgeInsight,
    isInsightAcknowledged,
  };
}
