import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function TemplateEdit({ template, items = [] }) {
    const [form, setForm] = useState({
        name: template.name || '',
        description: template.description || '',
        items: template.items?.map((i) => ({
            item_id: i.item_id,
            default_qty: parseFloat(i.default_qty),
        })) || [{ item_id: '', default_qty: 1 }],
    });

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { item_id: '', default_qty: 1 }] });
    };

    const removeItem = (index) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    };

    const updateItem = (index, field, value) => {
        const updated = [...form.items];
        updated[index][field] = value;
        setForm({ ...form, items: updated });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(`/packing/templates/${template.id}`, form);
    };

    return (
        <Layout>
            <Head title={`Edit ${template.name}`} />
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <Link href="/packing/templates" className="text-sm text-gray-400 hover:text-gray-200">← Back</Link>
                    <h1 className="text-2xl font-bold text-white mt-1">Edit Template</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Template Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white"
                            rows="2"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-300">Items</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center text-xs text-red-400 hover:text-red-300"
                            >
                                <PlusIcon className="h-3 w-3 mr-1" /> Add Item
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.items.map((row, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <select
                                        value={row.item_id}
                                        onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                                        className="flex-1 rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white text-sm"
                                        required
                                    >
                                        <option value="">Select item...</option>
                                        {items.map((i) => (
                                            <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={row.default_qty}
                                        onChange={(e) => updateItem(index, 'default_qty', parseFloat(e.target.value))}
                                        className="w-28 rounded-md bg-[#2a2a3e] border border-gray-600 px-3 py-2 text-white text-sm"
                                        required
                                    />
                                    {form.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-400 hover:text-red-300"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Link
                            href="/packing/templates"
                            className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500"
                        >
                            Cancel
                        </Link>
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