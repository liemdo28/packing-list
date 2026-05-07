import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LockClosedIcon, ReceiptPercentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Alert from '../components/Alert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setError('');
    setLoading(true);
    setUsername(user);
    setPassword('password');
    try {
      await login(user, 'password');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
              <ReceiptPercentIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Restaurant Operation System</h2>
            <p className="mt-1 text-sm text-gray-500">Internal Store Transfer Management</p>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="username" className="label-field">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field mt-1"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="label-field">Password</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlashIcon className="h-5 w-5" />
                    : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LockClosedIcon className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs font-medium text-gray-500 mb-3 text-center">Quick Fill Username</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { user: 'admin', label: 'Admin' },
                { user: 'user_b1', label: 'B1 Staff' },
                { user: 'user_b2', label: 'B2 Staff' },
                { user: 'user_b3', label: 'B3 Staff' },
                { user: 'accountant', label: 'Accountant' },
              ].map(({ user, label }) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:border-primary-300 transition-colors text-left"
                >
                  <span className="font-medium">{label}</span>
                  <span className="block text-gray-400">{user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
