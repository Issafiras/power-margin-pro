// Seed script for AI Knowledge Base
// Kør med: npx tsx server/scripts/seed-knowledge.ts

import { db, dbConfigured } from "../db";
import { 
  brandMargins, 
  marginPricePatterns, 
  aiKnowledgeBase,
  laptopCategories,
  upgradePaths 
} from "../../shared/schema";

async function seedKnowledgeBase() {
  if (!dbConfigured) {
    console.error("Database not configured!");
    process.exit(1);
  }

  console.log("🌱 Seeding AI Knowledge Base...\n");

  // ============================================
  // 1. BRAND MARGINS
  // ============================================
  console.log("📊 Seeding brand margins...");
  await db.insert(brandMargins).values([
    { id: "bm-cepter", brandName: "Cepter", marginTier: "highest", marginPercent: 35, isHouseBrand: true, notes: "Power's eget mærke — ALTID høj avance. Sælgerens bedste ven." },
    { id: "bm-dream", brandName: "Dream Machines", marginTier: "high", marginPercent: 28, isHouseBrand: true, notes: "Power's gaming brand. Høj avance på gaming laptops." },
    { id: "bm-acer", brandName: "Acer", marginTier: "medium", marginPercent: 18, isHouseBrand: false, notes: "God avance på budget og mid-range modeller." },
    { id: "bm-asus", brandName: "ASUS", marginTier: "medium", marginPercent: 16, isHouseBrand: false, notes: "Stabil avance. ROG gaming har højere margin." },
    { id: "bm-lenovo", brandName: "Lenovo", marginTier: "medium", marginPercent: 15, isHouseBrand: false, notes: "ThinkPad har lav margin, IdeaPad har højere." },
    { id: "bm-hp", brandName: "HP", marginTier: "medium", marginPercent: 15, isHouseBrand: false, notes: "Pavilion og Victus har bedre margin end EliteBook." },
    { id: "bm-msi", brandName: "MSI", marginTier: "high", marginPercent: 22, isHouseBrand: false, notes: "Gaming laptops med god avance." },
    { id: "bm-samsung", brandName: "Samsung", marginTier: "low", marginPercent: 10, isHouseBrand: false, notes: "Galaxy Book har lav margin men god for image." },
    { id: "bm-apple", brandName: "Apple", marginTier: "low", marginPercent: 8, isHouseBrand: false, notes: "Meget lav margin. Sælges for trafik og tilbehør." },
    { id: "bm-razer", brandName: "Razer", marginTier: "low", marginPercent: 12, isHouseBrand: false, notes: "Premium brand med begrænset avance." },
  ]).onConflictDoNothing();
  console.log("✅ Brand margins seeded\n");

  // ============================================
  // 2. MARGIN PRICE PATTERNS
  // ============================================
  console.log("💰 Seeding margin price patterns...");
  await db.insert(marginPricePatterns).values([
    { id: "mpp-92", pattern: "ends_with_92", description: "Pris slutter på .x92 eller xx92 — internt Power prissætning med høj margin", marginBonus: 40, examples: ["3992", "5492", "6992", "8992"] },
    { id: "mpp-98", pattern: "ends_with_98", description: "Pris slutter på .x98 eller xx98 — internt Power prissætning med høj margin", marginBonus: 40, examples: ["4498", "6498", "7998", "9998"] },
    { id: "mpp-round", pattern: "round_price", description: "Runde priser (f.eks. 5000, 7000) — typisk lav-margin kampagnepriser", marginBonus: -10, examples: ["5000", "7000", "10000"] },
    { id: "mpp-99", pattern: "ends_with_99", description: "Pris slutter på 99 — klassisk retail pricing, neutral margin", marginBonus: 0, examples: ["4999", "6999", "8999"] },
  ]).onConflictDoNothing();
  console.log("✅ Margin patterns seeded\n");

  // ============================================
  // 3. LAPTOP CATEGORIES
  // ============================================
  console.log("💻 Seeding laptop categories...");
  await db.insert(laptopCategories).values([
    { id: "cat-student", name: "Student", description: "Bærbare til studiebrug — let, god batteritid, budgetvenlig", minRamGB: 8, recommendedRamGB: 16, minCpuTier: 4, recommendedCpuTier: 6, needsDedicatedGpu: false, importantFeatures: ["Lang batteritid", "Let vægt", "USB-C opladning", "WiFi 6"] },
    { id: "cat-office", name: "Kontor", description: "Til kontorarbejde — pålidelig, god til multitasking", minRamGB: 8, recommendedRamGB: 16, minCpuTier: 5, recommendedCpuTier: 7, needsDedicatedGpu: false, importantFeatures: ["God skærm", "Komfortabelt tastatur", "Støjsvag", "Pålidelig"] },
    { id: "cat-gaming", name: "Gaming", description: "Gaming laptops — dedikeret GPU, høj refresh rate", minRamGB: 16, recommendedRamGB: 32, minCpuTier: 6, recommendedCpuTier: 8, needsDedicatedGpu: true, importantFeatures: ["Dedikeret GPU", "Høj refresh rate", "God køling", "RGB tastatur"] },
    { id: "cat-creative", name: "Kreativ", description: "Til foto, video og grafisk arbejde — kraftig CPU/GPU, god skærm", minRamGB: 16, recommendedRamGB: 32, minCpuTier: 7, recommendedCpuTier: 9, needsDedicatedGpu: true, importantFeatures: ["Farveaccurat skærm", "Meget RAM", "Hurtig storage", "Thunderbolt"] },
    { id: "cat-business", name: "Business", description: "Professionelle laptops — sikkerhed, pålidelighed, docking", minRamGB: 16, recommendedRamGB: 32, minCpuTier: 6, recommendedCpuTier: 8, needsDedicatedGpu: false, importantFeatures: ["Fingeraftryk", "TPM chip", "Docking support", "MIL-STD testet"] },
    { id: "cat-budget", name: "Budget", description: "Basis laptops til enkel brug — browsing, email, dokumenter", minRamGB: 4, recommendedRamGB: 8, minCpuTier: 2, recommendedCpuTier: 4, needsDedicatedGpu: false, importantFeatures: ["God pris", "Nok til basics", "Let at opgradere"] },
  ]).onConflictDoNothing();
  console.log("✅ Laptop categories seeded\n");

  // ============================================
  // 4. AI KNOWLEDGE BASE
  // ============================================
  console.log("🧠 Seeding AI knowledge...");
  await db.insert(aiKnowledgeBase).values([
    // CPU Knowledge
    { id: "kb-cpu-1", category: "cpu_info", title: "Intel Core Ultra 200 serie", content: "Intel Core Ultra (Series 2) er nyeste generation fra Intel. Core Ultra 9 > Ultra 7 > Ultra 5. Ultra 7 er sweet spot for de fleste. Alle understøtter NPU til AI-opgaver.", tags: ["intel", "cpu", "core-ultra", "2025"], priority: 90 },
    { id: "kb-cpu-2", category: "cpu_info", title: "AMD Ryzen 8000/9000 serie", content: "AMD Ryzen 8000 og 9000 serien er AMD's nyeste. Ryzen 7 er bedste værdi. Ryzen 9 til krævende brugere. Alle har stærk integreret grafik.", tags: ["amd", "ryzen", "cpu", "2025"], priority: 90 },
    { id: "kb-cpu-3", category: "cpu_info", title: "Apple M4 chip familie", content: "Apple M4 > M4 Pro > M4 Max > M4 Ultra. M4 base er overraskende kraftig (svarende til Intel i7). M4 Pro til professionelle. M4 Max til tung kreativ brug.", tags: ["apple", "m4", "cpu", "arm"], priority: 85 },
    { id: "kb-cpu-4", category: "cpu_info", title: "CPU tiers for salg", content: "Tier D (undgå): Celeron, Pentium, Athlon, N-serie. Tier C (budget): i3, Ryzen 3, Core 3. Tier B (sweet spot): i5, Ryzen 5, Core 5. Tier A (high-end): i7, Ryzen 7, Core 7/Ultra 7. Tier S (workstation): i9, Ryzen 9, Ultra 9.", tags: ["cpu", "tiers", "salgsguide"], priority: 95 },

    // GPU Knowledge
    { id: "kb-gpu-1", category: "gpu_info", title: "NVIDIA RTX 40 vs 50 serie", content: "RTX 50-serien (2025) er nyeste. RTX 5060 er god gaming. RTX 5070 sweet spot. RTX 40-serien stadig relevant og ofte bedre værdi. RTX 4060 mest populær.", tags: ["nvidia", "rtx", "gpu", "gaming"], priority: 85 },
    { id: "kb-gpu-2", category: "gpu_info", title: "Integreret vs dedikeret GPU", content: "Integreret GPU (Intel Iris/AMD Radeon) er fint til kontor, browsing, let gaming. Dedikeret GPU (RTX/RX) nødvendig til gaming, video redigering, 3D arbejde.", tags: ["gpu", "integreret", "dedikeret"], priority: 80 },

    // Upgrade Tips
    { id: "kb-upgrade-1", category: "upgrade_tip", title: "RAM er det vigtigste upgrade", content: "8GB er minimum i 2025, men 16GB anbefales STRKT. 32GB til professionelle. RAM er ofte det der først bliver en flaskehals. Moderne laptops har RAM loddet fast — køb nok fra start!", tags: ["ram", "upgrade", "vigtigst"], priority: 100 },
    { id: "kb-upgrade-2", category: "upgrade_tip", title: "Storage 512GB minimum", content: "256GB fyldes op MEGET hurtigt med Windows + opdateringer + apps. 512GB er minimum. 1TB anbefales hvis kunden har billeder/videoer. NVMe SSD er 5-10x hurtigere end gammel SATA.", tags: ["storage", "ssd", "upgrade"], priority: 90 },
    { id: "kb-upgrade-3", category: "upgrade_tip", title: "CPU kan ikke opgraderes", content: "CPU er loddet fast på ALLE moderne laptops. Det kunden køber, beholder de. Derfor er det vigtigt at købe en god CPU fra start. Fortæl kunden dette!", tags: ["cpu", "ikke-opgraderbar", "vigtigt"], priority: 95 },

    // Use Cases
    { id: "kb-use-1", category: "use_case", title: "Til studerende", content: "Studerende behøver: 16GB RAM (multitasking), god batteritid (hele dagen), let vægt (transport), 512GB+ SSD. Gaming GPU ikke nødvendig medmindre de gamer. Budget: 5000-8000 kr.", tags: ["student", "brug", "anbefaling"], priority: 75 },
    { id: "kb-use-2", category: "use_case", title: "Til gaming", content: "Gamere behøver: Dedikeret GPU (RTX 4060+), 16-32GB RAM, hurtig CPU (i5/Ryzen 5+), 144Hz+ skærm, god køling. Budget: 8000-15000 kr. Cepter/Dream Machines har god gaming value.", tags: ["gaming", "brug", "anbefaling"], priority: 75 },
    { id: "kb-use-3", category: "use_case", title: "Til kontor/business", content: "Kontor behøver: 16GB RAM, god CPU (i5/Ryzen 5+), 512GB SSD, god skærm (IPS), komfortabelt tastatur. GPU ikke vigtig. ThinkPad/Latitude/EliteBook er gode men har lav margin. Cepter bedre for butikken.", tags: ["kontor", "business", "brug"], priority: 70 },

    // Sales Tips
    { id: "kb-sales-1", category: "sales_tip", title: "Cepter altid først", content: "Cepter er Power's eget mærke med HØJEST avance. Start altid med at vise en Cepter. Hvis kunden vil have noget andet, sammenlign med Cepter som reference. Cepter har ofte bedre specs til prisen.", tags: ["cepter", "salg", "avance"], priority: 100 },
    { id: "kb-sales-2", category: "sales_tip", title: "Pris-endelser afslører margin", content: "Priser der slutter på 92 (f.eks. 6992) eller 98 (f.eks. 8498) er Power's interne prissætning med høj margin. Disse produkter skal sælges aktivt! Runde priser (5000, 7000) er kampagnepriser med lav margin.", tags: ["pris", "margin", "salgstip"], priority: 95 },
    { id: "kb-sales-3", category: "sales_tip", title: "Undgå at sælge Apple", content: "Apple har MEGET lav margin (ca 8%). Sælg kun Apple hvis kunden insisterer. Prøv at sammenligne med bedre-value Windows alternativer. ASUS ZenBook og Samsung Galaxy Book er gode alternativer.", tags: ["apple", "lav-margin", "undgå"], priority: 85 },
    { id: "kb-sales-4", category: "sales_tip", title: "Tilbehør øger avancen", content: "Når kunden køber laptop, tilbyd ALTID: sleeve/case, mus, ekstra oplader, USB-C hub, skærmbeskytter. Tilbehør har høj margin og kunden har allerede købsbeslutningen.", tags: ["tilbehør", "mer-salg", "avance"], priority: 80 },
  ]).onConflictDoNothing();
  console.log("✅ AI knowledge seeded\n");

  // ============================================
  // 5. UPGRADE PATHS
  // ============================================
  console.log("🔄 Seeding upgrade paths...");
  await db.insert(upgradePaths).values([
    { id: "up-1", fromTier: "budget", toTier: "mid_range", fromSpecs: { cpuTier: 4, ramGB: 8, storageGB: 256 }, toSpecs: { cpuTier: 6, ramGB: 16, storageGB: 512 }, priceRangeMin: 1500, priceRangeMax: 3000, recommendation: "Fra 8GB/256GB til 16GB/512GB er den vigtigste opgradering. 2x RAM og 2x storage for 1500-3000 kr ekstra.", targetAudience: "Alle der har råd — især studerende og kontorbrugere" },
    { id: "up-2", fromTier: "mid_range", toTier: "high_end", fromSpecs: { cpuTier: 6, ramGB: 16, storageGB: 512 }, toSpecs: { cpuTier: 8, ramGB: 32, storageGB: 1024 }, priceRangeMin: 3000, priceRangeMax: 5000, recommendation: "Fra 16GB til 32GB RAM + bedre CPU. Til kreative professionelle og tunge workloads.", targetAudience: "Fotografer, video editors, udviklere" },
    { id: "up-3", fromTier: "mid_range", toTier: "gaming", fromSpecs: { cpuTier: 6, ramGB: 16, storageGB: 512, gpuTier: 1 }, toSpecs: { cpuTier: 7, ramGB: 16, storageGB: 512, gpuTier: 5 }, priceRangeMin: 2000, priceRangeMax: 4000, recommendation: "Tilføj dedikeret RTX GPU. Går fra ingen gaming til god 1080p gaming.", targetAudience: "Gamere og brugere der vil have GPU acceleration" },
  ]).onConflictDoNothing();
  console.log("✅ Upgrade paths seeded\n");

  console.log("🎉 AI Knowledge Base fully seeded!");
  console.log("\n📊 Summary:");
  console.log("  - 10 brand margin profiles");
  console.log("  - 4 margin price patterns");
  console.log("  - 6 laptop categories");
  console.log("  - 15 AI knowledge entries");
  console.log("  - 3 upgrade paths");
}

seedKnowledgeBase().catch(console.error);
