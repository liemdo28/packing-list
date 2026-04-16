import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{page}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
          {total > 0 && (
            <span> ({total} total records)</span>
          )}
        </p>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          {start > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                1
              </button>
              {start > 2 && (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                  ...
                </span>
              )}
            </>
          )}
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 ${
                p === page
                  ? 'z-10 bg-primary-600 text-white focus-visible:outline-primary-600'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                  ...
                </span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary text-sm"
        >
          Previous
        </button>
        <span className="flex items-center text-sm text-gray-700">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-secondary text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
