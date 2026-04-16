import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, getTripTypeInfo } from '../utils/helpers';

export default function SummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, categories, getItemsForTrip, getProgress } = useApp();

  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <EmptyState
        icon="🔍"
        title="Trip not found"
        action={{ label: 'Dashboard', onClick: () => navigate('/') }}
      />
    );
  }

  const items = getItemsForTrip(id);
  const progress = getProgress(id);
  const typeInfo = getTripTypeInfo(trip.tripType);

  const missingEssentials = items.filter((i) => i.essential && !i.packed);
  const packedItems = items.filter((i) => i.packed);
  const unpackedItems = items.filter((i) => !i.packed && !i.essential);

  // Group all items by category for the printable list
  const grouped = {};
  items.forEach((item) => {
    const cat = categories.find((c) => c.id === item.categoryId) ?? { id: 'misc', name: 'Miscellaneous', icon: '📦' };
    if (!grouped[cat.id]) grouped[cat.id] = { category: cat, items: [] };
    grouped[cat.id].items.push(item);
  });

  const handlePrint = () => window.print();

  if (items.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No items yet"
        description="Add items to your trip before viewing the summary."
        action={{ label: 'Back to trip', onClick: () => navigate(`/trips/${id}`) }}
      />
    );
  }

  return (
    <div>
      {/* Back */}
      <Link
        to={`/trips/${id}`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 -ml-1"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to trip
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">{typeInfo.emoji}</span>
            <h1 className="text-xl font-bold text-gray-900">{trip.title}</h1>
          </div>
          {trip.destination && <p className="text-sm text-gray-500">📍 {trip.destination}</p>}
          {(trip.startDate || trip.endDate) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </p>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors print:hidden"
          title="Print checklist"
        >
          <PrinterIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Progress ring + stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-5">
          {/* Circular progress */}
          <div className="relative shrink-0 w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={progress.percentage === 100 ? '#10b981' : '#6366f1'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress.percentage / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{progress.percentage}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <Stat label="Total items"   value={progress.total} />
            <Stat label="Packed"        value={progress.packed} color="text-emerald-600" />
            <Stat label="Still needed"  value={progress.total - progress.packed} color={progress.total - progress.packed > 0 ? 'text-gray-600' : 'text-gray-400'} />
            <Stat label="Essential missing" value={missingEssentials.length} color={missingEssentials.length > 0 ? 'text-rose-600 font-semibold' : 'text-gray-400'} />
          </div>
        </div>
      </div>

      {/* Missing essentials — shown prominently */}
      {missingEssentials.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-rose-700 mb-2">
            ⚠️ Missing essentials ({missingEssentials.length})
          </h2>
          <ul className="space-y-1">
            {missingEssentials.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              return (
                <li key={item.id} className="flex items-center gap-2 text-sm text-rose-800">
                  <span>{cat?.icon ?? '📦'}</span>
                  <span>{item.name}</span>
                  {item.quantity > 1 && <span className="text-rose-500 text-xs">×{item.quantity}</span>}
                </li>
              );
            })}
          </ul>
          <Link
            to={`/trips/${id}/pack`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-rose-600 underline underline-offset-2"
          >
            Open Pack Mode to check off items →
          </Link>
        </div>
      )}

      {/* All done */}
      {progress.percentage === 100 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 text-center">
          <p className="text-lg">🎉</p>
          <p className="font-semibold text-emerald-700">You're fully packed!</p>
          <p className="text-sm text-emerald-600">Have a great trip to {trip.destination || 'your destination'}.</p>
        </div>
      )}

      {/* Full checklist grouped by category */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Full packing list</h2>
        {Object.values(grouped)
          .sort((a, b) => {
            const ai = categories.findIndex((c) => c.id === a.category.id);
            const bi = categories.findIndex((c) => c.id === b.category.id);
            return ai - bi;
          })
          .map(({ category, items: catItems }) => (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{category.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {catItems.filter((i) => i.packed).length}/{catItems.length} packed
                </span>
              </div>
              <ul className="divide-y divide-gray-50">
                {catItems
                  .sort((a, b) => (a.packed === b.packed ? 0 : a.packed ? 1 : -1))
                  .map((item) => (
                    <li key={item.id} className={`flex items-center gap-2.5 px-3 py-2 text-sm ${item.packed ? 'text-gray-400' : 'text-gray-800'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                        ${item.packed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {item.packed && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {item.essential && <span className="text-amber-400 text-xs">⭐</span>}
                      <span className={item.packed ? 'line-through' : ''}>{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="ml-auto text-xs text-gray-400">×{item.quantity}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-gray-800' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
