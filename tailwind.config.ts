import type { Config } from "tailwindcss";

export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				ink: "#060606",
				panel: "rgba(255, 255, 255, 0.04)",
				panelStrong: "rgba(255, 255, 255, 0.08)",
				line: "rgba(255, 255, 255, 0.1)",
				smoke: "#b8b8b8",
				pearl: "#f5f1ea",
				glow: "#87f07a",
				amber: "#ffb36b",
			},
			boxShadow: {
				soft: "0 24px 80px rgba(0, 0, 0, 0.45)",
				glow: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 80px rgba(135, 240, 122, 0.12)",
			},
			backgroundImage: {
				"hero-radial":
					"radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 58%)",
				grain: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
			},
			fontFamily: {
				display: [
					"Iowan Old Style",
					"Palatino Linotype",
					"Book Antiqua",
					"Cormorant Garamond",
					"serif",
				],
				sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
			},
			keyframes: {
				floatSlow: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-10px)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "0% 50%" },
					"100%": { backgroundPosition: "100% 50%" },
				},
			},
			animation: {
				floatSlow: "floatSlow 10s ease-in-out infinite",
				shimmer: "shimmer 8s linear infinite",
			},
		},
	},
	plugins: [],
} satisfies Config;
