import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import { TRIP_TYPES, getDurationDays } from '../utils/helpers';

const INITIAL_FORM = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  tripType: 'other',
  travelersCount: 1,
  notes: '',
  templateId: null,
};

export default function TripFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, templates, createTrip, updateTrip, addItemsFromTemplate, getItemsForTrip } = useApp();

  const isEdit = Boolean(id);
  const existing = isEdit ? trips.find((t) => t.id === id) : null;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        destination: existing.destination || '',
        startDate: existing.startDate || '',
        endDate: existing.endDate || '',
        tripType: existing.tripType || 'other',
        travelersCount: existing.travelersCount || 1,
        notes: existing.notes || '',
        templateId: existing.templateId || null,
      });
    }
  }, [existing]);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Trip name is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = 'End date must be after start date';
    if (form.travelersCount < 1) errs.travelersCount = 'At least 1 traveler';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (isEdit) {
        updateTrip(id, form);
        navigate(`/trips/${id}`);
      } else {
        const trip = createTrip(form);
        // Apply selected template if any
        if (form.templateId) {
          const tpl = templates.find((t) => t.id === form.templateId);
          if (tpl) addItemsFromTemplate(trip.id, tpl.items);
        }
        navigate(`/trips/${trip.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const duration = getDurationDays(form.startDate, form.endDate);
  const existingItems = isEdit ? getItemsForTrip(id) : [];

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate(isEdit ? `/trips/${id}` : '/')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 -ml-1"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        {isEdit ? 'Back to trip' : 'Back to dashboard'}
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-5">
        {isEdit ? 'Edit trip' : 'New trip'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Trip name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trip name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Barcelona Summer 2026"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
              ${errors.title ? 'border-rose-400' : 'border-gray-200'}`}
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
          <input
            type="text"
            placeholder="e.g. Barcelona, Spain"
            value={form.destination}
            onChange={(e) => update('destination', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Trip type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Trip type</label>
          <div className="grid grid-cols-3 gap-2">
            {TRIP_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update('tripType', t.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition-all
                  ${form.tripType === t.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => update('endDate', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${errors.endDate ? 'border-rose-400' : 'border-gray-200'}`}
            />
            {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>
        {duration !== null && (
          <p className="text-xs text-indigo-600 -mt-2">✈️ {duration} day{duration !== 1 ? 's' : ''}</p>
        )}

        {/* Traveler count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
          <input
            type="number"
            min="1"
            max="99"
            value={form.travelersCount}
            onChange={(e) => update('travelersCount', parseInt(e.target.value, 10) || 1)}
            className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Template selection (new trips only, and only if no items yet) */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start from template <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => update('templateId', null)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                  ${form.templateId === null
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="text-2xl">📝</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Start blank</p>
                  <p className="text-xs text-gray-500">Add items manually</p>
                </div>
              </button>
              {templates
                .filter((t) => !form.tripType || form.tripType === 'other' || t.tripType === form.tripType || t.tripType === 'other')
                .concat(templates.filter((t) => t.tripType !== form.tripType && t.tripType !== 'other' && form.tripType !== 'other'))
                .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
                .map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => update('templateId', tpl.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${form.templateId === tpl.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-2xl">
                      {TRIP_TYPES.find((t) => t.value === tpl.tripType)?.emoji ?? '🗺️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{tpl.name}</p>
                        {!tpl.isBuiltIn && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tpl.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tpl.items.length} items</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            placeholder="Any extra details about this trip…"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-1 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate(isEdit ? `/trips/${id}` : '/')}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
          </Button>
        </div>
      </form>
    </div>
  );
}
