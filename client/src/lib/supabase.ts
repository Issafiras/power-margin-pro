import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // It's okay to not have keys during build time or initial scaffolding, 
  // but they are required for runtime functionality.
  console.warn("Supabase URL or Anon Key missing. Authentication features will not work.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
