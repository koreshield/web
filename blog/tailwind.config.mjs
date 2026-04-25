/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                'deep-navy': '#050a14',
                'navy-surface': '#0f1623',
                'electric-blue': '#3b82f6',
                'cyber-purple': '#7c3aed',
                'security-green': '#10b981',
            },
            animation: {
                'fade-in': 'fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                'fade-in': {
                    'from': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
                },
                'glow': {
                    'from': { boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6' },
                    'to': { boxShadow: '0 0 20px #3b82f6, 0 0 30px #7c3aed' },
                },
            },
        },
    },
    plugins: [],
}
