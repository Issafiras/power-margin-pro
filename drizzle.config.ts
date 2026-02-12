import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Use a dummy connection string for generation purposes if variable is missing
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";
}

export default defineConfig({
  out: "./supabase/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
