export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-lg p-3 ${colorClasses[color] || colorClasses.primary}`}>
            {Icon && <Icon className="h-6 w-6" />}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
