const SummaryService = require('../services/summaryService');
const ExportService = require('../services/exportService');

const monthly = async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || new Date().getMonth() + 1, 10);

    const summary = await SummaryService.getMonthlySummary(year, month);
    res.json({ data: summary });
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
};

const yearly = async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const summary = await SummaryService.getYearlySummary(year);
    res.json({ data: summary });
  } catch (error) {
    console.error('Yearly summary error:', error);
    res.status(500).json({ error: 'Failed to fetch yearly summary' });
  }
};

const byPair = async (req, res) => {
  try {
    const { from, to } = req.params;
    const { year, month } = req.query;

    const summary = await SummaryService.getPairSummary(
      from, to,
      year ? parseInt(year, 10) : null,
      month ? parseInt(month, 10) : null
    );
    res.json({ data: summary });
  } catch (error) {
    console.error('Pair summary error:', error);
    res.status(500).json({ error: 'Failed to fetch pair summary' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { from, to, year, month } = req.query;
    let summaryData;

    if (from && to) {
      summaryData = await SummaryService.getPairSummary(
        from, to,
        year ? parseInt(year, 10) : null,
        month ? parseInt(month, 10) : null
      );
    } else {
      const y = parseInt(year || new Date().getFullYear(), 10);
      if (month) {
        summaryData = await SummaryService.getMonthlySummary(y, parseInt(month, 10));
      } else {
        summaryData = await SummaryService.getYearlySummary(y);
      }
    }

    const workbook = await ExportService.generateExcel(summaryData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=summary-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
};

const exportPdf = async (req, res) => {
  try {
    const { from, to, year, month } = req.query;
    let summaryData;

    if (from && to) {
      summaryData = await SummaryService.getPairSummary(
        from, to,
        year ? parseInt(year, 10) : null,
        month ? parseInt(month, 10) : null
      );
    } else {
      const y = parseInt(year || new Date().getFullYear(), 10);
      if (month) {
        summaryData = await SummaryService.getMonthlySummary(y, parseInt(month, 10));
      } else {
        summaryData = await SummaryService.getYearlySummary(y);
      }
    }

    const pdfBuffer = await ExportService.generatePdf(summaryData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=summary-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};

module.exports = { monthly, yearly, byPair, exportExcel, exportPdf };
