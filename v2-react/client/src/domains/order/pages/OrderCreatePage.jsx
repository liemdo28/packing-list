import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getStores } from '../../../api/stores';
import { getItems } from '../../../api/items';
import { createOrder } from '../../../api/orders';
import Alert from '../../../components/Alert';
import { useAuth } from '../../../hooks/useAuth';
import { useFlash } from '../../../contexts/FlashContext';
import { isValidTransfer, getAvailableSources, getDefaultFromStore, getDefaultToStore } from '../../../utils/helpers';

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flash } = useFlash();

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ item_id: '', quantity: 1, notes: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getStores(),
      getItems({ limit: 200, active: 'true' }),
    ]).then(([storesRes, itemsRes]) => {
      const allStores = storesRes.data.data;
      const allItems  = itemsRes.data.data;
      setStores(allStores);
      setItems(allItems);

      // Auto-set "to" = user's own store (locked for non-admin)
      const defaultToCode = getDefaultToStore(user?.role);
      if (defaultToCode) {
        const toStore = allStores.find(s => s.code === defaultToCode);
        if (toStore) setToStoreId(String(toStore.id));
      }

      // Auto-set "from" = first available source
      const defaultFromCode = getDefaultFromStore(user?.role);
      if (defaultFromCode) {
        const fromStore = allStores.find(s => s.code === defaultFromCode);
        if (fromStore) setFromStoreId(String(fromStore.id));
      }
    }).catch(console.error);
  }, [user]);

  const availableSources = getAvailableSources(user?.role);
  const fromStore = stores.find(s => s.id === parseInt(fromStoreId, 10));
  const toStore   = stores.find(s => s.id === parseInt(toStoreId, 10));

  // Items filtered by source store:
  // - from B3 → only Noodles (Thick/Thin Noodle)
  // - from B1 → all items except Noodles
  const filteredItems = fromStore
    ? fromStore.code === 'B3'
      ? items.filter(i => i.category === 'Noodles')
      : items.filter(i => i.category !== 'Noodles')
    : items;

  const availableDestinations = stores.filter(s => {
    if (!fromStore) return false;
    return isValidTransfer(fromStore.code, s.code);
  });

  // Non-admin: "to" is locked to own store
  const toStoreLocked = user?.role !== 'admin' && user?.role !== 'accountant';

  const addLine = () => setLines([...lines, { item_id: '', quantity: 1, notes: '' }]);

  const removeLine = (idx) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validLines = lines.filter(l => l.item_id && l.quantity > 0);
    if (validLines.length === 0) {
      setError('At least one item is required');
      return;
    }
    setSaving(true);
    try {
      const res = await createOrder({
        from_store_id: parseInt(fromStoreId, 10),
        to_store_id: parseInt(toStoreId, 10),
        notes,
        lines: validLines.map(l => ({
          item_id: parseInt(l.item_id, 10),
          quantity: parseFloat(l.quantity),
          notes: l.notes || undefined,
        })),
      });
      flash('Order created successfully!', 'success');
      navigate(`/orders/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Transfer Order</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Transfer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">From Store <span className="text-xs text-gray-400 font-normal">(nguồn hàng)</span></label>
              <select
                value={fromStoreId}
                onChange={(e) => { setFromStoreId(e.target.value); setLines([{ item_id: '', quantity: 1, notes: '' }]); }}
                className="input-field mt-1"
                required
              >
                <option value="">Select source store</option>
                {stores.filter(s => user?.role === 'admin' || user?.role === 'accountant' || availableSources.includes(s.code)).map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">To Store <span className="text-xs text-gray-400 font-normal">(giao đến)</span></label>
              {toStoreLocked ? (
                <div className="input-field mt-1 bg-gray-50 text-gray-700 cursor-not-allowed">
                  {toStore ? `${toStore.code} - ${toStore.name}` : 'Loading...'}
                </div>
              ) : (
                <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)} className="input-field mt-1" required disabled={!fromStoreId}>
                  <option value="">Select destination store</option>
                  {availableDestinations.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="label-field">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field mt-1" rows={2} placeholder="Optional notes for this order" />
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Items</h2>
            <button type="button" onClick={addLine} className="btn-secondary text-sm">
              <PlusIcon className="h-4 w-4 mr-1" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <select value={line.item_id} onChange={(e) => updateLine(idx, 'item_id', e.target.value)} className="input-field text-sm" required disabled={!fromStoreId}>
                    <option value="">{!fromStoreId ? 'Select a source store first' : filteredItems.length === 0 ? 'No items available for this route' : 'Select item'}</option>
                    {filteredItems.map(item => (
                      <option key={item.id} value={item.id}>{item.code} - {item.name} ({item.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} className="input-field text-sm" placeholder="Qty" required />
                </div>
                <div className="w-40 hidden sm:block">
                  <input type="text" value={line.notes} onChange={(e) => updateLine(idx, 'notes', e.target.value)} className="input-field text-sm" placeholder="Notes" />
                </div>
                <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" disabled={lines.length === 1}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/orders')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Order'}</button>
        </div>
      </form>
    </div>
  );
}