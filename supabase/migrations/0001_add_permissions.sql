-- Enable RLS
ALTER TABLE "power_products" ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Access" 
ON "power_products" 
FOR SELECT 
TO public 
USING (true);

-- Allow all access for service_role (backend) and postgres (superuser)
-- Note: service_role and postgres bypass RLS by default, but explicit policies can help clarity or if bypass is disabled.
-- This policy allows full access to authenticated users if the backend connects as such.
CREATE POLICY "Full Access for Backend" 
ON "power_products" 
FOR ALL 
TO authenticated, service_role 
USING (true) 
WITH CHECK (true);

-- Grant permissions to standard Supabase roles to ensure table access
GRANT ALL ON TABLE "power_products" TO anon;
GRANT ALL ON TABLE "power_products" TO authenticated;
GRANT ALL ON TABLE "power_products" TO service_role;
