import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, writeFile, cp } from "fs/promises";
import path from "path";

// Dependencies to bundle into the serverless function (reduces cold start)
const bundleDeps = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "postgres",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

const VERCEL_OUT = ".vercel/output";
const FUNC_DIR = `${VERCEL_OUT}/functions/api/index.func`;

async function buildAll() {
  // Clean previous builds
  await rm("dist", { recursive: true, force: true });
  await rm(VERCEL_OUT, { recursive: true, force: true });

  // ── 1. Build client with Vite ──────────────────────────────────────
  console.log("1/4  Building client (Vite)...");
  await viteBuild({
    build: {
      outDir: path.resolve("dist/public"),
      emptyOutDir: true,
    },
  });

  // ── 2. Build local dev server ──────────────────────────────────────
  console.log("2/4  Building local server (esbuild → dist/index.cjs)...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !bundleDeps.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // ── 3. Build Vercel serverless function ────────────────────────────
  console.log("3/4  Building Vercel serverless function...");
  await mkdir(FUNC_DIR, { recursive: true });

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: `${FUNC_DIR}/index.mjs`,
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    // pdfkit & xlsx are dynamically imported — keep external
    external: ["pdfkit", "xlsx"],
    banner: {
      js: `import{createRequire}from'module';const require=createRequire(import.meta.url);`,
    },
    logLevel: "info",
  });

  // Write function config
  await writeFile(
    `${FUNC_DIR}/.vc-config.json`,
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "index.mjs",
        maxDuration: 60,
        launcherType: "Nodejs",
      },
      null,
      2
    )
  );

  // ── 4. Write Vercel Build Output config ────────────────────────────
  console.log("4/4  Writing Vercel Build Output config...");

  // Copy static files
  await mkdir(`${VERCEL_OUT}/static`, { recursive: true });
  await cp("dist/public", `${VERCEL_OUT}/static`, { recursive: true });

  // Write routing config
  await writeFile(
    `${VERCEL_OUT}/config.json`,
    JSON.stringify(
      {
        version: 3,
        routes: [
          // API routes → serverless function
          { src: "/api/(.*)", dest: "/api/index" },
          // Static file handling (assets, etc.)
          { handle: "filesystem" },
          // SPA fallback → index.html
          { src: "/(.*)", dest: "/index.html" },
        ],
      },
      null,
      2
    )
  );

  console.log("✅ Build complete!");
  console.log(`   Static files:  ${VERCEL_OUT}/static/`);
  console.log(`   Function:      ${FUNC_DIR}/index.mjs`);
  console.log(`   Config:        ${VERCEL_OUT}/config.json`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
