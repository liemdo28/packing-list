const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class ExportService {
  static async generateExcel(summaryData) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Packing List System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Summary');

    // Title
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Transfer Summary - ${summaryData.year}${summaryData.month ? '/' + String(summaryData.month).padStart(2, '0') : ''}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    // Summary by pair
    if (summaryData.pairs && summaryData.pairs.length > 0) {
      const headerRow = sheet.addRow(['From Store', 'To Store', 'Total Orders', 'Total Items', 'Total Amount']);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      for (const pair of summaryData.pairs) {
        const row = sheet.addRow([
          pair.from_store,
          pair.to_store,
          pair.total_orders,
          pair.total_items,
          pair.total_amount,
        ]);
        row.getCell(5).numFmt = '#,##0.00';
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }

      sheet.addRow([]);
      const totalRow = sheet.addRow(['', '', summaryData.grand_total_orders, '', summaryData.grand_total]);
      totalRow.font = { bold: true };
      totalRow.getCell(5).numFmt = '#,##0.00';
    }

    // Item details if available
    if (summaryData.items && summaryData.items.length > 0) {
      sheet.addRow([]);
      sheet.addRow([]);

      const detailHeaderRow = sheet.addRow(['Item Code', 'Item Name', 'Total Quantity', 'Total Amount']);
      detailHeaderRow.font = { bold: true };
      detailHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      for (const item of summaryData.items) {
        const row = sheet.addRow([
          item.item_code,
          item.item_name,
          item.total_quantity,
          item.total_amount,
        ]);
        row.getCell(4).numFmt = '#,##0.00';
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    }

    // Auto-width columns
    sheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 4, 30);
    });

    return workbook;
  }

  static async generatePdf(summaryData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).font('Helvetica-Bold')
        .text('Transfer Summary Report', { align: 'center' });
      doc.moveDown(0.5);

      const periodText = summaryData.month
        ? `${summaryData.year}/${String(summaryData.month).padStart(2, '0')}`
        : `${summaryData.year}`;
      doc.fontSize(14).font('Helvetica')
        .text(`Period: ${periodText}`, { align: 'center' });
      doc.moveDown(1);

      // Summary pairs
      if (summaryData.pairs && summaryData.pairs.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Summary by Store Pair');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colWidths = [80, 80, 80, 80, 100];
        const headers = ['From', 'To', 'Orders', 'Items', 'Amount'];
        let x = 50;

        // Header
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        doc.moveTo(50, tableTop + 15).lineTo(470, tableTop + 15).stroke();

        // Rows
        let y = tableTop + 20;
        doc.font('Helvetica').fontSize(10);

        for (const pair of summaryData.pairs) {
          x = 50;
          doc.text(pair.from_store, x, y, { width: colWidths[0] }); x += colWidths[0];
          doc.text(pair.to_store, x, y, { width: colWidths[1] }); x += colWidths[1];
          doc.text(String(pair.total_orders), x, y, { width: colWidths[2] }); x += colWidths[2];
          doc.text(String(pair.total_items), x, y, { width: colWidths[3] }); x += colWidths[3];
          doc.text(pair.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), x, y, { width: colWidths[4] });
          y += 18;
        }

        doc.moveTo(50, y).lineTo(470, y).stroke();
        y += 5;

        doc.font('Helvetica-Bold');
        doc.text(`Grand Total: ${summaryData.grand_total_orders} orders`, 50, y);
        doc.text(
          `Amount: ${summaryData.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          300, y
        );
      }

      // Item details
      if (summaryData.items && summaryData.items.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Item Details');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colWidths = [80, 150, 80, 100];
        const headers = ['Code', 'Name', 'Quantity', 'Amount'];
        let x = 50;

        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        doc.moveTo(50, tableTop + 15).lineTo(460, tableTop + 15).stroke();

        let y = tableTop + 20;
        doc.font('Helvetica').fontSize(9);

        for (const item of summaryData.items) {
          if (y > 750) {
            doc.addPage();
            y = 50;
          }
          x = 50;
          doc.text(item.item_code || '', x, y, { width: colWidths[0] }); x += colWidths[0];
          doc.text(item.item_name || '', x, y, { width: colWidths[1] }); x += colWidths[1];
          doc.text(String(item.total_quantity), x, y, { width: colWidths[2] }); x += colWidths[2];
          doc.text(item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), x, y, { width: colWidths[3] });
          y += 16;
        }
      }

      // Footer
      doc.fontSize(8).font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  }
}

module.exports = ExportService;
