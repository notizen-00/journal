import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const outDir = process.env.BUILD_OUT_DIR || "build";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: outDir,
      assets: outDir,
      fallback: undefined,
      strict: true,
    }),
    prerender: {
      handleHttpError: "warn",
      // A journal with no custom pages beyond home makes /[slug]'s
      // entries() return [] — a valid state, not a crawl failure.
      handleUnseenRoutes: "warn",
    },
  },
};

export default config;
