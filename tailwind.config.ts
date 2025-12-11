import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // Astra Collegia™ Color System
            colors: {
                // Primary — Royal Midnight
                primary: {
                    DEFAULT: '#150E56',
                    50: '#E8E6F2',
                    100: '#C5C0E0',
                    200: '#9F97CC',
                    300: '#796DB8',
                    400: '#5D4EA9',
                    500: '#150E56', // Base
                    600: '#120C4E',
                    700: '#0F0A43',
                    800: '#0C0839',
                    900: '#060420',
                },
                // Accent Dark — Crimson Regent
                accent: {
                    DEFAULT: '#7B113A',
                    50: '#F9E6ED',
                    100: '#F0BFD1',
                    200: '#E695B3',
                    300: '#DC6B95',
                    400: '#D44B7E',
                    500: '#7B113A', // Base
                    600: '#6F0F34',
                    700: '#5F0D2C',
                    800: '#4F0A25',
                    900: '#32061A',
                },
                // Secondary — Hyper Aqua
                secondary: {
                    DEFAULT: '#1597BB',
                    50: '#E6F6FA',
                    100: '#BFE8F2',
                    200: '#95D9EA',
                    300: '#6BCAE1',
                    400: '#4BBFDB',
                    500: '#1597BB', // Base
                    600: '#1388AB',
                    700: '#107595',
                    800: '#0D627F',
                    900: '#084259',
                },
                // Accent Light — Ice Blue Mist
                mist: {
                    DEFAULT: '#8FD6E1',
                    50: '#F5FCFD',
                    100: '#E3F6F9',
                    200: '#C7EDF3',
                    300: '#ABE4ED',
                    400: '#8FD6E1', // Base
                    500: '#6DC8D9',
                    600: '#4AB5C8',
                    700: '#3A9AAC',
                    800: '#2E7E8D',
                    900: '#1F5460',
                },
                // Neutrals
                dark: {
                    DEFAULT: '#202124',
                    50: '#F5F5F6',
                    100: '#E8E8EA',
                    200: '#D1D1D4',
                    300: '#BABABE',
                    400: '#A3A3A8',
                    500: '#8C8C92',
                    600: '#75757C',
                    700: '#5E5E66',
                    800: '#474750',
                    900: '#202124', // Base
                },
                soft: {
                    DEFAULT: '#E8EAED',
                    50: '#FFFFFF',
                    100: '#FAFBFC',
                    200: '#F5F6F8',
                    300: '#F0F1F4',
                    400: '#E8EAED', // Base
                    500: '#D4D7DC',
                    600: '#C0C4CB',
                    700: '#ACB1BA',
                    800: '#989EA9',
                    900: '#848B98',
                },
            },
            // Typography
            fontFamily: {
                sans: ['Poppins', 'system-ui', 'sans-serif'],
                mono: ['Roboto Mono', 'Menlo', 'monospace'],
            },
            fontSize: {
                // H1: 42px
                'h1': ['42px', { lineHeight: '1.2', fontWeight: '600' }],
                // H2: 30px
                'h2': ['30px', { lineHeight: '1.3', fontWeight: '500' }],
                // H3: 20px
                'h3': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
                // Body: 16px
                'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
                // Label: 12-14px
                'label-sm': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
                'label': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
                // Data: 14px mono
                'data': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
            },
            // Spacing (8px base unit)
            spacing: {
                '0.5': '4px',   // 0.5 * 8
                '1': '8px',     // 1 * 8
                '2': '16px',    // 2 * 8
                '3': '24px',    // 3 * 8
                '4': '32px',    // 4 * 8
                '5': '40px',    // 5 * 8
                '6': '48px',    // 6 * 8
                '8': '64px',    // 8 * 8
                '10': '80px',   // 10 * 8
                '12': '96px',   // 12 * 8
                '16': '128px',  // 16 * 8
            },
            // Grid
            gridTemplateColumns: {
                '12': 'repeat(12, minmax(0, 1fr))',
            },
            gap: {
                'gutter': '24px',
            },
            // Border Radius
            borderRadius: {
                'sm': '4px',
                'DEFAULT': '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '24px',
            },
            // Box Shadow
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(21, 14, 86, 0.05)',
                'DEFAULT': '0 1px 3px 0 rgba(21, 14, 86, 0.1), 0 1px 2px -1px rgba(21, 14, 86, 0.1)',
                'md': '0 4px 6px -1px rgba(21, 14, 86, 0.1), 0 2px 4px -2px rgba(21, 14, 86, 0.1)',
                'lg': '0 10px 15px -3px rgba(21, 14, 86, 0.1), 0 4px 6px -4px rgba(21, 14, 86, 0.1)',
                'xl': '0 20px 25px -5px rgba(21, 14, 86, 0.1), 0 8px 10px -6px rgba(21, 14, 86, 0.1)',
                'glow': '0 0 20px rgba(21, 151, 187, 0.4)',
                'glow-accent': '0 0 20px rgba(123, 17, 58, 0.4)',
            },
            // Animations
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'lift': 'lift 0.12s ease-out',
                'shake': 'shake 0.3s ease-in-out',
                'liquid-fill': 'liquidFill 1.5s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                lift: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-4px)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
                },
                liquidFill: {
                    '0%': { width: '0%' },
                    '100%': { width: '100%' },
                },
            },
            // Transition Durations
            transitionDuration: {
                '90': '90ms',
                '120': '120ms',
                '160': '160ms',
            },
            // Backdrop Blur
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'DEFAULT': '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '24px',
            },
        },
    },
    plugins: [],
};

export default config;
