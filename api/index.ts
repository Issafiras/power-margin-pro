import { createApp } from '../server/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let server: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!server) {
    const { app } = await createApp();
    server = app;
  }
  return server(req, res);
}
