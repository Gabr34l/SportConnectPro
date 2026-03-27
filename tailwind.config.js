module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00C853', dark: '#00952A', light: '#69F0AE', muted: '#E8F5E9' },
        accent: '#FF6D00',
      },
    },
  },
  plugins: [],
};
