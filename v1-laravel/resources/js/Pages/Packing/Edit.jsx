import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';

export default function PackingEdit({ job, stores = [] }) {
    const [form, setForm] = useState({
        name: job.name || '',
        type: job.type || 'shipment',
        from_store_id: job.from_store_id || '',
        notes: job.notes || '',
    });

    const TYPES = ['shipment', 'transfer', 'event'];

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(`/packing/${job.id}`, form);
    };

    return (
        <Layout>
            <Head title={`Edit ${job.name}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-white">Edit Packing Job</h1>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Job Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <div className="flex gap-3">
                            {TYPES.map((t) => (
                                <label key={t} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t}
                                        checked={form.type === t}
                                        onChange={() => setForm({ ...form, type: t })}
                                        className="text-red-600"
                                    />
                                    <span className="text-sm text-gray-300 capitalize">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From Store</label>
                        <select
                            value={form.from_store_id}
                            onChange={(e) => setForm({ ...form, from_store_id: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                        >
                            <option value="">No store</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                            rows="3"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <a
                            href={`/packing/${job.id}`}
                            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}