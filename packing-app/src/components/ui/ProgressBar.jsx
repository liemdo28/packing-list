export default function ProgressBar({ percentage, showLabel = false, size = 'md', className = '' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const color =
    percentage === 100
      ? 'bg-emerald-500'
      : percentage >= 50
      ? 'bg-indigo-500'
      : 'bg-amber-400';

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-gray-500 text-right">{percentage}% packed</p>
      )}
    </div>
  );
}
