import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';

const TYPES = ['shipment', 'transfer', 'event'];

export default function PackingCreate({ stores = [], templates = [], order = null }) {
    const { auth } = usePage().props;

    const [form, setForm] = useState({
        name: order ? `Packing #${order.order_number}` : '',
        type: 'shipment',
        from_store_id: '',
        order_id: order?.id || '',
        notes: '',
        template_id: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post('/packing', form);
    };

    return (
        <Layout>
            <Head title="New Packing Job" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <DocumentPlusIcon className="h-8 w-8 text-red-400" />
                    <h1 className="text-2xl font-bold text-white">New Packing Job</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Job Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                            required
                            maxLength="150"
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
                            <option value="">Select store...</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Load from Template</label>
                        <select
                            value={form.template_id}
                            onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                        >
                            <option value="">— No template —</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} ({t.items?.length || 0} items)</option>
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
                            maxLength="500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <a
                            href="/packing"
                            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                        >
                            Create Packing Job
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}