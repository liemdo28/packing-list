import { CheckIcon } from '@heroicons/react/24/outline';
import Alert from './Alert';
import { formatDateTime } from '../utils/formatters';

function stepStyles(state) {
  if (state === 'complete') {
    return {
      badge: 'border-emerald-600 bg-emerald-600 text-white',
      text: 'text-emerald-800',
      line: 'bg-emerald-500',
    };
  }

  if (state === 'current') {
    return {
      badge: 'border-sky-600 bg-sky-600 text-white',
      text: 'text-sky-800',
      line: 'bg-slate-200',
    };
  }

  return {
    badge: 'border-slate-300 bg-white text-slate-400',
    text: 'text-slate-400',
    line: 'bg-slate-200',
  };
}

export default function WorkflowPanel({ steps, message }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Workflow Panel</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">Follow the next safe step</h2>
          <p className="mt-1 text-sm text-gray-500">Completed steps stay visible so new users can understand the full transfer flow.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-6">
        {steps.map((step, index) => {
          const styles = stepStyles(step.state);
          return (
            <div key={step.key} className="relative">
              {index < steps.length - 1 && (
                <div className={`absolute left-8 top-4 hidden h-0.5 w-[calc(100%-1rem)] lg:block ${styles.line}`} />
              )}
              <div className="relative z-10 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${styles.badge}`}>
                  {step.state === 'complete' ? <CheckIcon className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                </div>
                <p className={`mt-3 text-sm font-semibold ${styles.text}`}>{step.label}</p>
                <p className="mt-1 text-xs text-gray-500">{step.timestamp ? formatDateTime(step.timestamp) : 'Not yet reached'}</p>
                <p className="mt-1 text-xs text-gray-400">{step.actorLabel || 'Waiting'}</p>
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-5">
          <Alert
            type={message.tone === 'warning' ? 'warning' : 'info'}
            message={
              <div>
                <span className="font-semibold">{message.title}</span>
                <span className="block mt-1">{message.description}</span>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
