import { createApp } from '../server/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Prevent unhandled rejections from crashing the serverless process
process.on('unhandledRejection', (reason: any) => {
  console.error('UNHANDLED REJECTION in serverless function:', reason?.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('UNCAUGHT EXCEPTION in serverless function:', error.message, error.stack);
});

let server: any = null;
let initError: Error | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // If a previous init failed, don't retry endlessly — return the cached error
    if (initError) {
      console.error("Returning cached init error:", initError.message);
      return res.status(500).json({
        success: false,
        error: "Server Initialization Failed",
        message: initError.message,
      });
    }

    if (!server) {
      console.log("Initializing serverless app instance...");
      try {
        const { app } = await createApp();
        server = app;
      } catch (initErr: any) {
        initError = initErr;
        console.error("FATAL: App initialization failed:", initErr.message, initErr.stack);
        return res.status(500).json({
          success: false,
          error: "Server Initialization Failed",
          message: initErr.message,
        });
      }
    }

    return server(req, res);
  } catch (error: any) {
    console.error("FATAL: Vercel Handler Crash:", error);
    return res.status(500).json({
      success: false,
      error: "Serverless Function Crash",
      message: error.message,
    });
  }
}
