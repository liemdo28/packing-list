import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getItem, createItem, updateItem } from '../../../api/items';
import Alert from '../../../components/Alert';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { CATEGORIES } from '../../../utils/constants';

export default function ItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ code: '', name: '', description: '', category: '', unit: 'pcs' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getItem(id)
        .then((res) => setForm(res.data.data))
        .catch(() => setError('Failed to load item'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) await updateItem(id, form);
      else await createItem(form);
      navigate('/items');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Item' : 'New Item'}</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Item Code</label>
            <input name="code" value={form.code} onChange={handleChange} className="input-field mt-1" required disabled={isEdit} placeholder="e.g. ITM026" />
          </div>
          <div>
            <label className="label-field">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field mt-1" required placeholder="Item name" />
          </div>
        </div>
        <div>
          <label className="label-field">Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleChange} className="input-field mt-1" rows={3} placeholder="Item description" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Category</label>
            <select name="category" value={form.category || ''} onChange={handleChange} className="input-field mt-1">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Unit</label>
            <input name="unit" value={form.unit} onChange={handleChange} className="input-field mt-1" required placeholder="e.g. pcs, kg, box" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/items')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}</button>
        </div>
      </form>
    </div>
  );
}