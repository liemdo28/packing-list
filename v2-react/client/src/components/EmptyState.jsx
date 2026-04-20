import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, ctaLabel, ctaTo, ctaAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">{description}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className="btn-primary mt-5 inline-flex">
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && ctaAction && !ctaTo && (
        <button type="button" onClick={ctaAction} className="btn-primary mt-5">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
