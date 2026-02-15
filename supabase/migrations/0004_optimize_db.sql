-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS power_products_brand_idx ON power_products (brand);
CREATE INDEX IF NOT EXISTS power_products_price_idx ON power_products (price);
CREATE INDEX IF NOT EXISTS power_products_is_high_margin_idx ON power_products (is_high_margin);

-- Ensure public read access for benchmark tables
ALTER TABLE cpu_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpu_benchmarks ENABLE ROW LEVEL SECURITY;

-- PostgREST/Supabase doesn't support CREATE POLICY IF NOT EXISTS in all versions, 
-- so strictly this might fail if run twice. 
-- However, standard Supabase migrations are usually run once.
-- We use a DO block to verify before creating if possible, but for simplicity in this context
-- we will assume clean application or handle errors manually.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cpu_benchmarks' 
        AND policyname = 'Allow public read access on cpu_benchmarks'
    ) THEN
        CREATE POLICY "Allow public read access on cpu_benchmarks"
        ON cpu_benchmarks FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gpu_benchmarks' 
        AND policyname = 'Allow public read access on gpu_benchmarks'
    ) THEN
        CREATE POLICY "Allow public read access on gpu_benchmarks"
        ON gpu_benchmarks FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;
