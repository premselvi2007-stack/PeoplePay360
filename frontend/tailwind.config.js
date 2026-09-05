/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5f8',
          100: '#f5eaf2',
          200: '#ebd5e5',
          300: '#dbb4d1',
          400: '#c287b4',
          500: '#a76196',
          600: '#8c487b',
          700: '#714B67', // Classic Odoo Purple
          800: '#5e3e56',
          900: '#4f3549',
          950: '#321d2d',
        },
        canvas: {
          light: '#FBF9F4', // Warm sandal/ivory
          dark: '#0F1117',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#181B23',
        },
        ink: {
          900: '#09090B',
          800: '#18181B',
          700: '#27272A',
          600: '#3F3F46',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E4E4E7',
          100: '#F4F4F5',
          50: '#FAFAFA',
        },
        accent: {
          green: '#059669',
          amber: '#D97706',
          blue: '#2563EB',
          rose: '#E11D48',
        }
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px rgba(9,9,11,1)',
        'neo': '3px 3px 0px 0px rgba(9,9,11,1)',
        'neo-lg': '5px 5px 0px 0px rgba(9,9,11,1)',
        'neo-dark-sm': '2px 2px 0px 0px rgba(244,244,245,0.9)',
        'neo-dark': '3px 3px 0px 0px rgba(244,244,245,0.9)',
        'neo-dark-lg': '5px 5px 0px 0px rgba(244,244,245,0.9)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'neo': '6px',
        'neo-lg': '8px',
      }
    },
  },
  plugins: [],
}
