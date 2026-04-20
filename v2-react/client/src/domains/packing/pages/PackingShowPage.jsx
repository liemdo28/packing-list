import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckIcon, TruckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import client from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';

export default function PackingShowPage() {
    const { id } = useParams();
    const { hasRole } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [items, setItems] = useState([]);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        try {
            const res = await client.get(`/packing/${id}`);
            setJob(res.data);
            setItems(res.data.PackingItems || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    const handleTogglePacked = async (item) => {
        try {
            await client.put(`/packing/${id}/items/${item.id}`, {
                packed: !item.packed,
                packed_qty: !item.packed ? item.quantity : item.packed_qty,
            });
            fetchJob();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveItem = async (item) => {
        if (!confirm('Remove item?')) return;
        try {
            await client.delete(`/packing/${id}/items/${item.id}`);
            fetchJob();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllPacked = async () => {
        try {
            await client.post(`/packing/${id}/mark-all-packed`);
            fetchJob();
        } catch (err) {
            console.error(err);
        }
    };

    const handleShip = async () => {
        try {
            await client.post(`/packing/${id}/ship`);
            fetchJob();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;
    if (!job) return <div className="p-6 text-red-500">Job not found.</div>;

    const packedCount = items.filter(i => i.packed).length;
    const progress = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{job.name}</h1>
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-gray-100 text-gray-700">
                            {job.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {job.fromStore ? `From: ${job.fromStore.name}` : 'No store'}
                        {job.order ? ` · Order: ${job.order.order_number}` : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAdd(true)}
                        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
                        <PlusIcon className="h-4 w-4 mr-1" /> Add Item
                    </button>
                    {job.status === 'packed' && (
                        <button onClick={handleShip}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            <TruckIcon className="h-4 w-4 mr-1" /> Ship
                        </button>
                    )}
                    {job.status !== 'packed' && job.status !== 'shipped' && (
                        <button onClick={handleMarkAllPacked}
                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                            <CheckIcon className="h-4 w-4 mr-1" /> Mark All Packed
                        </button>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{packedCount} of {items.length} items packed</p>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Packed</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            {hasRole('admin') && <th className="px-4 py-2"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.length === 0 && (
                            <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No items.</td></tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-2">
                                    <div className="text-sm font-medium">{item.item?.name || `Item #${item.item_id}`}</div>
                                    <div className="text-xs text-gray-500">{item.item?.code}</div>
                                </td>
                                <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                                <td className="px-4 py-2 text-center text-sm">{item.packed ? item.packed_qty : '—'}</td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => handleTogglePacked(item)}
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            item.packed
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600'
                                        }`}
                                    >
                                        {item.packed ? <><CheckIcon className="h-3 w-3 mr-1" /> Packed</> : 'Mark Packed'}
                                    </button>
                                </td>
                                {hasRole('admin') && (
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleRemoveItem(item)} className="text-red-400 hover:text-red-600">
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
                <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h3>
                    <p className="text-sm text-gray-700">{job.notes}</p>
                </div>
            )}

            {/* Simple Add Item Modal */}
            {showAdd && <AddItemModal id={id} onClose={() => setShowAdd(false)} onAdd={() => { setShowAdd(false); fetchJob(); }} />}
        </div>
    );
}

function AddItemModal({ id, onClose, onAdd }) {
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await client.post(`/packing/${id}/items`, { item_id: itemId, quantity: parseFloat(quantity) });
            onAdd();
        } catch (err) {
            alert(err.response?.data?.error || 'Error adding item');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 space-y-4">
                <h2 className="text-lg font-semibold">Add Item</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Item ID</label>
                        <input type="number" value={itemId} onChange={(e) => setItemId(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input type="number" min="0.001" step="0.001" value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm" required />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white text-sm">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
}