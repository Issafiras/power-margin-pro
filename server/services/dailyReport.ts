// Daily Market Report Generator
// Kører dagligt og opdaterer AI vidensbasen med markedstrends

import { db, dbConfigured } from "../db";
import { products, aiKnowledgeBase } from "../../shared/schema";
import { sql, gte, eq } from "drizzle-orm";

interface MarketReport {
  date: string;
  totalProducts: number;
  highMarginProducts: number;
  avgPriceByBrand: { brand: string; avgPrice: number; count: number }[];
  priceRanges: { range: string; count: number; highMarginPct: number }[];
  topValueProducts: { name: string; brand: string; price: number; score: number }[];
  recommendations: string[];
}

export async function generateDailyReport(): Promise<MarketReport> {
  const today = new Date().toISOString().split("T")[0];
  
  const report: MarketReport = {
    date: today,
    totalProducts: 0,
    highMarginProducts: 0,
    avgPriceByBrand: [],
    priceRanges: [],
    topValueProducts: [],
    recommendations: [],
  };

  if (!dbConfigured) return report;

  // Total counts
  const [countResult] = await db
    .select({ 
      total: sql<number>`COUNT(*)`,
      highMargin: sql<number>`SUM(CASE WHEN is_high_margin THEN 1 ELSE 0 END)`
    })
    .from(products);
  
  report.totalProducts = Number(countResult?.total) || 0;
  report.highMarginProducts = Number(countResult?.highMargin) || 0;

  // Brand breakdown
  const brandStats = await db.execute(sql`
    SELECT brand, 
           COUNT(*) as count,
           ROUND(AVG(price)) as avg_price,
           SUM(CASE WHEN is_high_margin THEN 1 ELSE 0 END) as high_margin_count
    FROM power_products
    WHERE in_stock = true
    GROUP BY brand
    ORDER BY count DESC
    LIMIT 10
  `);

  report.avgPriceByBrand = brandStats.map((r: any) => ({
    brand: r.brand,
    avgPrice: Number(r.avg_price),
    count: Number(r.count),
  }));

  // Price ranges
  const priceRanges = [
    { min: 0, max: 4000, label: "Budget (0-4000)" },
    { min: 4000, max: 7000, label: "Mellem (4000-7000)" },
    { min: 7000, max: 10000, label: "High (7000-10000)" },
    { min: 10000, max: 99999, label: "Premium (10000+)" },
  ];

  for (const range of priceRanges) {
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        highMarginPct: sql<number>`ROUND(100.0 * SUM(CASE WHEN is_high_margin THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))`
      })
      .from(products)
      .where(sql`price >= ${range.min} AND price < ${range.max}`);
    
    report.priceRanges.push({
      range: range.label,
      count: Number(result?.count) || 0,
      highMarginPct: Number(result?.highMarginPct) || 0,
    });
  }

  // Generate recommendations based on data
  const highMarginPct = report.totalProducts > 0 
    ? Math.round((report.highMarginProducts / report.totalProducts) * 100) 
    : 0;

  report.recommendations = [
    `${highMarginPct}% af produkterne er høj-margin`,
    `Fokus på Cepter og Dream Machines for bedst avance`,
    `Priser der slutter på 92/98 giver højeste margin`,
    `Budget-segmentet (0-4000 kr) har flest kunder`,
  ];

  // Store report in knowledge base
  try {
    await db.insert(aiKnowledgeBase).values({
      id: `daily-report-${today}`,
      category: "daily_report",
      title: `Markedsrapport ${today}`,
      content: JSON.stringify(report),
      tags: ["report", "daily", "market"],
      priority: 1,
    }).onConflictDoNothing();
  } catch (e) {
    console.error("Failed to store daily report:", e);
  }

  return report;
}
