import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (k: string) => {
      const map: Record<string, string> = {
        'tasks.newTask': 'New Task',
        'tasks.priority.low': 'Low',
        'tasks.priority.medium': 'Medium',
        'tasks.priority.high': 'High',
      };
      return map[k] ?? k;
    },
    isRTL: false,
  }),
}));

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    data: [
      { id: 'proj-1', title: 'Project Alpha', color: '#6366f1' },
      { id: 'proj-2', title: 'Project Beta', color: '#22c55e' },
    ],
  }),
}));

vi.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({
    data: [
      { id: 'goal-1', title: 'Learn TypeScript' },
    ],
  }),
}));

vi.mock('@/hooks/useHabits', () => ({
  useHabits: () => ({
    data: [
      { id: 'habit-1', name: 'Daily Exercise' },
    ],
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

function renderDialog(props = {}) {
  return render(<TaskFormDialog {...defaultProps} {...props} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TaskFormDialog — rendering', () => {
  it('shows dialog content when open=true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders "New Task" title', () => {
    renderDialog();
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('renders title input', () => {
    renderDialog();
    expect(screen.getByPlaceholderText(/Enter task title/i)).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    renderDialog();
    expect(screen.getByPlaceholderText(/Task description/i)).toBeInTheDocument();
  });

  it('renders all link-type buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /No Link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Goal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Habit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Personal/i })).toBeInTheDocument();
  });
});

describe('TaskFormDialog — submit button state', () => {
  it('submit button is disabled when title is empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /Create Task/i })).toBeDisabled();
  });

  it('submit button is enabled after typing a title', async () => {
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText(/Enter task title/i), 'My new task');
    expect(screen.getByRole('button', { name: /Create Task/i })).toBeEnabled();
  });

  it('shows spinner when isLoading=true', () => {
    renderDialog({ isLoading: true });
    // Button contains a spinner SVG (Loader2) and is disabled
    const btn = screen.getByRole('button', { name: '' }); // spinner replaces text
    expect(btn).toBeDisabled();
  });
});

describe('TaskFormDialog — form submission', () => {
  beforeEach(() => {
    defaultProps.onSubmit.mockClear();
    defaultProps.onOpenChange.mockClear();
  });

  it('calls onSubmit with the entered title', async () => {
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText(/Enter task title/i), 'Fix the bug');
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledOnce();
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Fix the bug', priority: 'medium' })
    );
  });

  it('does not call onSubmit when title is blank', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('includes description in submitted data', async () => {
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText(/Enter task title/i), 'Task');
    await userEvent.type(screen.getByPlaceholderText(/Task description/i), 'Some details');
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Some details' })
    );
  });

  it('sets initialStatus in submitted data', async () => {
    renderDialog({ initialStatus: 'in_progress' });
    await userEvent.type(screen.getByPlaceholderText(/Enter task title/i), 'WIP task');
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' })
    );
  });
});

describe('TaskFormDialog — link type selection', () => {
  it('shows project selector when Project is clicked', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /^Project$/i }));
    expect(screen.getByText(/Select Project/i)).toBeInTheDocument();
  });

  it('shows goal selector when Goal is clicked', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /^Goal$/i }));
    expect(screen.getByText(/Select Goal/i)).toBeInTheDocument();
  });

  it('shows habit selector when Habit is clicked', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /^Habit$/i }));
    expect(screen.getByText(/Select Habit/i)).toBeInTheDocument();
  });

  it('hides project selector when No Link is clicked after Project', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: /^Project$/i }));
    expect(screen.getByText(/Select Project/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /No Link/i }));
    expect(screen.queryByText(/Select Project/i)).not.toBeInTheDocument();
  });

  it('sets is_focus true when Focus Task toggle is switched on', async () => {
    renderDialog();
    await userEvent.type(screen.getByPlaceholderText(/Enter task title/i), 'Focus task');
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ is_focus: true })
    );
  });
});
