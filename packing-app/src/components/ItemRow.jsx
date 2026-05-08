import { useState } from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export default function ItemRow({ item, onToggle, onEdit, onDelete, compact = false }) {
  const [pressing, setPressing] = useState(false);

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
        ${item.packed ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/80'}
        ${compact ? 'py-3.5' : ''}
      `}
    >
      {/* Packed toggle */}
      <button
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
        onClick={() => onToggle(item.id)}
        className={`
          shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          ${pressing ? 'scale-90' : ''}
          ${item.packed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
          }
          ${compact ? 'w-8 h-8' : ''}
        `}
      >
        {item.packed && <CheckIcon className={`${compact ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} strokeWidth={3} />}
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.essential && (
            <StarSolid className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span
            className={`text-sm font-medium truncate
              ${item.packed ? 'line-through text-gray-400' : 'text-gray-800'}`}
          >
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              ×{item.quantity}
            </span>
          )}
        </div>
        {item.notes && !compact && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.notes}</p>
        )}
      </div>

      {/* Actions — hidden in compact/pack mode */}
      {!compact && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit?.(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(item.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
