import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const config = {
  success: { icon: CheckCircleIcon, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', iconColor: 'text-green-400' },
  error: { icon: XCircleIcon, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', iconColor: 'text-red-400' },
  warning: { icon: ExclamationTriangleIcon, bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', iconColor: 'text-yellow-400' },
  info: { icon: InformationCircleIcon, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconColor: 'text-blue-400' },
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const { icon: Icon, bg, text, border, iconColor } = config[type] || config.info;

  return (
    <div className={`rounded-lg ${bg} ${border} border p-4`}>
      <div className="flex">
        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
        <div className={`ml-3 flex-1 ${text} text-sm`}>{message}</div>
        {onClose && (
          <button onClick={onClose} className={`ml-3 ${text} hover:opacity-70`}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
