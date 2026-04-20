import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getItems } from '../../../api/items';
import { getPackingTemplate, createPackingTemplate, updatePackingTemplate } from '../../../api/packing';
import Alert from '../../../components/Alert';
import { useFlash } from '../../../contexts/FlashContext';

export default function PackingTemplateFormPage() {
  const { id } = useParams(); // /packing/templates/:id/edit → id = template id
  const navigate = useNavigate();
  const { flash } = useFlash();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', description: '' });
  const [templateItems, setTemplateItems] = useState([]); // [{ item_id, default_qty }]
  const [items, setItems] = useState([]);                  // dropdown options
  const [loading, setLoading] = useState(false);
  const [fetchingTemplate, setFetchingTemplate] = useState(isEdit);
  const [error, setError] = useState('');

  // Load item catalog for the item selector
  useEffect(() => {
    getItems({ limit: 100, active: 'true' })
      .then((res) => setItems(res.data.data || []))
      .catch(console.error);
  }, []);

  // Load existing template in edit mode
  useEffect(() => {
    if (!isEdit) return;
    setFetchingTemplate(true);
    getPackingTemplate(id)
      .then((res) => {
        const t = res.data?.data || res.data || {};
        setForm({ name: t.name || '', description: t.description || '' });
        // PackingTemplateItems may be at t.PackingTemplateItems or t.items depending on API shape
        const loadedItems = t.PackingTemplateItems || t.items || [];
        setTemplateItems(
          loadedItems.map((ti) => ({
            item_id:    ti.item_id || ti.item?.id,
            default_qty: ti.default_qty || 1,
          }))
        );
      })
      .catch(() => setError('Failed to load template.'))
      .finally(() => setFetchingTemplate(false));
  }, [id, isEdit]);

  const addItem = () =>
    setTemplateItems((prev) => [
      ...prev,
      { item_id: '', default_qty: 1 },
    ]);

  const removeItem = (index) =>
    setTemplateItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index, field, value) =>
    setTemplateItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Template name is required.'); return; }
    const validItems = templateItems.filter((ti) => ti.item_id);
    if (validItems.length === 0) { setError('Add at least one item.'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        items: validItems.map((ti) => ({
          item_id:     parseInt(ti.item_id, 10),
          default_qty: parseFloat(ti.default_qty) || 1,
        })),
      };
      if (isEdit) {
        await updatePackingTemplate(id, payload);
        flash('Template updated successfully!', 'success');
      } else {
        await createPackingTemplate(payload);
        flash('Template created successfully!', 'success');
      }
      navigate('/packing/templates');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTemplate) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/packing/templates')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 block"
      >
        ← Back to Templates
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Packing Template' : 'New Packing Template'}
      </h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-6"
      >
        {/* Template metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Template Name *</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="input-field mt-1"
              required
              placeholder="e.g. Standard Shipment"
            />
          </div>
          <div>
            <label className="label-field">Description</label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Template items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Template Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Add Item
            </button>
          </div>

          {templateItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
              No items yet. Click "Add Item" to start.
            </p>
          )}

          {templateItems.map((row, idx) => (
            <div key={idx} className="flex gap-3 mb-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Item</label>
                <select
                  value={row.item_id}
                  onChange={(e) => updateItem(idx, 'item_id', e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-500 mb-1">Default Qty</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={row.default_qty}
                  onChange={(e) => updateItem(idx, 'default_qty', e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="mb-1 text-red-400 hover:text-red-600 p-2"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/packing/templates')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
}