// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
  plugins: [
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-classnames",
    "prettier-plugin-merge",
  ],
  endingPosition: "relative",
  overrides: [
    {
      // Target TypeScript code blocks in markdown files
      files: "*.md",
      options: {
        printWidth: 75,
      },
    },
  ],
};
