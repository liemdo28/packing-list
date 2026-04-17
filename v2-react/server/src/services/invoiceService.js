const { Invoice, InvoiceLine, Store, Item, User, sequelize } = require('../../models');

class InvoiceService {
  static async createInvoice({ invoiceData, lines, userId }) {
    const existing = await Invoice.findOne({ where: { invoice_number: invoiceData.invoice_number } });
    if (existing) throw new Error('Invoice number already exists');

    const invoice = await Invoice.create({
      ...invoiceData,
      created_by: userId,
    });

    if (lines && lines.length > 0) {
      await InvoiceLine.bulkCreate(
        lines.map(line => ({
          invoice_id: invoice.id,
          item_id: line.item_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.quantity * line.unit_price,
        }))
      );
    }

    return invoice.id;
  }

  static async updateInvoice(invoiceId, invoiceData, lines) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'reconciled') throw new Error('Cannot update reconciled invoice');

    await invoice.update(invoiceData);

    if (lines) {
      await InvoiceLine.destroy({ where: { invoice_id: invoiceId } });
      await InvoiceLine.bulkCreate(
        lines.map(line => ({
          invoice_id: invoice.id,
          item_id: line.item_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.quantity * line.unit_price,
        }))
      );
    }

    return invoice.id;
  }

  static async reconcileInvoice(invoiceId, userId) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'reconciled') throw new Error('Invoice already reconciled');

    await invoice.update({
      status: 'reconciled',
      reconciled_by: userId,
      reconciled_at: new Date(),
    });

    return invoice.id;
  }
}

module.exports = InvoiceService;