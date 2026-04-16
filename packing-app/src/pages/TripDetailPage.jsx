import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  PencilSquareIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import QuickAddItem from '../components/QuickAddItem';
import ItemRow from '../components/ItemRow';
import EditItemModal from '../components/EditItemModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, getTripTypeInfo, getStatusInfo } from '../utils/helpers';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    trips, categories, getItemsForTrip, addItem, updateItem, togglePacked,
    deleteItem, getProgress, archiveTrip, deleteTrip, updateTrip,
  } = useApp();

  const trip = trips.find((t) => t.id === id);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState('');

  if (!trip) {
    return (
      <EmptyState
        icon="🔍"
        title="Trip not found"
        description="This trip may have been deleted."
        action={{ label: 'Go to dashboard', onClick: () => navigate('/') }}
      />
    );
  }

  const rawItems = getItemsForTrip(id);
  const progress = getProgress(id);
  const typeInfo = getTripTypeInfo(trip.tripType);
  const statusInfo = getStatusInfo(trip.status);

  // Group items by category, filtered by search
  const grouped = useMemo(() => {
    const filtered = search.trim()
      ? rawItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : rawItems;

    const map = {};
    filtered.forEach((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      const key = cat?.id ?? 'cat-misc';
      if (!map[key]) map[key] = { category: cat ?? { id: key, name: 'Miscellaneous', icon: '📦' }, items: [] };
      map[key].items.push(item);
    });

    // Sort items: unpacked essentials → unpacked normal → packed
    Object.values(map).forEach((g) => {
      g.items.sort((a, b) => {
        if (a.packed !== b.packed) return a.packed ? 1 : -1;
        if (a.essential !== b.essential) return a.essential ? -1 : 1;
        return a.orderIndex - b.orderIndex;
      });
    });

    // Sort categories by orderIndex
    return Object.values(map).sort((a, b) => {
      const ai = categories.findIndex((c) => c.id === a.category.id);
      const bi = categories.findIndex((c) => c.id === b.category.id);
      return ai - bi;
    });
  }, [rawItems, categories, search]);

  const handleAddItem = (data) => {
    addItem({ ...data, tripId: id, orderIndex: rawItems.length });
  };

  const handleDeleteTrip = () => {
    deleteTrip(id);
    navigate('/');
  };

  const handleMarkActive = () => updateTrip(id, { status: 'active' });
  const handleMarkCompleted = () => updateTrip(id, { status: 'completed' });

  return (
    <div>
      {/* Back */}
      <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 -ml-1">
        <ChevronLeftIcon className="w-4 h-4" />
        All trips
      </Link>

      {/* Trip header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeInfo.emoji}</span>
              <h1 className="text-xl font-bold text-gray-900 truncate">{trip.title}</h1>
            </div>
            {trip.destination && (
              <p className="text-sm text-gray-500 mt-0.5">📍 {trip.destination}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            <Link
              to={`/trips/${id}/edit`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {(trip.startDate || trip.endDate) && (
          <p className="text-xs text-gray-400 mb-3">
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            {trip.travelersCount > 1 && ` · ${trip.travelersCount} travelers`}
          </p>
        )}

        {/* Progress */}
        <ProgressBar percentage={progress.percentage} showLabel size="md" />
        {progress.missingEssentials.length > 0 && (
          <p className="mt-1.5 text-xs text-rose-500">
            ⚠️ {progress.missingEssentials.length} essential item{progress.missingEssentials.length > 1 ? 's' : ''} still unpacked
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <Link
          to={`/trips/${id}/pack`}
          className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <BoltIcon className="w-4 h-4" />
          Pack Mode
        </Link>
        <Link
          to={`/trips/${id}/summary`}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ClipboardDocumentCheckIcon className="w-4 h-4" />
          Summary
        </Link>
        {trip.status === 'planning' && (
          <button
            onClick={handleMarkActive}
            className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            ✈️ Start packing
          </button>
        )}
        {trip.status === 'active' && progress.percentage === 100 && (
          <button
            onClick={handleMarkCompleted}
            className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            ✅ Mark complete
          </button>
        )}
        <button
          onClick={() => archiveTrip(id)}
          className="shrink-0 p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
          title="Archive trip"
        >
          <ArchiveBoxIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="shrink-0 p-2 rounded-xl border border-gray-200 bg-white text-rose-400 hover:bg-rose-50 transition-colors"
          title="Delete trip"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Search within trip */}
      {rawItems.length > 5 && (
        <input
          type="search"
          placeholder="Search items in this trip…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      )}

      {/* Item groups */}
      {grouped.length === 0 && rawItems.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No items yet"
          description="Add items below or go back and choose a template."
        />
      ) : grouped.length === 0 ? (
        <EmptyState icon="🔍" title="No items match" description="Try a different search." />
      ) : (
        <div className="space-y-4 mb-4">
          {grouped.map(({ category, items }) => (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{category.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {items.filter((i) => i.packed).length}/{items.length}
                </span>
              </div>
              {/* Items */}
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={togglePacked}
                    onEdit={setEditingItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick add */}
      <QuickAddItem
        categories={categories}
        defaultCategoryId={categories[0]?.id}
        onAdd={handleAddItem}
      />

      {/* Edit item modal */}
      <EditItemModal
        isOpen={!!editingItem}
        item={editingItem}
        categories={categories}
        onSave={updateItem}
        onClose={() => setEditingItem(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteTrip}
        title="Delete this trip?"
        message="All packing items for this trip will also be deleted. This cannot be undone."
        confirmLabel="Delete trip"
      />
    </div>
  );
}
