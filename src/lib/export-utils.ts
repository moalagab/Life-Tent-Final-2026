import { format } from 'date-fns';

interface ExportOptions {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
  fields: string[];
}

export function exportToCSV({ filename, headers, data, fields }: ExportOptions) {
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      fields.map(field => {
        const value = row[field];
        // Handle values with commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactions(transactions: any[]) {
  exportToCSV({
    filename: 'transactions',
    headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Currency'],
    data: transactions,
    fields: ['date', 'description', 'amount', 'type', 'category', 'currency']
  });
}

export function exportAccounts(accounts: any[]) {
  exportToCSV({
    filename: 'accounts',
    headers: ['Name', 'Type', 'Balance', 'Currency', 'Created At'],
    data: accounts,
    fields: ['name', 'type', 'balance', 'currency', 'created_at']
  });
}

export function exportTasks(tasks: any[]) {
  exportToCSV({
    filename: 'tasks',
    headers: ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Created At'],
    data: tasks,
    fields: ['title', 'description', 'status', 'priority', 'due_date', 'created_at']
  });
}

export function exportHabits(habits: any[]) {
  exportToCSV({
    filename: 'habits',
    headers: ['Name', 'Description', 'Frequency', 'Target Count', 'Active', 'Created At'],
    data: habits,
    fields: ['name', 'description', 'frequency', 'target_count', 'is_active', 'created_at']
  });
}

export function exportGoals(goals: any[]) {
  exportToCSV({
    filename: 'goals',
    headers: ['Title', 'Description', 'Perspective', 'Current Value', 'Target Value', 'Active'],
    data: goals,
    fields: ['title', 'description', 'perspective', 'current_value', 'target_value', 'is_active']
  });
}

export function exportProjects(projects: any[]) {
  exportToCSV({
    filename: 'projects',
    headers: ['Title', 'Description', 'Status', 'Phase', 'Progress', 'Due Date'],
    data: projects,
    fields: ['title', 'description', 'status', 'phase', 'progress', 'due_date']
  });
}
