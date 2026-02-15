
import { build } from "esbuild";

console.log("Building API bundle for Vercel...");

await build({
    entryPoints: ["server/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20", // Matching engines.node in package.json
    format: "esm",
    outfile: "dist/api/index.js",
    define: { "process.env.NODE_ENV": '"production"' },
    external: [], // Bundle everything as requested to avoid missing modules
    logLevel: "info",
    banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
});
