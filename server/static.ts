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

  console.log("[DEBUG] Current working directory:", process.cwd());
  console.log("[DEBUG] Script directory:", __dirname);

  // List contents of cwd and one level up for debugging
  try {
    console.log("[DEBUG] Contents of cwd:", fs.readdirSync(process.cwd()));
  } catch (e) {
    console.log("[DEBUG] Error reading cwd:", e);
  }

  let distPath = pathsToCheck.find(p => {
    const exists = fs.existsSync(p);
    console.log(`[DEBUG] Checking path: ${p} -> ${exists ? "FOUND" : "NOT FOUND"}`);
    return exists;
  });

  if (!distPath) {
    // List contents of 'dist' if it exists in cwd to see what's inside
    const localDist = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(localDist)) {
      try {
        console.log("[DEBUG] Contents of dist:", fs.readdirSync(localDist));
      } catch (e) {
        console.log("[DEBUG] Error reading dist:", e);
      }
    }

    throw new Error(
      `Could not find the build directory. Checked: ${pathsToCheck.join(", ")}. CWD: ${process.cwd()}`,
    );
  }

  console.log(`[DEBUG] Serving static files from: ${distPath}`);

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
