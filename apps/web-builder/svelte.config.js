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
      // Rendered from src/routes/+error.svelte and served by nginx for any
      // path that doesn't match a prerendered page, so broken/typo'd links
      // get a real "not found" page instead of nginx's bare 404 or (as
      // before) silently serving the homepage.
      fallback: "404.html",
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
