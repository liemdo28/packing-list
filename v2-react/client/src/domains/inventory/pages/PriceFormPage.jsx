import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getItems } from '../../../api/items';
import { createPrice, updatePrice, getPrice } from '../../../api/prices';
import Alert from '../../../components/Alert';
import { useFlash } from '../../../contexts/FlashContext';

export default function PriceFormPage() {
  const { id } = useParams(); // /prices/:id/edit → id = :id
  const navigate = useNavigate();
  const { flash } = useFlash();
  const isEdit = Boolean(id);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    item_id: '',
    price: '',
    effective_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(isEdit);
  const [error, setError] = useState('');

  // Load items list for the dropdown
  useEffect(() => {
    getItems({ limit: 100, active: 'true' })
      .then((res) => setItems(res.data.data || []))
      .catch(console.error);
  }, []);

  // In edit mode, load the existing price record
  useEffect(() => {
    if (!isEdit) return;
    setFetchingPrice(true);
    getPrice(id)
      .then((res) => {
        const p = res.data?.data || res.data || {};
        setForm({
          item_id:    p.item_id    || '',
          price:      p.price      || '',
          effective_date: p.effective_date
            ? String(p.effective_date).slice(0, 10)
            : '',
          end_date:   p.end_date
            ? String(p.end_date).slice(0, 10)
            : '',
        });
      })
      .catch(() => setError('Failed to load price record.'))
      .finally(() => setFetchingPrice(false));
  }, [id, isEdit]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        item_id:    parseInt(form.item_id, 10),
        end_date:    form.end_date || null,
      };
      if (isEdit) {
        await updatePrice(id, payload);
        flash('Price updated successfully!', 'success');
      } else {
        await createPrice(payload);
        flash('Price created successfully!', 'success');
      }
      navigate('/prices');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save price.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPrice) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Price' : 'Set New Price'}
      </h1>
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="label-field">Item</label>
          <select
            name="item_id"
            value={form.item_id}
            onChange={handleChange}
            className="input-field mt-1"
            required
            disabled={isEdit} // Don't allow changing item on edit
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field">Price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={handleChange}
            className="input-field mt-1"
            required
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Effective Date</label>
            <input
              name="effective_date"
              type="date"
              value={form.effective_date}
              onChange={handleChange}
              className="input-field mt-1"
              required
            />
          </div>
          <div>
            <label className="label-field">End Date (optional)</label>
            <input
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              className="input-field mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/prices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Price' : 'Set Price'}
          </button>
        </div>
      </form>
    </div>
  );
}
