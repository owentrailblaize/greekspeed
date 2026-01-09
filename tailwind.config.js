module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./(marketing)/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f6f8ff",
          100: "#e6edff",
          200: "#c4d4ff",
          300: "#9fbaff",
          400: "#7090ff",
          500: "#4568ff",
          600: "#2346e0",
          700: "#1833b5",
          800: "#102288",
          900: "#0b1965",
        },
        // Brand colors that use CSS variables for dynamic theming
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          accent: 'var(--brand-accent)',
          'accent-light': 'var(--brand-accent-light)',
          focus: 'var(--brand-focus)',
        },
      },
    },
  },
  plugins: [],
}; 