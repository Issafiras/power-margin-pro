import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function createTables() {
  console.log("Creating AI knowledge tables...\n");

  await sql`CREATE TABLE IF NOT EXISTS brand_margins (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL UNIQUE,
    margin_tier TEXT NOT NULL,
    margin_percent REAL,
    is_house_brand BOOLEAN DEFAULT FALSE,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("✅ brand_margins");

  await sql`CREATE TABLE IF NOT EXISTS margin_price_patterns (
    id TEXT PRIMARY KEY,
    pattern TEXT NOT NULL,
    description TEXT NOT NULL,
    margin_bonus REAL NOT NULL,
    examples TEXT[],
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("✅ margin_price_patterns");

  await sql`CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    priority REAL DEFAULT 50,
    embedding JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS knowledge_category_idx ON ai_knowledge_base(category)`;
  await sql`CREATE INDEX IF NOT EXISTS knowledge_tags_idx ON ai_knowledge_base USING GIN(tags)`;
  console.log("✅ ai_knowledge_base");

  await sql`CREATE TABLE IF NOT EXISTS laptop_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    min_ram_gb REAL,
    recommended_ram_gb REAL,
    min_cpu_tier REAL,
    recommended_cpu_tier REAL,
    needs_dedicated_gpu BOOLEAN DEFAULT FALSE,
    important_features TEXT[],
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("✅ laptop_categories");

  await sql`CREATE TABLE IF NOT EXISTS upgrade_paths (
    id TEXT PRIMARY KEY,
    from_tier TEXT NOT NULL,
    to_tier TEXT NOT NULL,
    from_specs JSONB,
    to_specs JSONB,
    price_range_min REAL,
    price_range_max REAL,
    recommendation TEXT NOT NULL,
    target_audience TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("✅ upgrade_paths");

  // Now seed the data
  console.log("\n🌱 Seeding data...\n");

  // Brand margins
  await sql`INSERT INTO brand_margins VALUES 
    ('bm-cepter', 'Cepter', 'highest', 35, TRUE, 'Power eget mærke - ALTID hoj avance'),
    ('bm-dream', 'Dream Machines', 'high', 28, TRUE, 'Power gaming brand'),
    ('bm-acer', 'Acer', 'medium', 18, FALSE, 'God avance budget/mid-range'),
    ('bm-asus', 'ASUS', 'medium', 16, FALSE, 'Stabil avance'),
    ('bm-lenovo', 'Lenovo', 'medium', 15, FALSE, 'IdeaPad bedre margin end ThinkPad'),
    ('bm-hp', 'HP', 'medium', 15, FALSE, 'Pavilion/Victus bedre margin'),
    ('bm-msi', 'MSI', 'high', 22, FALSE, 'Gaming laptops god avance'),
    ('bm-samsung', 'Samsung', 'low', 10, FALSE, 'Lav margin men godt for image'),
    ('bm-apple', 'Apple', 'low', 8, FALSE, 'Meget lav margin'),
    ('bm-razer', 'Razer', 'low', 12, FALSE, 'Premium begranset avance')
  ON CONFLICT (id) DO NOTHING`;
  console.log("✅ 10 brand margins seeded");

  // Margin patterns
  await sql`INSERT INTO margin_price_patterns VALUES
    ('mpp-92', 'ends_with_92', 'Pris slutter pa 92 - hoj margin', 40, ARRAY['3992','5492','6992','8992']),
    ('mpp-98', 'ends_with_98', 'Pris slutter pa 98 - hoj margin', 40, ARRAY['4498','6498','7998','9998']),
    ('mpp-round', 'round_price', 'Runde priser - lav margin kampagne', -10, ARRAY['5000','7000','10000']),
    ('mpp-99', 'ends_with_99', 'Pris slutter pa 99 - neutral', 0, ARRAY['4999','6999','8999'])
  ON CONFLICT (id) DO NOTHING`;
  console.log("✅ 4 margin patterns seeded");

  // AI Knowledge
  await sql`INSERT INTO ai_knowledge_base (id, category, title, content, tags, priority) VALUES
    ('kb-cpu-1', 'cpu_info', 'Intel Core Ultra 200', 'Intel Core Ultra (Series 2) er nyeste. Ultra 9 > Ultra 7 > Ultra 5. Ultra 7 er sweet spot. Alle har NPU til AI.', ARRAY['intel','cpu','core-ultra'], 90),
    ('kb-cpu-2', 'cpu_info', 'AMD Ryzen 8000/9000', 'AMD Ryzen 8000/9000 er nyeste. Ryzen 7 bedste vaerdi. Ryzen 9 til kraevende. Staerk integreret grafik.', ARRAY['amd','ryzen','cpu'], 90),
    ('kb-cpu-3', 'cpu_info', 'Apple M4 familie', 'M4 > M4 Pro > M4 Max > M4 Ultra. M4 base overraskende kraeftig. M4 Pro professionelle. M4 Max tung kreativ.', ARRAY['apple','m4','cpu'], 85),
    ('kb-cpu-4', 'cpu_info', 'CPU tiers salgsguide', 'Tier D (undga): Celeron/Pentium. Tier C (budget): i3/Ryzen 3. Tier B (sweet spot): i5/Ryzen 5. Tier A: i7/Ryzen 7. Tier S: i9/Ryzen 9.', ARRAY['cpu','tiers','guide'], 95),
    ('kb-gpu-1', 'gpu_info', 'RTX 40 vs 50 serie', 'RTX 50-serien (2025) nyeste. RTX 5060 god gaming. RTX 5070 sweet spot. RTX 40-serien stadig relevant, bedre vaerdi.', ARRAY['nvidia','rtx','gpu'], 85),
    ('kb-gpu-2', 'gpu_info', 'Integreret vs dedikeret', 'Integreret (Iris/AMD) fint til kontor. Dedikeret (RTX/RX) noedvendig til gaming, video, 3D.', ARRAY['gpu','integreret','dedikeret'], 80),
    ('kb-upgrade-1', 'upgrade_tip', 'RAM vigtigst', '8GB minimum 2025, 16GB anbefales STRKT. 32GB professionelle. RAM loddet fast - koeb nok fra start!', ARRAY['ram','upgrade','vigtigst'], 100),
    ('kb-upgrade-2', 'upgrade_tip', 'Storage 512GB min', '256GB fyldes hurtigt. 512GB minimum. 1TB til billeder/video. NVMe 5-10x hurtigere end SATA.', ARRAY['storage','ssd','upgrade'], 90),
    ('kb-upgrade-3', 'upgrade_tip', 'CPU ikke opgraderbar', 'CPU loddet fast paa ALLE moderne laptops. Koeb god CPU fra start!', ARRAY['cpu','ikke-opgraderbar'], 95),
    ('kb-use-1', 'use_case', 'Studerende', '16GB RAM, god batteritid, let, 512GB+. Gaming GPU ikke noedvendig. Budget: 5000-8000 kr.', ARRAY['student','brug'], 75),
    ('kb-use-2', 'use_case', 'Gaming', 'Dedikeret GPU RTX 4060+, 16-32GB RAM, i5/Ryzen 5+, 144Hz+, god koeling. Budget: 8000-15000 kr.', ARRAY['gaming','brug'], 75),
    ('kb-use-3', 'use_case', 'Kontor/Business', '16GB RAM, i5/Ryzen 5+, 512GB SSD, IPS skærm. GPU ikke vigtig. Cepter bedre for butikken.', ARRAY['kontor','business'], 70),
    ('kb-sales-1', 'sales_tip', 'Cepter altid forst', 'Cepter er Power eget mærke med HØJEST avance. Start altid med Cepter. Bedre specs til prisen.', ARRAY['cepter','salg','avance'], 100),
    ('kb-sales-2', 'sales_tip', 'Pris-afslører margin', '92/98 slutning = hoj margin (6992, 8498). Runde priser (5000, 7000) = lav margin kampagne.', ARRAY['pris','margin','tip'], 95),
    ('kb-sales-3', 'sales_tip', 'Undgå Apple salg', 'Apple MEGET lav margin (~8%). Sælg kun hvis kunden insisterer. Sammenlign med ASUS/Samsung alternativer.', ARRAY['apple','lav-margin'], 85),
    ('kb-sales-4', 'sales_tip', 'Tilbehør oger avance', 'Tilbud ALTID: sleeve, mus, oplader, USB-C hub, skærmbeskytter. Hoj margin og kunden er i koebemodus.', ARRAY['tilbehor','mersalg'], 80)
  ON CONFLICT (id) DO NOTHING`;
  console.log("✅ 16 AI knowledge entries seeded");

  // Laptop categories
  await sql`INSERT INTO laptop_categories VALUES
    ('cat-student', 'Student', 'Til studie - let, god batteritid, budgetvenlig', 8, 16, 4, 6, FALSE, ARRAY['Lang batteritid','Let vaegt','USB-C','WiFi 6']),
    ('cat-office', 'Kontor', 'Kontorarbejde - palidelig, multitasking', 8, 16, 5, 7, FALSE, ARRAY['God skaerm','Komfortabelt tastatur','Stoejsvag']),
    ('cat-gaming', 'Gaming', 'Gaming - dedikeret GPU, hoj refresh', 16, 32, 6, 8, TRUE, ARRAY['Dedikeret GPU','Hoj refresh','God koeling','RGB']),
    ('cat-creative', 'Kreativ', 'Foto/video/grafik - kraftig CPU/GPU', 16, 32, 7, 9, TRUE, ARRAY['Farveaccurat skaerm','Meget RAM','Hurtig storage','Thunderbolt']),
    ('cat-business', 'Business', 'Professionelle - sikkerhed, docking', 16, 32, 6, 8, FALSE, ARRAY['Fingeraftryk','TPM','Docking','MIL-STD']),
    ('cat-budget', 'Budget', 'Basis - browsing, email, dokumenter', 4, 8, 2, 4, FALSE, ARRAY['God pris','Nok til basics'])
  ON CONFLICT (id) DO NOTHING`;
  console.log("✅ 6 laptop categories seeded");

  // Upgrade paths
  await sql`INSERT INTO upgrade_paths VALUES
    ('up-1', 'budget', 'mid_range', '{"cpuTier":4,"ramGB":8,"storageGB":256}'::jsonb, '{"cpuTier":6,"ramGB":16,"storageGB":512}'::jsonb, 1500, 3000, 'Fra 8GB/256GB til 16GB/512GB - vigtigste opgradering. 2x RAM og 2x storage.', 'Alle med raad - især studerende og kontor'),
    ('up-2', 'mid_range', 'high_end', '{"cpuTier":6,"ramGB":16,"storageGB":512}'::jsonb, '{"cpuTier":8,"ramGB":32,"storageGB":1024}'::jsonb, 3000, 5000, 'Fra 16GB til 32GB + bedre CPU. Til kreative professionelle.', 'Fotografer, video editors, udviklere'),
    ('up-3', 'mid_range', 'gaming', '{"cpuTier":6,"ramGB":16,"storageGB":512,"gpuTier":1}'::jsonb, '{"cpuTier":7,"ramGB":16,"storageGB":512,"gpuTier":5}'::jsonb, 2000, 4000, 'Tilfoej dedikeret RTX GPU. God 1080p gaming.', 'Gamere og GPU acceleration brugere')
  ON CONFLICT (id) DO NOTHING`;
  console.log("✅ 3 upgrade paths seeded");

  console.log("\n🎉 AI Knowledge Base fully created and seeded!");
  console.log("\n📊 Summary:");
  console.log("  - 10 brand margin profiles");
  console.log("  - 4 margin price patterns");
  console.log("  - 16 AI knowledge entries");
  console.log("  - 6 laptop categories");
  console.log("  - 3 upgrade paths");

  await sql.end();
}

createTables().catch(e => { console.error(e); process.exit(1); });
