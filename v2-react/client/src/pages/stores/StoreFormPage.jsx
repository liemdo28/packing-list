import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStore, createStore, updateStore } from '../../api/stores';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StoreFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ code: '', name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getStore(id)
        .then((res) => setForm(res.data.data))
        .catch(() => setError('Failed to load store'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        await updateStore(id, form);
      } else {
        await createStore(form);
      }
      navigate('/stores');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Store' : 'New Store'}
      </h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-5">
        <div>
          <label className="label-field">Store Code</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            className="input-field mt-1"
            required
            disabled={isEdit}
            placeholder="e.g. B4"
          />
        </div>
        <div>
          <label className="label-field">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input-field mt-1"
            required
            placeholder="Store name"
          />
        </div>
        <div>
          <label className="label-field">Address</label>
          <textarea
            name="address"
            value={form.address || ''}
            onChange={handleChange}
            className="input-field mt-1"
            rows={3}
            placeholder="Store address"
          />
        </div>
        <div>
          <label className="label-field">Phone</label>
          <input
            name="phone"
            value={form.phone || ''}
            onChange={handleChange}
            className="input-field mt-1"
            placeholder="Phone number"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/stores')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Store' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
