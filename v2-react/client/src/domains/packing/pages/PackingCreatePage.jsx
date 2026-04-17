import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

export default function PackingCreatePage() {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [form, setForm] = useState({
        name: '',
        type: 'shipment',
        from_store_id: '',
        notes: '',
        template_id: '',
    });

    useEffect(() => {
        api.get('/stores').then(r => setStores(r.data || []));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/packing', form);
            navigate(`/packing/${res.data.id}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating packing job');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">New Packing Job</h1>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium mb-1">Job Name *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <div className="flex gap-4">
                        {['shipment', 'transfer', 'event'].map(t => (
                            <label key={t} className="flex items-center gap-1.5 text-sm">
                                <input
                                    type="radio"
                                    name="type"
                                    value={t}
                                    checked={form.type === t}
                                    onChange={() => setForm({ ...form, type: t })}
                                    className="text-primary-600"
                                />
                                <span className="capitalize">{t}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">From Store</label>
                    <select
                        value={form.from_store_id}
                        onChange={(e) => setForm({ ...form, from_store_id: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="">Select store...</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows="3"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => navigate('/packing')}
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
                        Cancel
                    </button>
                    <button type="submit"
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                        Create Packing Job
                    </button>
                </div>
            </form>
        </div>
    );
}