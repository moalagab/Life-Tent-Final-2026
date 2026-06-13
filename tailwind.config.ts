import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
        sans: ['Tajawal', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        midnight: {
          DEFAULT: "hsl(213, 58%, 11%)",
          light: "hsl(213, 45%, 18%)",
          lighter: "hsl(213, 35%, 25%)",
        },
        gold: {
          DEFAULT: "hsl(43, 100%, 50%)",
          dark: "hsl(35, 100%, 45%)",
          light: "hsl(43, 100%, 60%)",
        },
        burnt: {
          DEFAULT: "hsl(14, 80%, 54%)",
        },
        /* ── Life Tent Light Theme — brand tokens ─────────────────── */
        brand: {
          navy: {
            "50":  "#F4F6FB",
            "100": "#E9EEFA",
            "200": "#D5DEF3",
            "300": "#B4C4E9",
            "400": "#839CD6",
            "500": "#5677C1",
            "600": "#3556A1",
            "700": "#243F86",
            "800": "#1B2F6B",
            "900": "#121E4A",
            "950": "#0C132E",
          },
          gold: {
            "50":  "#FFF8E8",
            "100": "#FDEFC3",
            "200": "#FBE08C",
            "300": "#F8CF57",
            "400": "#F4C12F",
            "500": "#E7B21A",
            "600": "#C79512",
            "700": "#9D750E",
            "800": "#715409",
            "900": "#4A3706",
          },
        },
        surface: {
          base:      "#F7F6F2",
          canvas:    "#F2F0EA",
          card:      "#FFFFFF",
          cardSoft:  "#F6F4EE",
          cardMuted: "#ECE8DF",
          border:    "#DDD7CB",
          divider:   "#D1CBBF",
        },
        text: {
          primary:   "#121E4A",
          secondary: "#31456F",
          muted:     "#667798",
          inverse:   "#FFFFFF",
        },
        state: {
          success: { bg: "#EEF8F1", text: "#21643D", border: "#C9E7D2" },
          warning: { bg: "#FFF6E9", text: "#8A5A10", border: "#F0D8AF" },
          error:   { bg: "#FCEDEC", text: "#A94438", border: "#E8B7B1" },
          info:    { bg: "#EEF4FB", text: "#2E5C8A", border: "#C9D9EA" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.5rem",
        "3xl": "2rem",
        card:   "24px",
        button: "18px",
        pill:   "999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "gold-glow": "0 0 30px hsla(43, 100%, 50%, 0.3)",
        "gold-glow-sm": "0 0 15px hsla(43, 100%, 50%, 0.2)",
        // Life Tent Light theme shadows
        "card-sm": "0 4px 12px rgba(18, 30, 74, 0.05)",
        "card-md": "0 10px 24px rgba(18, 30, 74, 0.08)",
        "focus-gold": "0 0 0 4px rgba(231, 178, 26, 0.18)",
        // Theme-aware elevation scale (driven by CSS vars in :root / .dark)
        "elev-1": "var(--elev-1)",
        "elev-2": "var(--elev-2)",
        "elev-3": "var(--elev-3)",
        "elev-4": "var(--elev-4)",
        // Brand focus ring as a usable shadow (RTL-safe, no layout impact)
        "focus-brand": "var(--focus-ring)",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, hsl(43, 100%, 50%) 0%, hsl(35, 100%, 45%) 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsla(43, 100%, 50%, 0.3)" },
          "50%": { boxShadow: "0 0 40px hsla(43, 100%, 50%, 0.5)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "60%": { opacity: "1", transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "slide-up": "slide-up 0.25s ease-out both",
        "bounce-in": "bounce-in 0.30s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
