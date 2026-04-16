/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
                    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
                    800: '#991b1b', 900: '#7f1d1d',
                },
                dark: {
                    50: '#252540',
                    100: '#1e1e2e',
                    200: '#1a1a2e',
                    300: '#16213e',
                    400: '#0f0f0f',
                    500: '#0a0a1a',
                    600: '#080818',
                    700: '#060612',
                    800: '#04040e',
                    900: '#020208',
                },
                neon: {
                    red: '#ef4444',
                    green: '#22c55e',
                    blue: '#3b82f6',
                    yellow: '#eab308',
                    purple: '#a855f7',
                    pink: '#ec4899',
                    cyan: '#06b6d4',
                },
            },
            boxShadow: {
                'neon-red': '0 0 10px rgba(239, 68, 68, 0.3)',
                'neon-green': '0 0 10px rgba(34, 197, 94, 0.3)',
                'neon-blue': '0 0 10px rgba(59, 130, 246, 0.3)',
                'neon-yellow': '0 0 10px rgba(234, 179, 8, 0.3)',
                'neon-purple': '0 0 10px rgba(168, 85, 247, 0.3)',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
