module.exports = {
    darkMode: 'class', // Always dark mode
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',   // Very light green
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',  // 🎯 CORE BRAND COLOR (Green)
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16',
                },
                secondary: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712', // Deep dark for specialized bg
                },
                dark: {
                    bg: '#121212',      // True conversion-friendly dark mode bg
                    card: '#1e1e1e',    // Slightly lighter for cards
                    text: '#e0e0e0',    // Soft white text
                },
                success: '#2ecc71', // Fresh Green
                error: '#e74c3c',   // Soft Red
                warning: '#f1c40f', // Sunflower Yellow
                border: '#e5e7eb',  // Light border
                'border-dark': '#333333', // Dark mode border
            },
            fontFamily: {
                heading: ['Inter', 'sans-serif'],
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Softer shadow
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                'seat': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'seat-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            borderRadius: {
                'ticket': '16px', // Standard radius for tickets
            }
        },
    },
    plugins: [],
}
