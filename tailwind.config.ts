import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
          3: "var(--bg-3)",
          4: "var(--bg-4)",
        },
        fg: {
          0: "var(--fg-0)",
          1: "var(--fg-1)",
          2: "var(--fg-2)",
          3: "var(--fg-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
          soft: "var(--accent-soft)",
          strong: "var(--accent-strong)",
        },
        danger: "var(--danger)",
        warn: "var(--warn)",
        ok: "var(--ok)",
        info: "var(--info)",
        purple: "var(--purple)",
        pink: "var(--pink)",
        teal: "var(--teal)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        s: "6px",
        DEFAULT: "10px",
        l: "14px",
        xl: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.4)",
        pop: "0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px var(--border-strong)",
      },
    },
  },
  plugins: [],
};
export default config;
