import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TRIP_TYPES, getTripTypeInfo } from '../utils/helpers';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, deleteUserTemplate } = useApp();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const builtIn   = templates.filter((t) =>  t.isBuiltIn);
  const custom    = templates.filter((t) => !t.isBuiltIn);

  const handleUse = (tpl) => {
    navigate('/trips/new', { state: { templateId: tpl.id } });
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Templates</h1>
      <p className="text-sm text-gray-500 mb-5">
        Choose a template when creating a new trip to pre-fill your packing list.
      </p>

      {/* Custom templates */}
      {custom.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your templates</h2>
          <div className="space-y-2">
            {custom.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                expanded={expandedId === tpl.id}
                onToggle={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                onUse={() => handleUse(tpl)}
                onDelete={() => setDeleteTarget(tpl.id)}
                showDelete
              />
            ))}
          </div>
        </section>
      )}

      {/* Built-in templates */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Built-in templates</h2>
        <div className="space-y-2">
          {builtIn.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              expanded={expandedId === tpl.id}
              onToggle={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
              onUse={() => handleUse(tpl)}
            />
          ))}
        </div>
      </section>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteUserTemplate(deleteTarget)}
        title="Delete template?"
        message="This custom template will be permanently deleted. This cannot be undone."
        confirmLabel="Delete template"
      />
    </div>
  );
}

function TemplateCard({ tpl, expanded, onToggle, onUse, onDelete, showDelete }) {
  const typeInfo = getTripTypeInfo(tpl.tripType);
  const essentialCount = tpl.items.filter((i) => i.essential).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-2xl shrink-0">{typeInfo.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</p>
            {!tpl.isBuiltIn && (
              <Badge className="bg-indigo-100 text-indigo-600">Custom</Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{tpl.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-600 font-medium">{tpl.items.length} items</p>
          {essentialCount > 0 && (
            <p className="text-xs text-amber-500">⭐ {essentialCount} essential</p>
          )}
        </div>
      </button>

      {/* Expanded item list */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          <ul className="space-y-0.5 mb-3 max-h-48 overflow-y-auto">
            {tpl.items.map((item) => (
              <li key={item.id} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
                {item.essential && <span className="text-amber-400">⭐</span>}
                <span>{item.name}</span>
                {item.quantity > 1 && <span className="text-gray-400">×{item.quantity}</span>}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={onUse}
              className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Use this template
            </button>
            {showDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
