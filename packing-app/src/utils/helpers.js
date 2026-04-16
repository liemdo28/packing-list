/** @returns {string} A short unique ID */
export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** @param {string} dateStr ISO date string */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** @returns {number|null} number of trip days, null if dates missing/invalid */
export const getDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const diff = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? diff + 1 : null;
};

export const TRIP_TYPES = [
  { value: 'beach',         label: 'Beach',         emoji: '🏖️' },
  { value: 'business',      label: 'Business',      emoji: '💼' },
  { value: 'family',        label: 'Family',        emoji: '👨‍👩‍👧‍👦' },
  { value: 'weekend',       label: 'Weekend',       emoji: '🏕️' },
  { value: 'international', label: 'International', emoji: '✈️' },
  { value: 'other',         label: 'Other',         emoji: '🗺️' },
];

export const getTripTypeInfo = (type) =>
  TRIP_TYPES.find((t) => t.value === type) ?? TRIP_TYPES[TRIP_TYPES.length - 1];

export const TRIP_STATUSES = [
  { value: 'planning',  label: 'Planning',  className: 'bg-blue-100 text-blue-700' },
  { value: 'active',    label: 'Active',    className: 'bg-emerald-100 text-emerald-700' },
  { value: 'completed', label: 'Completed', className: 'bg-gray-100 text-gray-600' },
  { value: 'archived',  label: 'Archived',  className: 'bg-gray-100 text-gray-400' },
];

export const getStatusInfo = (status) =>
  TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0];

/** Compute packing progress for a set of items */
export const computeProgress = (items) => {
  const total = items.length;
  if (total === 0) return { total: 0, packed: 0, percentage: 0, missingEssentials: [] };
  const packed = items.filter((i) => i.packed).length;
  const missingEssentials = items.filter((i) => i.essential && !i.packed);
  return {
    total,
    packed,
    percentage: Math.round((packed / total) * 100),
    missingEssentials,
  };
};
