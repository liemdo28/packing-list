import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, createUser, updateUser } from '../../../api/users';
import { getStores } from '../../../api/stores';
import Alert from '../../../components/Alert';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ROLE_LABELS } from '../../../utils/constants';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: '', store_id: '', is_active: true });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStores().then(res => setStores(res.data.data)).catch(console.error);
    if (isEdit) {
      setLoading(true);
      getUser(id).then((res) => {
        const u = res.data.data;
        setForm({ username: u.username, password: '', full_name: u.full_name, email: u.email || '', role: u.role, store_id: u.store_id ? String(u.store_id) : '', is_active: u.is_active });
      }).catch(() => setError('Failed to load user')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { ...form, store_id: form.store_id ? parseInt(form.store_id, 10) : null };
    if (isEdit && !payload.password) delete payload.password;
    if (!isEdit && !payload.password) payload.password = 'password';
    try { if (isEdit) await updateUser(id, payload); else await createUser(payload); navigate('/users'); }
    catch (err) { setError(err.response?.data?.error || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  const needsStore = ['b1', 'b2', 'b3'].includes(form.role);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit User' : 'New User'}</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className="label-field">Username</label><input name="username" value={form.username} onChange={handleChange} className="input-field mt-1" required disabled={isEdit} /></div>
          <div><label className="label-field">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label><input name="password" type="password" value={form.password} onChange={handleChange} className="input-field mt-1" placeholder={isEdit ? 'Leave blank to keep current' : 'Default: password'} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className="label-field">Full Name</label><input name="full_name" value={form.full_name} onChange={handleChange} className="input-field mt-1" required /></div>
          <div><label className="label-field">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className="input-field mt-1" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className="label-field">Role</label><select name="role" value={form.role} onChange={handleChange} className="input-field mt-1" required><option value="">Select role</option>{Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select></div>
          <div><label className="label-field">Store</label><select name="store_id" value={form.store_id} onChange={handleChange} className="input-field mt-1" required={needsStore}><option value="">No store</option>{stores.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select></div>
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}</button>
        </div>
      </form>
    </div>
  );
}