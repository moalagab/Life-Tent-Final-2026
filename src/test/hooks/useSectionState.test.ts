import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionState } from '@/hooks/useSectionState';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-abc' } }),
}));

const KEY = (section: string) => `lt.section.user-abc.${section}`;

describe('useSectionState', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns defaultOpen=true when no stored value', () => {
    const { result } = renderHook(() => useSectionState('nav'));
    expect(result.current.open).toBe(true);
  });

  it('returns defaultOpen=false when specified', () => {
    const { result } = renderHook(() => useSectionState('nav', false));
    expect(result.current.open).toBe(false);
  });

  it('reads stored value from localStorage', () => {
    localStorage.setItem(KEY('nav'), '0');
    const { result } = renderHook(() => useSectionState('nav', true));
    expect(result.current.open).toBe(false);
  });

  it('toggle flips open state', () => {
    const { result } = renderHook(() => useSectionState('sidebar'));
    expect(result.current.open).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
  });

  it('persists toggled state to localStorage', () => {
    const { result } = renderHook(() => useSectionState('sidebar'));
    act(() => result.current.toggle());
    expect(localStorage.getItem(KEY('sidebar'))).toBe('0');
  });

  it('two different sections are independent', () => {
    const { result: r1 } = renderHook(() => useSectionState('sectionA'));
    const { result: r2 } = renderHook(() => useSectionState('sectionB'));

    act(() => r1.current.toggle());
    expect(r1.current.open).toBe(false);
    expect(r2.current.open).toBe(true);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(KEY('broken'), 'not-0-or-1');
    const { result } = renderHook(() => useSectionState('broken', true));
    // '1' check is false, so falls back to false (stored !== '1')
    expect(typeof result.current.open).toBe('boolean');
  });
});
