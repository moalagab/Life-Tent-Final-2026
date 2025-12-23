import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

export async function exportToPDF(elementId: string, options: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Create canvas from element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Add header
  pdf.setFontSize(18);
  pdf.setTextColor(40, 40, 40);
  pdf.text(options.title, 20, 20);
  
  if (options.subtitle) {
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(options.subtitle, 20, 28);
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 35);

  // Add content
  let heightLeft = imgHeight;
  let position = 45; // Start after header
  
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth - 20, imgHeight);
  heightLeft -= (pageHeight - position);

  // Add new pages if needed
  while (heightLeft > 0) {
    position = 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position - imgHeight + heightLeft + pageHeight, imgWidth - 20, imgHeight);
    heightLeft -= pageHeight;
  }

  // Save PDF
  pdf.save(`${options.filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateFinanceReportPDF(data: {
  netWorth: number;
  income: number;
  expenses: number;
  savingsRate: number;
  period: string;
  accounts?: Array<{ name: string; balance: number }>;
  categories?: Array<{ name: string; amount: number }>;
  debts?: Array<{ name: string; remaining: number }>;
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  let y = 20;

  // Header
  pdf.setFontSize(22);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Financial Report', pageWidth / 2, y, { align: 'center' });
  y += 10;

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(data.period, pageWidth / 2, y, { align: 'center' });
  y += 5;

  pdf.setFontSize(9);
  pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Summary Cards
  pdf.setDrawColor(200, 200, 200);
  pdf.setFillColor(250, 250, 250);
  
  const cardWidth = 45;
  const cardHeight = 25;
  const startX = 15;
  const gap = 5;

  // Net Worth Card
  pdf.roundedRect(startX, y, cardWidth, cardHeight, 3, 3, 'FD');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Net Worth', startX + 5, y + 8);
  pdf.setFontSize(12);
  pdf.setTextColor(40, 40, 40);
  pdf.text(`${data.netWorth.toLocaleString()} SAR`, startX + 5, y + 18);

  // Income Card
  pdf.roundedRect(startX + cardWidth + gap, y, cardWidth, cardHeight, 3, 3, 'FD');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Income', startX + cardWidth + gap + 5, y + 8);
  pdf.setFontSize(12);
  pdf.setTextColor(34, 197, 94);
  pdf.text(`${data.income.toLocaleString()} SAR`, startX + cardWidth + gap + 5, y + 18);

  // Expenses Card
  pdf.roundedRect(startX + (cardWidth + gap) * 2, y, cardWidth, cardHeight, 3, 3, 'FD');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Expenses', startX + (cardWidth + gap) * 2 + 5, y + 8);
  pdf.setFontSize(12);
  pdf.setTextColor(239, 68, 68);
  pdf.text(`${data.expenses.toLocaleString()} SAR`, startX + (cardWidth + gap) * 2 + 5, y + 18);

  // Savings Rate Card
  pdf.roundedRect(startX + (cardWidth + gap) * 3, y, cardWidth, cardHeight, 3, 3, 'FD');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Savings Rate', startX + (cardWidth + gap) * 3 + 5, y + 8);
  pdf.setFontSize(12);
  pdf.setTextColor(data.savingsRate >= 20 ? 34 : data.savingsRate >= 10 ? 245 : 239, 
                   data.savingsRate >= 20 ? 197 : data.savingsRate >= 10 ? 158 : 68, 
                   data.savingsRate >= 20 ? 94 : data.savingsRate >= 10 ? 11 : 68);
  pdf.text(`${data.savingsRate}%`, startX + (cardWidth + gap) * 3 + 5, y + 18);

  y += cardHeight + 15;

  // Accounts Section
  if (data.accounts && data.accounts.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Accounts', 15, y);
    y += 8;

    pdf.setFontSize(10);
    data.accounts.forEach(acc => {
      pdf.setTextColor(60, 60, 60);
      pdf.text(acc.name, 20, y);
      pdf.text(`${acc.balance.toLocaleString()} SAR`, pageWidth - 50, y);
      y += 6;
    });
    y += 10;
  }

  // Categories Section
  if (data.categories && data.categories.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Spending by Category', 15, y);
    y += 8;

    pdf.setFontSize(10);
    data.categories.forEach(cat => {
      pdf.setTextColor(60, 60, 60);
      pdf.text(cat.name, 20, y);
      pdf.text(`${cat.amount.toLocaleString()} SAR`, pageWidth - 50, y);
      y += 6;
    });
    y += 10;
  }

  // Debts Section
  if (data.debts && data.debts.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Debts', 15, y);
    y += 8;

    pdf.setFontSize(10);
    data.debts.forEach(debt => {
      pdf.setTextColor(60, 60, 60);
      pdf.text(debt.name, 20, y);
      pdf.setTextColor(239, 68, 68);
      pdf.text(`${debt.remaining.toLocaleString()} SAR`, pageWidth - 50, y);
      y += 6;
    });
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This report is auto-generated. All amounts are in SAR.', pageWidth / 2, 285, { align: 'center' });

  // Save
  pdf.save(`financial-report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
