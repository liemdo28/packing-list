import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function EditItemModal({ isOpen, item, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', quantity: 1, categoryId: '', essential: false, notes: '',
  });

  useEffect(() => {
    if (item) setForm({
      name: item.name,
      quantity: item.quantity,
      categoryId: item.categoryId,
      essential: item.essential,
      notes: item.notes ?? '',
    });
  }, [item]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(item.id, { ...form, quantity: Number(form.quantity) });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit item">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Item name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max="99"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. in carry-on only"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.essential}
            onChange={(e) => update('essential', e.target.checked)}
            className="rounded accent-amber-500"
          />
          Mark as essential ⭐
        </label>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave} disabled={!form.name.trim()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
