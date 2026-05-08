import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { computeProgress } from '../utils/helpers';

export default function PackModePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, categories, getItemsForTrip, togglePacked } = useApp();

  const trip = trips.find((t) => t.id === id);
  const [showPacked, setShowPacked] = useState(false);
  const [pressing, setPressing] = useState(null);

  if (!trip) {
    return (
      <EmptyState
        icon="🔍"
        title="Trip not found"
        action={{ label: 'Dashboard', onClick: () => navigate('/') }}
      />
    );
  }

  const allItems = getItemsForTrip(id);
  const progress = computeProgress(allItems);

  const unpacked = allItems.filter((i) => !i.packed);
  const packed   = allItems.filter((i) =>  i.packed);

  // Group unpacked items by category for easier scanning
  const groups = useMemo(() => {
    const map = {};
    unpacked.forEach((item) => {
      const cat = categories.find((c) => c.id === item.categoryId) ?? { id: 'misc', name: 'Other', icon: '📦' };
      if (!map[cat.id]) map[cat.id] = { category: cat, items: [] };
      map[cat.id].items.push(item);
    });
    // Sort essentials first within each group
    Object.values(map).forEach((g) => {
      g.items.sort((a, b) => (a.essential === b.essential ? 0 : a.essential ? -1 : 1));
    });
    return Object.values(map);
  }, [unpacked, categories]);

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No items to pack"
        description="Add some items to your trip first."
        action={{ label: 'Back to trip', onClick: () => navigate(`/trips/${id}`) }}
      />
    );
  }

  return (
    <div className="pb-6">
      {/* Sticky header */}
      <div className="sticky top-14 z-20 bg-gray-50 pt-2 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Link
            to={`/trips/${id}`}
            className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm truncate">{trip.title}</h1>
            <p className="text-xs text-gray-500">Pack Mode</p>
          </div>
          {progress.percentage === 100 && (
            <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
          )}
        </div>

        <ProgressBar percentage={progress.percentage} showLabel size="md" />

        {progress.percentage === 100 && (
          <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
            <p className="text-sm font-semibold text-emerald-700">🎉 All packed — you're ready!</p>
          </div>
        )}

        {progress.missingEssentials.length > 0 && (
          <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <p className="text-xs font-medium text-rose-700">
              ⚠️ {progress.missingEssentials.length} essential item{progress.missingEssentials.length > 1 ? 's' : ''} still unpacked
            </p>
          </div>
        )}
      </div>

      {/* Unpacked items — grouped */}
      {unpacked.length > 0 && (
        <div className="space-y-4">
          {groups.map(({ category, items }) => (
            <div key={category.id}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 px-1">
                {category.icon} {category.name}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onPointerDown={() => setPressing(item.id)}
                    onPointerUp={() => setPressing(null)}
                    onPointerLeave={() => setPressing(null)}
                    onClick={() => togglePacked(item.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100
                      text-left transition-all active:scale-[0.98]
                      ${pressing === item.id ? 'bg-indigo-50 border-indigo-200' : 'hover:border-gray-200'}
                    `}
                  >
                    {/* Big unchecked circle */}
                    <div className={`
                      shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center
                      transition-colors
                      ${pressing === item.id ? 'border-indigo-400 bg-indigo-100' : 'border-gray-300'}
                    `} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.essential && <span className="text-amber-400 text-sm">⭐</span>}
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                      )}
                      {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Packed items (collapsible) */}
      {packed.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowPacked((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">✅ Packed ({packed.length})</span>
            <span className="text-gray-400">{showPacked ? '▲' : '▼'}</span>
          </button>

          {showPacked && (
            <div className="mt-2 space-y-2">
              {packed.map((item) => (
                <button
                  key={item.id}
                  onClick={() => togglePacked(item.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left hover:bg-white transition-colors"
                >
                  {/* Big green checked circle */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-gray-400 line-through text-left">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
