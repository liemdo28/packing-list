import { Head, useForm } from '@inertiajs/react';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-neon-red">
                            <LockClosedIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                            <span className="text-red-500">Packing</span> List System
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-400">
                            Sign in to your account
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4 rounded-md">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    placeholder="you@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    placeholder="Password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                                Remember me
                            </label>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 shadow-neon-red transition-all"
                            >
                                {processing ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 rounded-md bg-[#1e1e2e] border border-gray-700/50 p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Test Accounts</h3>
                        <div className="space-y-1 text-xs text-gray-400">
                            <p><strong className="text-red-400">Admin:</strong> admin@packinglist.com / password</p>
                            <p><strong className="text-blue-400">Accountant:</strong> accountant@packinglist.com / password</p>
                            <p><strong className="text-emerald-400">Store B1:</strong> b1@packinglist.com / password</p>
                            <p><strong className="text-emerald-400">Store B2:</strong> b2@packinglist.com / password</p>
                            <p><strong className="text-emerald-400">Store B3:</strong> b3@packinglist.com / password</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
