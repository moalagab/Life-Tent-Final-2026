import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface ExportOptions {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
  fields: string[];
}

export function exportToCSV({ filename, headers, data, fields }: ExportOptions) {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      fields.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

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

export function exportToExcel({ filename, headers, data, fields }: ExportOptions) {
  const csvContent = [
    headers.join('\t'),
    ...data.map(row =>
      fields.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        return String(value).replace(/\t/g, ' ');
      }).join('\t')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF({ filename, headers, data, fields }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(16);
  doc.text(filename.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, 22, { align: 'center' });
  
  let y = 35;
  const colWidth = (pageWidth - 20) / headers.length;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
  doc.setFontSize(8);
  
  headers.forEach((header, i) => {
    doc.text(header, 12 + i * colWidth, y, { maxWidth: colWidth - 2 });
  });
  
  y += 10;
  
  data.forEach((row, rowIndex) => {
    if (y > 280) { doc.addPage(); y = 20; }
    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(10, y - 4, pageWidth - 20, 7, 'F');
    }
    fields.forEach((field, i) => {
      const value = row[field];
      const text = value === null || value === undefined ? '' : String(value).substring(0, 20);
      doc.text(text, 12 + i * colWidth, y, { maxWidth: colWidth - 2 });
    });
    y += 7;
  });
  
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportTransactions(transactions: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'transactions', headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Currency'], data: transactions, fields: ['date', 'description', 'amount', 'type', 'category', 'currency'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportAccounts(accounts: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'accounts', headers: ['Name', 'Type', 'Balance', 'Currency', 'Created At'], data: accounts, fields: ['name', 'type', 'balance', 'currency', 'created_at'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportTasks(tasks: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'tasks', headers: ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Created At'], data: tasks, fields: ['title', 'description', 'status', 'priority', 'due_date', 'created_at'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportHabits(habits: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'habits', headers: ['Name', 'Description', 'Frequency', 'Target Count', 'Active', 'Created At'], data: habits, fields: ['name', 'description', 'frequency', 'target_count', 'is_active', 'created_at'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportGoals(goals: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'goals', headers: ['Title', 'Description', 'Perspective', 'Current Value', 'Target Value', 'Active'], data: goals, fields: ['title', 'description', 'perspective', 'current_value', 'target_value', 'is_active'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportProjects(projects: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'projects', headers: ['Title', 'Description', 'Status', 'Phase', 'Progress', 'Due Date'], data: projects, fields: ['title', 'description', 'status', 'phase', 'progress', 'due_date'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

export function exportDebts(debts: any[], fmt: 'csv' | 'excel' | 'pdf' = 'csv') {
  const options = { filename: 'debts', headers: ['Name', 'Lender', 'Total Amount', 'Remaining', 'Interest Rate', 'Status'], data: debts, fields: ['name', 'lender', 'total_amount', 'remaining_amount', 'interest_rate', 'status'] };
  if (fmt === 'excel') exportToExcel(options); else if (fmt === 'pdf') exportToPDF(options); else exportToCSV(options);
}

 
 
 
 
 
 
 
export function exportFullBackup(allData: { tasks?: any[]; projects?: any[]; goals?: any[]; habits?: any[]; transactions?: any[]; accounts?: any[]; debts?: any[]; notes?: any[]; }) {
  const backup = { exportDate: new Date().toISOString(), version: '1.0', data: allData };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lifetent_backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
