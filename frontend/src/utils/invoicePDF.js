import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a PDF invoice.
 * @param {Object} invoice - The invoice object from the backend
 */
export function generateInvoicePDF(invoice) {
  if (!invoice) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const primaryColor = '#0d9488'; // teal-600
  const secondaryColor = '#334155'; // slate-700
  const lightColor = '#f8fafc'; // slate-50

  let y = margin;

  // Header
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#ffffff');
  doc.text('Smart Hospital', margin, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('INVOICE', pageWidth - margin, 45, { align: 'right' });

  y = 110;

  // Invoice details block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text('Invoice Number:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || invoice.id || 'N/A', margin + 90, y);

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString(),
    margin + 90,
    y
  );

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.statusLabel || invoice.status || 'PENDING', margin + 90, y);

  // Patient / Hospital block (right side)
  let ry = 110;
  doc.setFont('helvetica', 'bold');
  doc.text('Patient:', pageWidth - margin - 150, ry, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.patientName || 'N/A', pageWidth - margin, ry, { align: 'right' });

  ry += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Doctor:', pageWidth - margin - 150, ry, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.doctorName || 'N/A', pageWidth - margin, ry, { align: 'right' });

  ry += 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Hospital:', pageWidth - margin - 150, ry, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.hospitalName || 'N/A', pageWidth - margin, ry, { align: 'right' });

  y = 180;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Description', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 14;
  const desc = invoice.description || (invoice.typeLabel || invoice.type || '');
  const splitDesc = doc.splitTextToSize(desc, pageWidth - margin * 2);
  doc.text(splitDesc, margin, y);
  y += splitDesc.length * 12 + 14;

  // Items table
  const body = [
    [
      invoice.typeLabel || invoice.type || 'Service',
      '1',
      `$${(invoice.baseAmount || 0).toFixed(2)}`,
      `$${(invoice.tax || 0).toFixed(2)}`,
      `$${(invoice.baseAmount || 0).toFixed(2)}`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: secondaryColor,
    },
    alternateRowStyles: {
      fillColor: lightColor,
    },
    head: [['Service', 'Qty', 'Base', 'Tax (8%)', 'Subtotal']],
    body,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 60, halign: 'center' },
      2: { cellWidth: 80, halign: 'right' },
      3: { cellWidth: 80, halign: 'right' },
      4: { cellWidth: 80, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 20;

  // Totals block
  const totalX = pageWidth - margin - 160;
  const valueX = pageWidth - margin;
  const lineHeight = 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', totalX, y, { align: 'left' });
  doc.text(`$${(invoice.baseAmount || 0).toFixed(2)}`, valueX, y, { align: 'right' });

  y += lineHeight;
  doc.text('Tax (8%):', totalX, y, { align: 'left' });
  doc.text(`$${(invoice.tax || 0).toFixed(2)}`, valueX, y, { align: 'right' });

  if (invoice.discount > 0) {
    y += lineHeight;
    doc.text('Discount:', totalX, y, { align: 'left' });
    doc.text(`-$${(invoice.discount || 0).toFixed(2)}`, valueX, y, { align: 'right' });
  }

  y += lineHeight + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('TOTAL:', totalX, y, { align: 'left' });
  doc.text(`$${(invoice.totalAmount || 0).toFixed(2)}`, valueX, y, { align: 'right' });

  // Footer
  y = doc.internal.pageSize.getHeight() - 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#94a3b8');
  doc.text('Thank you for choosing Smart Hospital.', margin, y);
  doc.text('For inquiries, contact billing@smarthospital.lk', margin, y + 12);

  // Save
  const fileName = `Invoice_${invoice.invoiceNumber || invoice.id || 'unknown'}_${invoice.patientName?.replace(/\s+/g, '_') || 'Patient'}.pdf`;
  doc.save(fileName);
}
