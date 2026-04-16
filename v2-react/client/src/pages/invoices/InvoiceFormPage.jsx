import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getStores } from '../../api/stores';
import { getItems } from '../../api/items';
import { createInvoice, getInvoice, updateInvoice } from '../../api/invoices';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    invoice_number: '',
    supplier_name: 'Four Season',
    paid_by_store_id: '',
    on_behalf_of_store_id: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    total_amount: 0,
    notes: '',
  });
  const [lines, setLines] = useState([{ description: '', quantity: 1, unit_price: 0, item_id: '' }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getStores(),
      getItems({ limit: 100 }),
    ]).then(([storesRes, itemsRes]) => {
      setStores(storesRes.data.data);
      setItems(itemsRes.data.data);
    });

    if (isEdit) {
      setLoading(true);
      getInvoice(id)
        .then((res) => {
          const inv = res.data.data;
          setForm({
            invoice_number: inv.invoice_number,
            supplier_name: inv.supplier_name,
            paid_by_store_id: String(inv.paid_by_store_id),
            on_behalf_of_store_id: inv.on_behalf_of_store_id ? String(inv.on_behalf_of_store_id) : '',
            invoice_date: inv.invoice_date,
            due_date: inv.due_date || '',
            total_amount: inv.total_amount,
            notes: inv.notes || '',
          });
          if (inv.lines?.length > 0) {
            setLines(inv.lines.map(l => ({
              description: l.description,
              quantity: l.quantity,
              unit_price: l.unit_price,
              item_id: l.item_id ? String(l.item_id) : '',
            })));
          }
        })
        .catch(() => setError('Failed to load invoice'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addLine = () => setLines([...lines, { description: '', quantity: 1, unit_price: 0, item_id: '' }]);

  const removeLine = (idx) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === 'item_id' && value) {
      const item = items.find(i => i.id === parseInt(value, 10));
      if (item) updated[idx].description = item.name;
    }

    setLines(updated);

    const total = updated.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
    setForm(f => ({ ...f, total_amount: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...form,
      paid_by_store_id: parseInt(form.paid_by_store_id, 10),
      on_behalf_of_store_id: form.on_behalf_of_store_id ? parseInt(form.on_behalf_of_store_id, 10) : null,
      lines: lines.filter(l => l.description).map(l => ({
        item_id: l.item_id ? parseInt(l.item_id, 10) : null,
        description: l.description,
        quantity: parseFloat(l.quantity),
        unit_price: parseFloat(l.unit_price),
      })),
    };

    try {
      if (isEdit) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
      }
      navigate('/invoices');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">Invoice Number</label>
              <input name="invoice_number" value={form.invoice_number} onChange={handleChange} className="input-field mt-1" required disabled={isEdit} />
            </div>
            <div>
              <label className="label-field">Supplier</label>
              <input name="supplier_name" value={form.supplier_name} onChange={handleChange} className="input-field mt-1" required />
            </div>
            <div>
              <label className="label-field">Paid By Store</label>
              <select name="paid_by_store_id" value={form.paid_by_store_id} onChange={handleChange} className="input-field mt-1" required>
                <option value="">Select store</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">On Behalf Of (optional)</label>
              <select name="on_behalf_of_store_id" value={form.on_behalf_of_store_id} onChange={handleChange} className="input-field mt-1">
                <option value="">None</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Invoice Date</label>
              <input name="invoice_date" type="date" value={form.invoice_date} onChange={handleChange} className="input-field mt-1" required />
            </div>
            <div>
              <label className="label-field">Due Date (optional)</label>
              <input name="due_date" type="date" value={form.due_date} onChange={handleChange} className="input-field mt-1" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label-field">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field mt-1" rows={2} />
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Line Items</h2>
            <button type="button" onClick={addLine} className="btn-secondary text-sm">
              <PlusIcon className="h-4 w-4 mr-1" /> Add Line
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50">
                <div className="w-32 hidden sm:block">
                  <select value={line.item_id} onChange={(e) => updateLine(idx, 'item_id', e.target.value)} className="input-field text-sm">
                    <option value="">Link item</option>
                    {items.map(item => <option key={item.id} value={item.id}>{item.code}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="input-field text-sm" placeholder="Description" required />
                </div>
                <div className="w-20">
                  <input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} className="input-field text-sm" placeholder="Qty" required />
                </div>
                <div className="w-28">
                  <input type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', e.target.value)} className="input-field text-sm" placeholder="Price" required />
                </div>
                <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-400 hover:text-red-600 rounded-lg" disabled={lines.length === 1}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <span className="text-sm text-gray-500">Total: </span>
            <span className="text-lg font-bold text-primary-700">
              {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(form.total_amount || 0)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
