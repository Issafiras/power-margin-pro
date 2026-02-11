import { createApp } from '../server/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let server: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!server) {
      console.log("Initializing serverless app instance...");
      const { app } = await createApp();
      server = app;
    }
    return server(req, res);
  } catch (error: any) {
    console.error("FATAL: Vercel Handler Crash:", error);
    return res.status(500).json({
      success: false,
      error: "Serverless Function Crash",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
