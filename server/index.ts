import "dotenv/config";
import { createApp } from "./app";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Vercel Serverless Handler
let appHandler: any;
export default async (req: any, res: any) => {
  if (!appHandler) {
    const { app } = await createApp();
    appHandler = app;
  }
  appHandler(req, res);
};

// Validates if running directly (npm run dev) vs imported (Vercel)
// We rely on Vercel setting process.env.VERCEL=1 (or simply not running the IIFE if imported as a module in some contexts, 
// but checking VERCEL is safer to avoid double-binding).
if (!process.env.VERCEL) {
  (async () => {
    const { httpServer } = await createApp();

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  })();
}

