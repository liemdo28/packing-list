const colorMap = {
    indigo: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', glow: 'glow-red' },
    green: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'glow-green' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'glow-yellow' },
    red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', glow: 'glow-red' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'glow-blue' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'glow-purple' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400', glow: 'glow-red' },
    gray: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', glow: '' },
};

export default function StatCard({ title, value, color = 'indigo' }) {
    const scheme = colorMap[color] || colorMap.indigo;

    return (
        <div className={`overflow-hidden rounded-lg bg-[#1e1e2e] border ${scheme.border} shadow-lg`}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`h-12 w-12 rounded-md ${scheme.bg} flex items-center justify-center border ${scheme.border}`}>
                            <span className={`text-xl font-bold ${scheme.text}`}>{typeof value === 'number' ? value : '#'}</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-400">{title}</dt>
                            <dd className={`text-2xl font-semibold text-white ${scheme.glow}`}>{value}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
