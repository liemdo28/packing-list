import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems } from '../../../api/items';
import { createPrice } from '../../../api/prices';
import Alert from '../../../components/Alert';

export default function PriceFormPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ item_id: '', price: '', effective_date: new Date().toISOString().slice(0, 10), end_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getItems({ limit: 100, active: 'true' }).then((res) => setItems(res.data.data)).catch(console.error);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createPrice({ ...form, item_id: parseInt(form.item_id, 10), end_date: form.end_date || undefined });
      navigate('/prices');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Set New Price</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-5">
        <div>
          <label className="label-field">Item</label>
          <select name="item_id" value={form.item_id} onChange={handleChange} className="input-field mt-1" required>
            <option value="">Select an item</option>
            {items.map(item => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Price</label>
          <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} className="input-field mt-1" required placeholder="0.00" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Effective Date</label>
            <input name="effective_date" type="date" value={form.effective_date} onChange={handleChange} className="input-field mt-1" required />
          </div>
          <div>
            <label className="label-field">End Date (optional)</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} className="input-field mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/prices')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Set Price'}</button>
        </div>
      </form>
    </div>
  );
}