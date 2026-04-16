import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function QuickAddItem({ categories, defaultCategoryId, onAdd }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [essential, setEssential] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, categoryId, quantity: Number(quantity), essential });
    setName('');
    setQuantity(1);
    setEssential(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-dashed border-gray-300 p-3"
    >
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Add item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="bg-indigo-600 text-white rounded-xl px-3 py-2 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Category picker */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        {/* Quantity */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Qty</span>
          <input
            type="number"
            min="1"
            max="99"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg w-12 px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Essential toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-600">
          <input
            type="checkbox"
            checked={essential}
            onChange={(e) => setEssential(e.target.checked)}
            className="rounded accent-amber-500"
          />
          Essential ⭐
        </label>
      </div>
    </form>
  );
}
