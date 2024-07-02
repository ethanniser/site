/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Berkeley Mono Trial"', "sans-serif"],
      },
      backgroundImage: {
        svg1: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><circle cx="1" cy="1" r=".5"/><circle cx="3" cy="3" r=".5"/></svg>')`,
        svg2: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><path stroke="%23000" stroke-width=".5" d="m0 0 4 4Zm4 0L0 4Z"/></svg>')`,
      },
      skew: {
        5: "5deg",
        10: "10deg",
      },
    },
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
