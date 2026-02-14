import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Prevent hard crash on startup if DATABASE_URL is missing
// This allows the Vercel function to start and report the error properly via API response
const isSupabase = process.env.DATABASE_URL?.includes("supabase.co") || process.env.DATABASE_URL?.includes("supabase.com");

let client: postgres.Sql<{}>;
let db: ReturnType<typeof drizzle>;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is missing. Database functionality will fail.");
  // Create a dummy client/db that throws on access
  const throwMissingDb = () => { throw new Error("DATABASE_URL must be set. Did you forget to provision a database?"); };
  // @ts-ignore - limited dummy implementation
  client = throwMissingDb as any;
  db = {
    select: throwMissingDb,
    insert: throwMissingDb,
    update: throwMissingDb,
    delete: throwMissingDb,
    query: {},
    transaction: throwMissingDb,
    execute: throwMissingDb,
  } as any;
} else {
  // Use postgres.js with prepare: false for Supabase Transaction Pooler (port 6543) compatibility
  client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined
  });
  db = drizzle(client, { schema });
}


export const dbConfigured = !!process.env.DATABASE_URL;

export { client, db };
