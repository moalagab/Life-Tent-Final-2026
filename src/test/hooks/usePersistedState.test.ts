import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '@/hooks/usePersistedState';

// Mock useAuth — the hook scopes keys by user ID
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' } }),
}));

// Key shape after scoping: lt.<key>.test-user-123
const SCOPED = (key: string) => `lt.${key}.test-user-123`;

describe('usePersistedState', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns the default value when localStorage is empty', () => {
    const { result } = renderHook(() => usePersistedState('k', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads an existing value from localStorage', () => {
    localStorage.setItem(SCOPED('k'), JSON.stringify('stored'));
    const { result } = renderHook(() => usePersistedState('k', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists a new value to localStorage', () => {
    const { result } = renderHook(() => usePersistedState('k', 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem(SCOPED('k'))!)).toBe(42);
  });

  it('handles object values', () => {
    const { result } = renderHook(() =>
      usePersistedState('obj', { active: false })
    );
    act(() => result.current[1]({ active: true }));
    expect(result.current[0]).toEqual({ active: true });
  });

  it('handles array values', () => {
    const { result } = renderHook(() =>
      usePersistedState<string[]>('arr', [])
    );
    act(() => result.current[1](['a', 'b']));
    expect(result.current[0]).toEqual(['a', 'b']);
  });

  it('falls back to default on corrupted localStorage', () => {
    localStorage.setItem(SCOPED('bad'), 'not-valid-json{{{');
    const { result } = renderHook(() => usePersistedState('bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('accepts updater function', () => {
    const { result } = renderHook(() => usePersistedState('n', 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it('two hooks with different keys do not interfere', () => {
    const { result: r1 } = renderHook(() => usePersistedState('k1', 'a'));
    const { result: r2 } = renderHook(() => usePersistedState('k2', 'b'));
    act(() => r1.current[1]('updated'));
    expect(r1.current[0]).toBe('updated');
    expect(r2.current[0]).toBe('b');
  });
});
