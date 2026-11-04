// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * GitHub Pages build (static export).
 * Only active when GITHUB_PAGES=true (set by .github/workflows/deploy.yml).
 * Normal Lovable preview/publish builds are unaffected.
 *  - base path: the repository subpath (router basepath is derived from it)
 *  - "/" is prerendered to static HTML; all calculations run in the browser
 *  - no server bundle (nitro disabled)
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const pagesBase = process.env.PAGES_BASE_PATH || "/samuel-guevara-c10/";

export default defineConfig(
  isGithubPages
    ? {
        vite: { base: pagesBase },
        nitro: false,
        tanstackStart: {
          server: { entry: "server" },
          pages: [{ path: "/" }],
          prerender: { enabled: true, autoStaticPathsDiscovery: false, crawlLinks: false },
        },
      }
    : {
        tanstackStart: {
          // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
          // nitro/vite builds from this
          server: { entry: "server" },
        },
      },
);
