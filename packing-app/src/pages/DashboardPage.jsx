import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import TripCard from '../components/TripCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const FILTER_OPTIONS = [
  { value: 'all',       label: 'All' },
  { value: 'planning',  label: 'Planning' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'oldest',    label: 'Oldest first' },
  { value: 'departure', label: 'Departure date' },
  { value: 'name',      label: 'Name A–Z' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { trips, getProgress, deleteTrip, archiveTrip, duplicateTrip } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const processed = useMemo(() => {
    let list = [...trips];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filter !== 'all') {
      list = list.filter((t) => t.status === filter);
    } else {
      // By default hide archived unless specifically filtered for
      // Actually keep all in "all" view but show archived faded (handled in TripCard)
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'departure':
          return (a.startDate || '9999') < (b.startDate || '9999') ? -1 : 1;
        case 'name':
          return a.title.localeCompare(b.title);
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return list;
  }, [trips, search, filter, sort]);

  const handleDuplicate = (tripId) => {
    const newId = duplicateTrip(tripId);
    if (newId) navigate(`/trips/${newId}/edit`);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) deleteTrip(deleteTarget);
  };

  if (trips.length === 0) {
    return (
      <EmptyState
        icon="🧳"
        title="No trips yet"
        description="Create your first trip and start building a smart packing list."
        action={{ label: 'Create your first trip', onClick: () => navigate('/trips/new') }}
      />
    );
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search trips…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`p-2 rounded-xl border transition-colors ${
              showFilters ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 bg-white border border-gray-100 rounded-2xl p-3">
            {/* Status filter pills */}
            <div className="w-full">
              <p className="text-xs text-gray-400 mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === opt.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="w-full">
              <p className="text-xs text-gray-400 mb-1.5">Sort by</p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Trip count */}
      <p className="text-xs text-gray-400 mb-3">
        {processed.length} trip{processed.length !== 1 ? 's' : ''}
      </p>

      {/* Trip cards */}
      {processed.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No trips match"
          description="Try a different search or filter."
          action={{ label: 'Clear filters', variant: 'secondary', onClick: () => { setSearch(''); setFilter('all'); } }}
        />
      ) : (
        <div className="space-y-3">
          {processed.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              progress={getProgress(trip.id)}
              onDuplicate={() => handleDuplicate(trip.id)}
              onArchive={() => archiveTrip(trip.id)}
              onDelete={() => setDeleteTarget(trip.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete trip?"
        message="This will permanently remove the trip and all its packing items. This action cannot be undone."
        confirmLabel="Delete trip"
      />
    </div>
  );
}
