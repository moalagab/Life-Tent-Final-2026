import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes (falsy values)', () => {
    const flag = false as boolean;
    expect(cn('foo', flag && 'bar', undefined, null, '')).toBe('foo');
  });

  it('handles conditional classes (truthy values)', () => {
    const active = true;
    expect(cn('base', active && 'active')).toBe('base active');
  });

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    // tailwind-merge resolves conflicting utilities
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles object syntax', () => {
    expect(cn({ 'foo': true, 'bar': false })).toBe('foo');
  });

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('preserves non-conflicting classes', () => {
    const result = cn('flex items-center', 'justify-between');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('justify-between');
  });
});
