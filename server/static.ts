import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Check common build locations (local and Vercel)
  const pathsToCheck = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"), // Standard location relative to bundled server
    path.resolve(process.cwd(), ".next", "server", "chunks", "public"), // Next.js specific (unlikely here but good to check)
    path.join(__dirname, '../../dist/public') // api/index.js location adjustment
  ];

  let distPath = pathsToCheck.find(p => fs.existsSync(p));

  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Checked: ${pathsToCheck.join(", ")}. CWD: ${process.cwd()}`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
