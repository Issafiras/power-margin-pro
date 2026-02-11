import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Prevent hard crash on startup if DATABASE_URL is missing
// This allows the Vercel function to start and report the error properly via API response
const isSupabase = process.env.DATABASE_URL?.includes("supabase.co") || process.env.DATABASE_URL?.includes("supabase.com");
const isProduction = process.env.NODE_ENV === "production";

let pool: pg.Pool;
let db: ReturnType<typeof drizzle>;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is missing. Database functionality will fail.");
  // Create a dummy pool/db that throws on access, or just leave them undefined/handled
  // We'll throw only when they are accessed
  const throwMissingDb = () => { throw new Error("DATABASE_URL must be set. Did you forget to provision a database?"); };
  pool = { connect: throwMissingDb, query: throwMissingDb, end: throwMissingDb } as any;
  db = {
    select: throwMissingDb,
    insert: throwMissingDb,
    update: throwMissingDb,
    delete: throwMissingDb,
    query: {},
    transaction: throwMissingDb
  } as any;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSupabase ? { rejectUnauthorized: false } : (isProduction ? { rejectUnauthorized: false } : undefined),
    connectionTimeoutMillis: 10000,
  });
  db = drizzle(pool, { schema });
}

export const dbConfigured = !!process.env.DATABASE_URL;

export { pool, db };
