import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // The CSS variable is set by next/font in src/app/layout.tsx and
        // currently resolves to Manrope (the free Gilroy alternative).
        // Listing 'Gilroy' first means a licensed Gilroy install on the
        // user's system would take precedence automatically.
        sans: ['Gilroy', 'var(--font-sans)', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#3182F6",
        primaryHover: "#2C75DD",
        surface: "#FFFFFF",
        surfaceAlt: "#F2F4F6",
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;
