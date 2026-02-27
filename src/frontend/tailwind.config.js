import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        /* Space-specific named colors */
        "space-blue": "oklch(var(--space-blue))",
        "space-purple": "oklch(var(--space-purple))",
        "space-gold": "oklch(var(--space-gold))",
        "space-green": "oklch(var(--space-green))",
        "space-red": "oklch(var(--space-red))",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        "glow-blue": "0 0 20px oklch(0.72 0.18 220 / 0.5), 0 0 40px oklch(0.72 0.18 220 / 0.2)",
        "glow-gold": "0 0 20px oklch(0.80 0.16 50 / 0.5), 0 0 40px oklch(0.80 0.16 50 / 0.2)",
        "glow-purple": "0 0 20px oklch(0.65 0.14 295 / 0.5), 0 0 40px oklch(0.65 0.14 295 / 0.2)",
        "glow-sm-blue": "0 0 10px oklch(0.72 0.18 220 / 0.4)",
        "glow-sm-gold": "0 0 10px oklch(0.80 0.16 50 / 0.4)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "radial-burst": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "pulse-ring": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 10px oklch(0.72 0.18 220 / 0.3), 0 0 20px oklch(0.72 0.18 220 / 0.1)",
          },
          "50%": {
            boxShadow: "0 0 20px oklch(0.72 0.18 220 / 0.6), 0 0 40px oklch(0.72 0.18 220 / 0.3)",
          },
        },
        "glow-pulse-gold": {
          "0%, 100%": {
            boxShadow: "0 0 10px oklch(0.80 0.16 50 / 0.3), 0 0 20px oklch(0.80 0.16 50 / 0.1)",
          },
          "50%": {
            boxShadow: "0 0 20px oklch(0.80 0.16 50 / 0.6), 0 0 40px oklch(0.80 0.16 50 / 0.3)",
          },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "radial-burst": "radial-burst 0.6s ease-out forwards",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "glow-pulse-gold": "glow-pulse-gold 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        twinkle: "twinkle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
