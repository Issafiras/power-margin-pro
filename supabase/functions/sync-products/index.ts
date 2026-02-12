import { createClient } from "@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        const connectionString = Deno.env.get("DATABASE_URL")!;
        const client = postgres(connectionString, { prepare: false });
        const db = drizzle(client);

        // Placeholder for scraping logic or call to external API
        // Implementing full scraping logic here requires porting regex rules.
        // For now, returning a success message to confirm the function is reachable.

        const { name } = await req.json();
        const data = {
            message: `Hello ${name || "world"} from Supabase Edge Function!`,
        };

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
