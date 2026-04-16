import { STATUS_COLORS, STATUS_LABELS, INVOICE_STATUS_COLORS } from '../utils/constants';

export default function Badge({ status, type = 'order', className = '' }) {
  const colorMap = type === 'invoice' ? INVOICE_STATUS_COLORS : STATUS_COLORS;
  const labelMap = type === 'invoice'
    ? { pending: 'Pending', reconciled: 'Reconciled', disputed: 'Disputed' }
    : STATUS_LABELS;

  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700';
  const label = labelMap[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  );
}
