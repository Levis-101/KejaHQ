import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        teal: {
          50:  '#edfaf9',
          100: '#d0f0ee',
          400: '#3db8b0',
          500: '#129990',
          600: '#107872',
          700: '#0d5c58',
          800: '#0a4340',
          900: '#072e2c',
        },
        amber: {
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}

export default config
