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

export function generateCourseNotesPDF(data: {
  courseTitle: string;
  notes: Array<{ title: string; content: string | null; note_type: string | null; is_important: boolean | null }>;
  lessons?: Array<{ title: string; is_completed: boolean | null }>;
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Header
  pdf.setFontSize(22);
  pdf.setTextColor(40, 40, 40);
  pdf.text(data.courseTitle, pageWidth / 2, y, { align: 'center' });
  y += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Course Notes', pageWidth / 2, y, { align: 'center' });
  y += 5;

  pdf.setFontSize(9);
  pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Course Progress Section (if lessons provided)
  if (data.lessons && data.lessons.length > 0) {
    const completed = data.lessons.filter(l => l.is_completed).length;
    const total = data.lessons.length;
    const progress = Math.round((completed / total) * 100);

    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Course Progress', margin, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${completed} of ${total} lessons completed (${progress}%)`, margin, y);
    y += 10;

    // Draw progress bar
    pdf.setDrawColor(220, 220, 220);
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(margin, y, contentWidth, 4, 2, 2, 'F');
    
    if (progress > 0) {
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(margin, y, (contentWidth * progress) / 100, 4, 2, 2, 'F');
    }
    y += 15;
  }

  // Notes Section
  pdf.setFontSize(14);
  pdf.setTextColor(40, 40, 40);
  pdf.text(`Notes (${data.notes.length})`, margin, y);
  y += 10;

  if (data.notes.length === 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('No notes available.', margin, y);
    y += 10;
  } else {
    data.notes.forEach((note, index) => {
      checkPageBreak(30);

      // Note type badge
      const noteType = note.note_type || 'note';
      const typeColors: Record<string, [number, number, number]> = {
        'note': [100, 100, 100],
        'summary': [59, 130, 246],
        'key_point': [234, 179, 8],
        'question': [168, 85, 247],
      };
      const typeColor = typeColors[noteType] || typeColors['note'];

      // Note container
      pdf.setDrawColor(230, 230, 230);
      pdf.setFillColor(250, 250, 250);
      const noteHeight = 25 + (note.content ? Math.ceil(note.content.length / 80) * 5 : 0);
      pdf.roundedRect(margin, y, contentWidth, Math.min(noteHeight, 60), 3, 3, 'FD');

      // Important indicator
      if (note.is_important) {
        pdf.setFillColor(234, 179, 8);
        pdf.circle(margin + 5, y + 6, 2, 'F');
      }

      // Note title
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      const titleX = note.is_important ? margin + 10 : margin + 5;
      pdf.text(note.title, titleX, y + 8);

      // Note type label
      pdf.setFontSize(8);
      pdf.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
      pdf.text(noteType.replace('_', ' ').toUpperCase(), margin + contentWidth - 5, y + 8, { align: 'right' });

      // Note content
      if (note.content) {
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(note.content, contentWidth - 10);
        const maxLines = 4;
        const displayLines = lines.slice(0, maxLines);
        if (lines.length > maxLines) {
          displayLines[maxLines - 1] = displayLines[maxLines - 1].substring(0, displayLines[maxLines - 1].length - 3) + '...';
        }
        pdf.text(displayLines, margin + 5, y + 16);
      }

      y += Math.min(noteHeight, 60) + 5;
    });
  }

  // Footer
  checkPageBreak(20);
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Generated with Lovable - Your Personal Learning Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save
  const safeFilename = data.courseTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50);
  pdf.save(`${safeFilename}_notes_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
