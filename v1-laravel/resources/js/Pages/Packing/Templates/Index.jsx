import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function TemplatesIndex({ templates }) {
    const handleDelete = (template) => {
        if (!confirm(`Delete template "${template.name}"?`)) return;
        router.delete(`/packing/templates/${template.id}`);
    };

    return (
        <Layout>
            <Head title="Packing Templates" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Link href="/packing" className="text-sm text-gray-400 hover:text-gray-200">← Back to Packing</Link>
                        <h1 className="text-2xl font-bold text-white mt-1">Packing Templates</h1>
                    </div>
                    <Link
                        href="/packing/templates/create"
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        New Template
                    </Link>
                </div>

                <div className="grid gap-4">
                    {templates.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No templates yet.</p>
                    ) : templates.map((t) => (
                        <div key={t.id} className="bg-[#1e1e2e] border border-gray-700/50 rounded-lg p-4 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-white">{t.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">{t.description || 'No description'}</p>
                                <p className="text-xs text-gray-500 mt-1">{t.items?.length || 0} items</p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/packing/templates/${t.id}/edit`}
                                    className="p-2 text-gray-400 hover:text-white"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(t)}
                                    className="p-2 text-red-400 hover:text-red-300"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}