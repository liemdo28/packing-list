const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    processing: 'Processing',
    ready_to_ship: 'Ready to Ship',
    in_transit: 'In Transit',
    received_pending_confirmation: 'Received Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
};

const defaultColors = {
    draft: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    submitted: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-neon-blue',
    processing: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-neon-yellow',
    ready_to_ship: 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-neon-purple',
    in_transit: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-neon-blue',
    received_pending_confirmation: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-neon-green',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-neon-red',
    disputed: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    inactive: 'bg-red-500/20 text-red-400 border border-red-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-neon-green',
    unpaid: 'bg-red-500/20 text-red-400 border border-red-500/30',
    partial: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function Badge({ status, colors = {} }) {
    const mergedColors = { ...defaultColors, ...colors };
    const colorClass = mergedColors[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';

    const label = statusLabels[status] || status?.replace(/_/g, ' ');

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
            {label}
        </span>
    );
}
