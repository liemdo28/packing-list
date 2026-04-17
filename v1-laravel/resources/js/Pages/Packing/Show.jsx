import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import { PlusIcon, CheckIcon, TruckIcon, DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';

const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    packing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    packed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    shipped: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function PackingShow({ job, user }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const isAdmin = role === 'admin';

    const [showAddItem, setShowAddItem] = useState(false);
    const [itemForm, setItemForm] = useState({ item_id: '', quantity: 1 });

    const canStartPacking = job.status === 'draft' || job.status === 'packing';
    const canShip = job.status === 'packed';

    const handleTogglePacked = (item) => {
        router.put(
            `/packing/${job.id}/items/${item.id}`,
            {
                packed: !item.packed,
                packed_qty: !item.packed ? item.quantity : item.packed_qty,
            },
            { preserveScroll: true }
        );
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        router.post(`/packing/${job.id}/items`, itemForm, {
            onSuccess: () => {
                setShowAddItem(false);
                setItemForm({ item_id: '', quantity: 1 });
            },
        });
    };

    const handleRemoveItem = (item) => {
        if (!confirm('Remove this item from the packing job?')) return;
        router.delete(`/packing/${job.id}/items/${item.id}`, { preserveScroll: true });
    };

    const handleMarkAllPacked = () => {
        router.post(`/packing/${job.id}/mark-all-packed`, {}, { preserveScroll: true });
    };

    const handleShip = () => {
        router.post(`/packing/${job.id}/ship`, {}, { preserveScroll: true });
    };

    return (
        <Layout>
            <Head title={job.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{job.name}</h1>
                            <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium border ${statusColors[job.status]}`}>
                                {job.status}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">
                            {job.from_store ? `From: ${job.from_store.name}` : 'No store assigned'}
                            {job.order ? ` · Order: ${job.order.order_number}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <a
                            href={`/packing/${job.id}/checklist-pdf`}
                            className="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            Checklist
                        </a>
                        {canShip && isAdmin && (
                            <button
                                onClick={handleShip}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                            >
                                <TruckIcon className="h-4 w-4 mr-1" />
                                Mark Shipped
                            </button>
                        )}
                        {(job.status === 'packing') && (
                            <button
                                onClick={handleMarkAllPacked}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Mark All Packed
                            </button>
                        )}
                        {isAdmin && job.status !== 'shipped' && (
                            <a
                                href={`/packing/${job.id}/edit`}
                                className="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                            >
                                Edit
                            </a>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white font-medium">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-emerald-500 h-3 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {job.items?.filter(i => i.packed).length || 0} of {job.items?.length || 0} items packed
                    </p>
                </div>

                {/* Items table */}
                <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-300">Items</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddItem(true)}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                            >
                                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                                Add Item
                            </button>
                        )}
                    </div>

                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-[#16161f]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Qty</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Packed</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                                {isAdmin && <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {!job.items || job.items.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No items yet.</td>
                                </tr>
                            ) : job.items.map((item) => (
                                <tr key={item.id} className="hover:bg-[#2a2a3e]/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-white">{item.item?.name || `Item #${item.item_id}`}</div>
                                        <div className="text-xs text-gray-500">{item.item?.code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-300">{item.quantity}</td>
                                    <td className="px-4 py-3 text-center">
                                        {item.packed ? (
                                            <span className="text-emerald-400 font-bold">{item.packed_qty}</span>
                                        ) : (
                                            <span className="text-gray-600">0</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.packed ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                                <CheckIcon className="h-3 w-3 mr-1" /> Packed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleTogglePacked(item)}
                                                className="inline-flex items-center rounded-full bg-gray-600/50 px-2 py-0.5 text-xs font-medium text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400"
                                            >
                                                Mark Packed
                                            </button>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveItem(item)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="Remove"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notes */}
                {job.notes && (
                    <div className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4">
                        <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Notes</h3>
                        <p className="text-sm text-gray-300">{job.notes}</p>
                    </div>
                )}
            </div>

            {/* Add Item Modal */}
            <Modal show={showAddItem} onClose={() => setShowAddItem(false)} title="Add Item">
                <form onSubmit={handleAddItem} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Item</label>
                        <select
                            value={itemForm.item_id}
                            onChange={(e) => setItemForm({ ...itemForm, item_id: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white text-sm"
                            required
                        >
                            <option value="">Select an item...</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={itemForm.quantity}
                            onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white text-sm"
                            required
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAddItem(false)}
                            className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                        >
                            Add Item
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
