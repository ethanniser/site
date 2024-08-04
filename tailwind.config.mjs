/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Berkeley Mono Variable", "sans-serif"],
      },
      backgroundImage: {
        svg1: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><circle cx="1" cy="1" r=".5"/><circle cx="3" cy="3" r=".5"/></svg>')`,
        svg2: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><path stroke="%23000" stroke-width=".5" d="m0 0 4 4Zm4 0L0 4Z"/></svg>')`,
      },
      skew: {
        5: "5deg",
        10: "10deg",
      },
      fontWeight: {
        normal: "100", // 400
        medium: "110", // 500
        semibold: "120", // 600
        bold: "130", // 700
        extrabold: "140", // 800
        black: "150", // 900
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              fontWeight: "110",
            },
            strong: {
              fontWeight: "120",
            },
            "ol > li::marker": {
              fontWeight: "100",
            },
            dt: {
              fontWeight: "120",
            },
            blockquote: {
              fontWeight: "110",
            },
            h1: {
              fontWeight: "140",
            },
            "h1 strong": {
              fontWeight: "150",
            },
            h2: {
              fontWeight: "130",
            },
            "h2 strong": {
              fontWeight: "140",
            },
            h3: {
              fontWeight: "120",
            },
            "h3 strong": {
              fontWeight: "130",
            },
            h4: {
              fontWeight: "120",
            },
            "h4 strong": {
              fontWeight: "130",
            },
            kbd: {
              fontWeight: "110",
            },
            code: {
              fontWeight: "120",
            },
            pre: {
              fontWeight: "100",
            },
            "thread th": {
              fontWeight: "120",
            },
            "h1 a, h2 a, h3 a, h4 a, h5 a, h6 a": {
              textDecoration: "none",
            },
            "h1 a:hover::before, h2 a:hover::before, h3 a:hover::before, h4 a:hover::before, h5 a:hover::before, h6 a:hover::before":
              {
                content: '"#"',
                position: "absolute",
                transform: "translateX(-1.25rem)",
              },
            "h1, h2, h3, h4, h5, h6": {
              position: "relative",
            },
          },
        },
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
