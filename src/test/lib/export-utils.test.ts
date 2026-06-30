import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock jsPDF before importing export-utils ──────────────────────────────────
vi.mock('jspdf', () => ({
  default: class MockJsPDF {
    setFontSize = vi.fn().mockReturnThis();
    setFont = vi.fn().mockReturnThis();
    text = vi.fn().mockReturnThis();
    addPage = vi.fn().mockReturnThis();
    save = vi.fn();
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    getTextWidth = vi.fn(() => 40);
  },
}));

// ── Static imports (after mock declarations — vitest hoists vi.mock) ──────────
import {
  exportToCSV,
  exportTransactions,
  exportAccounts,
  exportTasks,
  exportFullBackup,
} from '@/lib/export-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
let lastBlobContent = '';

beforeEach(() => {
  vi.clearAllMocks();
  lastBlobContent = '';

  vi.stubGlobal('Blob', class MockBlob {
    constructor(parts: BlobPart[]) {
      lastBlobContent = parts.map(String).join('');
    }
  });

  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });

  const mockAnchor = { href: '', download: '', click: mockClick };
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── exportToCSV ───────────────────────────────────────────────────────────────

describe('exportToCSV', () => {
  it('includes headers in the CSV output', () => {
    exportToCSV({
      filename: 'test',
      headers: ['Name', 'Amount'],
      data: [{ name: 'Coffee', amount: 5 }],
      fields: ['name', 'amount'],
    });
    expect(lastBlobContent).toContain('Name,Amount');
    expect(lastBlobContent).toContain('Coffee');
    expect(lastBlobContent).toContain('5');
  });

  it('wraps values containing commas in double quotes', () => {
    exportToCSV({
      filename: 'test',
      headers: ['Description'],
      data: [{ description: 'Coffee, milk, sugar' }],
      fields: ['description'],
    });
    expect(lastBlobContent).toContain('"Coffee, milk, sugar"');
  });

  it('handles null/undefined as empty string', () => {
    exportToCSV({
      filename: 'test',
      headers: ['Name', 'Notes'],
      data: [{ name: 'Task', notes: null }],
      fields: ['name', 'notes'],
    });
    expect(lastBlobContent).toContain('Task,');
  });

  it('triggers link click and revokes URL', () => {
    exportToCSV({
      filename: 'test',
      headers: ['Col'],
      data: [{ col: 'val' }],
      fields: ['col'],
    });
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('multiple rows are all present in output', () => {
    exportToCSV({
      filename: 'test',
      headers: ['Title'],
      data: [{ title: 'Row One' }, { title: 'Row Two' }, { title: 'Row Three' }],
      fields: ['title'],
    });
    expect(lastBlobContent).toContain('Row One');
    expect(lastBlobContent).toContain('Row Two');
    expect(lastBlobContent).toContain('Row Three');
  });
});

// ── exportTransactions ────────────────────────────────────────────────────────

describe('exportTransactions', () => {
  it('generates CSV with transaction headers', () => {
    exportTransactions([
      { date: '2025-01-01', description: 'Salary', amount: 5000, type: 'income', category: 'Work', currency: 'USD' },
    ]);
    expect(lastBlobContent).toContain('Date');
    expect(lastBlobContent).toContain('Salary');
    expect(mockClick).toHaveBeenCalled();
  });

  it('works with empty array', () => {
    expect(() => exportTransactions([])).not.toThrow();
    expect(lastBlobContent).toContain('Date');
  });
});

// ── exportAccounts ────────────────────────────────────────────────────────────

describe('exportAccounts', () => {
  it('exports account data to CSV', () => {
    exportAccounts([
      { name: 'Checking', type: 'bank', balance: 1000, currency: 'USD', created_at: '2025-01-01' },
    ]);
    expect(lastBlobContent).toContain('Checking');
    expect(mockClick).toHaveBeenCalled();
  });
});

// ── exportTasks ───────────────────────────────────────────────────────────────

describe('exportTasks', () => {
  it('exports tasks with correct headers', () => {
    exportTasks([
      { title: 'My Task', description: 'desc', status: 'todo', priority: 'high', due_date: '2025-06-01', created_at: '2025-01-01' },
    ]);
    expect(lastBlobContent).toContain('My Task');
    expect(lastBlobContent).toContain('Title');
  });
});

// ── exportFullBackup ──────────────────────────────────────────────────────────

describe('exportFullBackup', () => {
  it('creates a JSON backup with version and exportDate', () => {
    exportFullBackup({
      tasks: [{ id: '1', title: 'Task A', status: 'todo', priority: 'medium', created_at: '2025-01-01' }],
    });
    expect(lastBlobContent).toContain('"version"');
    expect(lastBlobContent).toContain('"exportDate"');
    expect(lastBlobContent).toContain('Task A');
    expect(mockClick).toHaveBeenCalled();
  });

  it('works with an empty backup object', () => {
    expect(() => exportFullBackup({})).not.toThrow();
    expect(lastBlobContent).toContain('"version"');
  });

  it('includes all provided data sections', () => {
    exportFullBackup({
      tasks: [{ id: '1', title: 'Task', status: 'todo', priority: 'low', created_at: '2025-01-01' }],
      accounts: [{ id: '2', name: 'Wallet', type: 'cash', balance: 500, currency: 'SAR', created_at: '2025-01-01' }],
    });
    expect(lastBlobContent).toContain('Task');
    expect(lastBlobContent).toContain('Wallet');
  });
});
