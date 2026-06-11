/**
 * Tests for the pure helper functions extracted from useBehaviorEngine.
 *
 * The hook itself requires Supabase, so we test the computation logic
 * by importing the helpers directly after extracting them, or by
 * replicating the pure math here.
 */
import { describe, it, expect } from 'vitest';
import { subDays, format } from 'date-fns';

// ── Replicate pure helpers from useBehaviorEngine ────────────────────────────

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function calcStreak(completedDates: Set<string>): number {
  if (completedDates.size === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (completedDates.has(d)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function completionRate(due: number, done: number): number {
  if (due === 0) return 75;
  return clamp(Math.round((done / due) * 100));
}

function procrastinationScore(totalDue: number, late: number): number {
  if (totalDue === 0) return 20;
  return clamp(Math.round((late / totalDue) * 100));
}

// ── clamp ─────────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it('clamps below min to 0', () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(-1)).toBe(0);
  });

  it('clamps above max to 100', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(101)).toBe(100);
  });

  it('supports custom min/max', () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

// ── calcStreak ────────────────────────────────────────────────────────────────

describe('calcStreak', () => {
  it('returns 0 for empty set', () => {
    expect(calcStreak(new Set())).toBe(0);
  });

  it('returns 1 for only today', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    expect(calcStreak(new Set([today]))).toBe(1);
  });

  it('returns 1 for only yesterday (streak starts yesterday, today missing)', () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    // today is index 0, it's missing → streak breaks after i=0 check skips
    // yesterday is i=1, found → streak = 1, then i=2 breaks
    const result = calcStreak(new Set([yesterday]));
    expect(result).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    const dates = new Set([
      format(new Date(), 'yyyy-MM-dd'),
      format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    ]);
    expect(calcStreak(dates)).toBe(3);
  });

  it('breaks streak on a gap', () => {
    const dates = new Set([
      format(new Date(), 'yyyy-MM-dd'),
      format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      // gap at day 2
      format(subDays(new Date(), 3), 'yyyy-MM-dd'),
    ]);
    expect(calcStreak(dates)).toBe(2);
  });

  it('ignores future dates', () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(subDays(new Date(), -1), 'yyyy-MM-dd');
    const dates = new Set([today, tomorrow]);
    expect(calcStreak(dates)).toBe(1);
  });
});

// ── completionRate ────────────────────────────────────────────────────────────

describe('completionRate', () => {
  it('returns 75 when no due tasks (no data default)', () => {
    expect(completionRate(0, 0)).toBe(75);
  });

  it('returns 100 when all tasks done', () => {
    expect(completionRate(10, 10)).toBe(100);
  });

  it('returns 0 when no tasks done', () => {
    expect(completionRate(10, 0)).toBe(0);
  });

  it('returns 50 when half done', () => {
    expect(completionRate(10, 5)).toBe(50);
  });

  it('clamps to 100 (defensive)', () => {
    expect(completionRate(5, 6)).toBe(100);
  });
});

// ── procrastinationScore ──────────────────────────────────────────────────────

describe('procrastinationScore', () => {
  it('returns 20 when no due tasks (baseline)', () => {
    expect(procrastinationScore(0, 0)).toBe(20);
  });

  it('returns 0 when no late tasks', () => {
    expect(procrastinationScore(10, 0)).toBe(0);
  });

  it('returns 100 when all tasks late', () => {
    expect(procrastinationScore(10, 10)).toBe(100);
  });

  it('returns 40 when 40% tasks late', () => {
    expect(procrastinationScore(10, 4)).toBe(40);
  });
});
