import { defineEcConfig } from "astro-expressive-code";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import ecTwoSlash from "expressive-code-twoslash";

export default defineEcConfig({
  plugins: [pluginCollapsibleSections(), pluginLineNumbers(), ecTwoSlash()],
  themes: ["github-light", "github-dark"],
  defaultProps: {
    showLineNumbers: false,
  },
});
