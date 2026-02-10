import { createApp } from '../server/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: Awaited<ReturnType<typeof createApp>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
