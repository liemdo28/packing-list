import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeftIcon, BeakerIcon } from '@heroicons/react/24/outline';

export default function RawMaterialsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        base_unit: '',
        category: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/raw-materials');
    };

    const inputClass = 'block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm';

    return (
        <Layout>
            <Head title="Create Raw Material" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/raw-materials" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BeakerIcon className="h-7 w-7 text-purple-400" />
                        Create Raw Material
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                        <input type="text" value={data.code} onChange={(e) => setData('code', e.target.value)} className={inputClass} placeholder="e.g., RM-001" required />
                        {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} placeholder="e.g., Oyster Sauce" required />
                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Base Unit</label>
                        <input type="text" value={data.base_unit} onChange={(e) => setData('base_unit', e.target.value)} className={inputClass} placeholder="e.g., can, bottle, kg, cup" required />
                        {errors.base_unit && <p className="mt-1 text-sm text-red-400">{errors.base_unit}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <input type="text" value={data.category} onChange={(e) => setData('category', e.target.value)} className={inputClass} placeholder="e.g., Sauce, Spice, Produce, Protein" />
                        {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Link href="/raw-materials" className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</Link>
                        <button type="submit" disabled={processing} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50">{processing ? 'Creating...' : 'Create Material'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
