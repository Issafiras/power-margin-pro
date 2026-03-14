// Real-time Product Sync Service
// Syncer produkter fra Power.dk i baggrunden og opdaterer vidensbasen

import { db, dbConfigured } from "../db";
import { products, aiKnowledgeBase } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

interface SyncStats {
  totalSynced: number;
  newProducts: number;
  updatedProducts: number;
  highMarginCount: number;
  errors: number;
  duration: number;
}

export async function syncFromPowerApi(
  category: number = 1341, // Laptops
  maxPages: number = 20
): Promise<SyncStats> {
  const startTime = Date.now();
  const stats: SyncStats = {
    totalSynced: 0,
    newProducts: 0,
    updatedProducts: 0,
    highMarginCount: 0,
    errors: 0,
    duration: 0,
  };

  if (!dbConfigured) {
    console.warn("Database not configured, skipping sync");
    return stats;
  }

  const POWER_API = "https://www.power.dk/api/v2/productlists";
  const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  for (let page = 0; page < maxPages; page++) {
    const from = page * 40;
    const url = `${POWER_API}?cat=${category}&size=40&from=${from}`;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
      });

      if (!response.ok) break;

      const data = await response.json();
      const rawProducts = data?.products || [];

      if (rawProducts.length === 0) break;

      for (const item of rawProducts) {
        try {
          const id = item.productId?.toString();
          if (!id) continue;

          // Check if exists
          const [existing] = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

          if (existing) {
            stats.updatedProducts++;
          } else {
            stats.newProducts++;
          }
          stats.totalSynced++;
        } catch (e) {
          stats.errors++;
        }
      }

      // Stop if last page
      if (rawProducts.length < 40) break;
    } catch (e) {
      stats.errors++;
      break;
    }
  }

  stats.duration = Date.now() - startTime;
  
  // Update sync log in knowledge base
  try {
    await db.insert(aiKnowledgeBase).values({
      id: `sync-log-${Date.now()}`,
      category: "system_log",
      title: "Product Sync Completed",
      content: `Synced ${stats.totalSynced} products (${stats.newProducts} new, ${stats.updatedProducts} updated) in ${stats.duration}ms`,
      tags: ["sync", "system"],
      priority: 0,
    }).onConflictDoNothing();
  } catch (e) {
    // Ignore logging errors
  }

  return stats;
}

// Analyze product patterns and update knowledge
export async function analyzeProductPatterns(): Promise<void> {
  if (!dbConfigured) return;

  try {
    // Get brand distribution
    const brandStats = await db.execute(sql`
      SELECT brand, COUNT(*) as count, AVG(price) as avg_price,
             SUM(CASE WHEN is_high_margin THEN 1 ELSE 0 END) as high_margin_count
      FROM power_products
      GROUP BY brand
      ORDER BY count DESC
    `);

    // Log analysis
    const analysis = brandStats.map((r: any) => 
      `${r.brand}: ${r.count} produkter, gns ${Math.round(r.avg_price)} kr, ${r.high_margin_count} høj-margin`
    ).join("; ");

    await db.insert(aiKnowledgeBase).values({
      id: `analysis-${Date.now()}`,
      category: "market_analysis",
      title: "Product Pattern Analysis",
      content: analysis,
      tags: ["analysis", "brands", "patterns"],
      priority: 1,
    }).onConflictDoNothing();

    console.log("📊 Product patterns analyzed");
  } catch (e) {
    console.error("Pattern analysis failed:", e);
  }
}
