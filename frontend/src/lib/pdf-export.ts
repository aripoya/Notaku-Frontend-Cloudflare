// PDF Export Utilities for Analytics
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  AnalyticsSummary,
  TrendDataPoint,
  CategoryData,
  MerchantData,
} from '@/types/analytics';
import { formatCurrency, formatDateShort } from '@/types/analytics';

// Extend jsPDF type to include lastAutoTable from autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface AnalyticsExportData {
  summary: AnalyticsSummary | null;
  trendData: TrendDataPoint[];
  categoryData: CategoryData[];
  merchantData: MerchantData[];
  dateRange: {
    start: string;
    end: string;
  };
}

export function exportAnalyticsToPDF(data: AnalyticsExportData): void {
  const { summary, trendData, categoryData, merchantData, dateRange } = data;

  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Analitik Keuangan', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Date Range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Periode: ${formatDateShort(dateRange.start)} - ${formatDateShort(dateRange.end)}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 15;

  // Summary Section
  if (summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan', 14, yPos);
    yPos += 8;

    const summaryData = [
      ['Total Pengeluaran', formatCurrency(summary.total_spending)],
      ['Total Transaksi', summary.total_receipts.toString()],
      ['Rata-rata per Transaksi', formatCurrency(summary.average_per_transaction)],
      [
        'Pengeluaran Terbesar',
        `${summary.biggest_expense.merchant} - ${formatCurrency(summary.biggest_expense.amount)}`,
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metrik', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // blue-600
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Category Breakdown Section
  if (categoryData.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pengeluaran per Kategori', 14, yPos);
    yPos += 8;

    const categoryTableData = categoryData.map((cat) => [
      cat.name,
      formatCurrency(cat.amount),
      cat.count.toString(),
      `${cat.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Kategori', 'Total', 'Jumlah', 'Persentase']],
      body: categoryTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Top Merchants Section
  if (merchantData.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Merchants', 14, yPos);
    yPos += 8;

    const merchantTableData = merchantData.slice(0, 10).map((merchant, index) => [
      (index + 1).toString(),
      merchant.name,
      formatCurrency(merchant.amount),
      merchant.count.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Merchant', 'Total Pembelian', 'Jumlah Transaksi']],
      body: merchantTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 40, halign: 'center' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Trend Data Section (last 30 entries)
  if (trendData.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tren Pengeluaran', 14, yPos);
    yPos += 8;

    const trendTableData = trendData.slice(-30).map((trend) => [
      formatDateShort(trend.date),
      formatCurrency(trend.amount),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Tanggal', 'Pengeluaran']],
      body: trendTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 60, halign: 'right' },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  // Generate filename
  const filename = `analitik-${dateRange.start}-${dateRange.end}.pdf`;

  // Save the PDF
  doc.save(filename);
}
