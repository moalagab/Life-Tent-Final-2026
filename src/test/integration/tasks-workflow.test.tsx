/**
 * Integration tests — Tasks workflow
 *
 * Tests the full React Query cycle across the task hooks:
 *   useTasks · useCreateTask · useUpdateTask · useDeleteTask
 *
 * Strategy: a stateful in-memory Supabase mock (vi.hoisted) behaves like a real
 * DB. Each mutation updates the mock store, React Query's invalidateQueries then
 * re-fetches so the same useTasks hook returns fresh data within the same test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/useTasks';

// ── Hoisted mock infrastructure ────────────────────────────────────────────
// vi.hoisted runs before any vi.mock factories — guarantees mockDb and
// makeChain are in scope when the factory is evaluated.

const { mockDb, makeChain } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, unknown>[]> = {};

  /** Builds a lazy Supabase query-builder chain backed by mockDb */
  function makeChain(table: string) {
    let insertPayload: Record<string, unknown> | null = null;
    let updatePayload: Record<string, unknown> | null = null;
    let deleteMode = false;
    const eqFilters: Array<[string, unknown]> = [];

    const match = (r: Record<string, unknown>) =>
      eqFilters.every(([k, v]) => r[k] === v);

    /** Execute the accumulated query against mockDb */
    const run = (): { data: unknown; error: null } => {
      const rows = (mockDb[table] ?? []) as Record<string, unknown>[];
      if (insertPayload) {
        const row = { id: `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...insertPayload };
        mockDb[table] = [...rows, row];
        return { data: row, error: null };
      }
      if (updatePayload) {
        const next = rows.map(r => (match(r) ? { ...r, ...updatePayload } : r));
        mockDb[table] = next;
        const updated = next.filter(match);
        return { data: updated[0] ?? null, error: null };
      }
      if (deleteMode) {
        mockDb[table] = rows.filter(r => !match(r));
        return { data: null, error: null };
      }
      return { data: rows.filter(match), error: null };
    };

    const chain: Record<string, unknown> = {
      select: () => chain,
      insert: (d: Record<string, unknown>) => { insertPayload = d; return chain; },
      update: (d: Record<string, unknown>) => { updatePayload = d; return chain; },
      delete: () => { deleteMode = true; return chain; },
      upsert: (d: Record<string, unknown>) => { insertPayload = d; return chain; },
      eq: (k: string, v: unknown) => { eqFilters.push([k, v]); return chain; },
      // Passthrough filters
      neq: () => chain, order: () => chain, limit: () => chain,
      gte: () => chain, lte: () => chain, is: () => chain, in: () => chain,
      not: () => chain, filter: () => chain, match: () => chain,
      // Thenable — resolved when the chain is awaited directly
      then: (resolve: (v: { data: unknown; error: null }) => unknown) => resolve(run()),
      // Terminal — returns a real Promise with one row
      single: () => {
        const r = run();
        return Promise.resolve({ data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null });
      },
      maybeSingle: () => {
        const r = run();
        return Promise.resolve({ data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null });
      },
    };
    return chain;
  }

  return { mockDb, makeChain };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => makeChain(table),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, loading: false }),
}));

// ── Test helpers ───────────────────────────────────────────────────────────

/** Fresh QueryClient per test — no cache bleed between tests */
function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const SEED_TASKS = [
  { id: 'task-1', title: 'Write tests', status: 'todo', priority: 'medium', user_id: 'user-123', position: 0, is_focus: false, description: null, due_date: null, project_id: null, recurrence: 'none' },
  { id: 'task-2', title: 'Fix bugs', status: 'in_progress', priority: 'high', user_id: 'user-123', position: 1, is_focus: true, description: null, due_date: null, project_id: null, recurrence: 'none' },
];

beforeEach(() => {
  // Reset the in-memory DB to a clean slate before every test
  for (const key of Object.keys(mockDb)) delete mockDb[key];
  mockDb['tasks'] = SEED_TASKS.map(t => ({ ...t }));
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useTasks — fetch', () => {
  it('returns all seeded tasks', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({ title: 'Write tests', status: 'todo' });
    expect(result.current.data?.[1]).toMatchObject({ title: 'Fix bugs', status: 'in_progress' });
  });

  it('returns empty list when no tasks exist', async () => {
    mockDb['tasks'] = [];
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});

describe('useCreateTask — create → cache invalidation', () => {
  it('new task appears in useTasks after mutation', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), create: useCreateTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));
    expect(result.current.tasks.data).toHaveLength(2);

    await act(async () => {
      await result.current.create.mutateAsync({
        title: 'Deploy to prod',
        status: 'todo',
        priority: 'low',
      });
    });

    await waitFor(() => expect(result.current.tasks.data).toHaveLength(3));
    expect(result.current.tasks.data?.find(t => t.title === 'Deploy to prod')).toBeDefined();
  });

  it('created task has correct priority', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), create: useCreateTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.create.mutateAsync({ title: 'Urgent fix', status: 'todo', priority: 'urgent' });
    });

    await waitFor(() => expect(result.current.tasks.data).toHaveLength(3));
    const created = result.current.tasks.data?.find(t => t.title === 'Urgent fix');
    expect(created?.priority).toBe('urgent');
  });
});

describe('useUpdateTask — update → cache invalidation', () => {
  it('updated status is reflected in useTasks', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), update: useUpdateTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.update.mutateAsync({ id: 'task-1', status: 'done' });
    });

    await waitFor(() => {
      const task = result.current.tasks.data?.find(t => t.id === 'task-1');
      expect(task?.status).toBe('done');
    });
  });

  it('updates priority without changing other fields', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), update: useUpdateTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.update.mutateAsync({ id: 'task-1', priority: 'urgent' });
    });

    await waitFor(() => {
      const task = result.current.tasks.data?.find(t => t.id === 'task-1');
      expect(task?.priority).toBe('urgent');
      expect(task?.title).toBe('Write tests'); // unchanged
    });
  });

  it('toggling is_focus updates the focus flag', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), update: useUpdateTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.update.mutateAsync({ id: 'task-1', is_focus: true });
    });

    await waitFor(() => {
      const task = result.current.tasks.data?.find(t => t.id === 'task-1');
      expect(task?.is_focus).toBe(true);
    });
  });
});

describe('useDeleteTask — delete → cache invalidation', () => {
  it('deleted task disappears from useTasks', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), del: useDeleteTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));
    expect(result.current.tasks.data).toHaveLength(2);

    await act(async () => {
      await result.current.del.mutateAsync('task-1');
    });

    await waitFor(() => expect(result.current.tasks.data).toHaveLength(1));
    expect(result.current.tasks.data?.find(t => t.id === 'task-1')).toBeUndefined();
    expect(result.current.tasks.data?.[0]).toMatchObject({ id: 'task-2' });
  });

  it('deleting last task leaves empty list', async () => {
    mockDb['tasks'] = [SEED_TASKS[0]];
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ tasks: useTasks(), del: useDeleteTask() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.del.mutateAsync('task-1');
    });

    await waitFor(() => expect(result.current.tasks.data).toHaveLength(0));
  });
});
