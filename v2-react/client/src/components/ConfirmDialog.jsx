import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'danger', loading = false }) {
  const btnClass = confirmColor === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-full bg-red-100 p-2">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1 text-sm text-gray-600">{message}</div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={btnClass} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
