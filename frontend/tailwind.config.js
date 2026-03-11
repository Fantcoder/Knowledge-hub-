/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', 'system-ui', 'sans-serif'],
                serif: ['"Newsreader"', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                surface: {
                    0: 'var(--surface-0)',
                    1: 'var(--surface-1)',
                    2: 'var(--surface-2)',
                    3: 'var(--surface-3)',
                },
                ink: {
                    DEFAULT: 'var(--ink)',
                    muted: 'var(--ink-muted)',
                    faint: 'var(--ink-faint)',
                    ghost: 'var(--ink-ghost)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                    soft: 'var(--accent-soft)',
                    ink: 'var(--accent-ink)',
                },
                danger: {
                    DEFAULT: '#e55353',
                    soft: 'var(--danger-soft)',
                },
                border: {
                    DEFAULT: 'var(--border)',
                    strong: 'var(--border-strong)',
                },
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '20px',
                '4xl': '24px',
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            },
            fontSize: {
                '2xs': ['0.65rem', { lineHeight: '0.85rem' }],
            },
            animation: {
                'in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                'in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'in-scale': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.97)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
            },
            transitionTimingFunction: {
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },
    plugins: [],
}
