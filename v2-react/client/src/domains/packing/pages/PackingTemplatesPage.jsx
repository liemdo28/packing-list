import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../../api/axios';

export default function PackingTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/packing/templates/list');
            setTemplates(res.data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleDelete = async (t) => {
        if (!confirm(`Delete "${t.name}"?`)) return;
        try {
            await api.delete(`/packing/templates/${t.id}`);
            fetchTemplates();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <Link to="/packing" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
                    <h1 className="text-2xl font-bold mt-1">Packing Templates</h1>
                </div>
                <Link
                    to="/packing/templates/new"
                    className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                    <PlusIcon className="h-4 w-4 mr-1" /> New Template
                </Link>
            </div>

            <div className="grid gap-3">
                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : templates.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No templates yet.</p>
                ) : templates.map((t) => (
                    <div key={t.id} className="bg-white rounded-lg border p-4 flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{t.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{t.description || 'No description'}</p>
                            <p className="text-xs text-gray-400 mt-1">{t.PackingTemplateItems?.length || 0} items</p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to={`/packing/templates/${t.id}/edit`}
                                className="p-2 text-gray-400 hover:text-gray-700"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button onClick={() => handleDelete(t)} className="p-2 text-red-400 hover:text-red-600">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}