import { useNavigate } from 'react-router-dom';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';
import { formatDate, getTripTypeInfo, getStatusInfo } from '../utils/helpers';

export default function TripCard({ trip, progress, onDuplicate, onArchive, onDelete }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const typeInfo = getTripTypeInfo(trip.tripType);
  const statusInfo = getStatusInfo(trip.status);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleMenuAction = (fn) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
        ${trip.status === 'archived' ? 'opacity-60' : 'hover:shadow-md transition-shadow cursor-pointer'}`}
      onClick={() => trip.status !== 'archived' && navigate(`/trips/${trip.id}`)}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{typeInfo.emoji}</span>
            <h3 className="font-semibold text-gray-900 truncate">{trip.title}</h3>
          </div>
          {trip.destination && (
            <p className="text-sm text-gray-500 truncate">📍 {trip.destination}</p>
          )}
        </div>

        {/* Status badge + menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => handleMenuAction(() => navigate(`/trips/${trip.id}/edit`))}
                >
                  ✏️ Edit trip
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => handleMenuAction(onDuplicate)}
                >
                  📋 Duplicate
                </button>
                {trip.status !== 'archived' && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => handleMenuAction(onArchive)}
                  >
                    🗄️ Archive
                  </button>
                )}
                <hr className="my-1 border-gray-100" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  onClick={() => handleMenuAction(onDelete)}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      {(trip.startDate || trip.endDate) && (
        <div className="px-4 pb-2 text-xs text-gray-400">
          {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
        </div>
      )}

      {/* Progress */}
      <div className="px-4 pb-4">
        <ProgressBar percentage={progress.percentage} size="sm" />
        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>
            {progress.packed}/{progress.total} items packed
          </span>
          {progress.missingEssentials.length > 0 && (
            <span className="text-rose-500 font-medium">
              ⚠️ {progress.missingEssentials.length} essential{progress.missingEssentials.length > 1 ? 's' : ''} missing
            </span>
          )}
          {progress.percentage === 100 && (
            <span className="text-emerald-600 font-medium">✅ All packed!</span>
          )}
        </div>
      </div>
    </div>
  );
}
