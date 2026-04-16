import { Head, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';

export default function UsersEdit({ user, stores = [], roles = ['admin', 'accountant', 'store'] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role: user.role || 'store',
        store_id: user.store_id || '',
        active: user.active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <Layout>
            <Head title={`Edit User - ${user.name}`} />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Edit User: {user.name}</h1>

                <form onSubmit={handleSubmit} className="bg-[#1e1e2e] border border-gray-700/50 shadow-lg rounded-lg p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password (leave blank to keep current)</label>
                        <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" placeholder="New password..." />
                        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    </div>
                    {data.password && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                            <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                        <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required>
                            {roles.map((r) => (<option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>))}
                        </select>
                        {errors.role && <p className="mt-1 text-sm text-red-400">{errors.role}</p>}
                    </div>
                    {data.role === 'store' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Store</label>
                            <select value={data.store_id} onChange={(e) => setData('store_id', e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                                <option value="">Select store...</option>
                                {stores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
                            </select>
                            {errors.store_id && <p className="mt-1 text-sm text-red-400">{errors.store_id}</p>}
                        </div>
                    )}
                    <div className="flex items-center">
                        <input id="active" type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-300">Active</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => window.history.back()} className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">{processing ? 'Saving...' : 'Update User'}</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
