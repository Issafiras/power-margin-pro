// Knowledge Base Storage Layer
// Provides access to AI knowledge, brand margins, and upgrade paths

import { db, dbConfigured } from "../db";
import { 
  brandMargins, 
  marginPricePatterns,
  aiKnowledgeBase,
  laptopCategories,
  upgradePaths,
  type DbBrandMargin,
  type DbAiKnowledge,
  type DbLaptopCategory,
  type DbUpgradePath
} from "../../shared/schema";
import { eq, like, sql, and, or } from "drizzle-orm";

class KnowledgeStorage {
  // Brand margins
  async getBrandMargin(brandName: string): Promise<DbBrandMargin | null> {
    if (!dbConfigured) return null;
    const [result] = await db
      .select()
      .from(brandMargins)
      .where(eq(brandMargins.brandName, brandName));
    return result || null;
  }

  async getAllBrandMargins(): Promise<DbBrandMargin[]> {
    if (!dbConfigured) return [];
    return db.select().from(brandMargins);
  }

  async getHighMarginBrands(): Promise<DbBrandMargin[]> {
    if (!dbConfigured) return [];
    return db
      .select()
      .from(brandMargins)
      .where(
        or(
          eq(brandMargins.marginTier, "highest"),
          eq(brandMargins.marginTier, "high")
        )
      );
  }

  // AI Knowledge
  async searchKnowledge(query: string, category?: string): Promise<DbAiKnowledge[]> {
    if (!dbConfigured) return [];
    
    const queryLower = query.toLowerCase();
    const tags = queryLower.split(" ").filter(t => t.length > 2);
    
    let results = await db
      .select()
      .from(aiKnowledgeBase)
      .where(
        or(
          like(aiKnowledgeBase.title, `%${query}%`),
          like(aiKnowledgeBase.content, `%${query}%`),
          sql`${aiKnowledgeBase.tags} && ARRAY[${sql.join(tags)}]::text[]`
        )
      )
      .orderBy(aiKnowledgeBase.priority)
      .limit(10);
    
    if (category) {
      results = results.filter(r => r.category === category);
    }
    
    return results;
  }

  async getKnowledgeByCategory(category: string): Promise<DbAiKnowledge[]> {
    if (!dbConfigured) return [];
    return db
      .select()
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.category, category))
      .orderBy(aiKnowledgeBase.priority);
  }

  async getSalesTips(): Promise<DbAiKnowledge[]> {
    return this.getKnowledgeByCategory("sales_tip");
  }

  async getUpgradeTips(): Promise<DbAiKnowledge[]> {
    return this.getKnowledgeByCategory("upgrade_tip");
  }

  // Laptop categories
  async getLaptopCategory(name: string): Promise<DbLaptopCategory | null> {
    if (!dbConfigured) return null;
    const [result] = await db
      .select()
      .from(laptopCategories)
      .where(eq(laptopCategories.name, name));
    return result || null;
  }

  async getAllCategories(): Promise<DbLaptopCategory[]> {
    if (!dbConfigured) return [];
    return db.select().from(laptopCategories);
  }

  // Upgrade paths
  async getUpgradePaths(fromTier?: string): Promise<DbUpgradePath[]> {
    if (!dbConfigured) return [];
    if (fromTier) {
      return db
        .select()
        .from(upgradePaths)
        .where(eq(upgradePaths.fromTier, fromTier));
    }
    return db.select().from(upgradePaths);
  }

  // Price pattern check
  async checkPricePattern(price: number): Promise<{ bonus: number; reason: string }> {
    const priceStr = Math.floor(price).toString();
    
    if (priceStr.endsWith("92")) {
      return { bonus: 40, reason: "Pris slutter på 92 — høj margin" };
    }
    if (priceStr.endsWith("98")) {
      return { bonus: 40, reason: "Pris slutter på 98 — høj margin" };
    }
    if (priceStr.endsWith("99")) {
      return { bonus: 0, reason: "Standard retail pricing" };
    }
    if (price.endsWith(0) && price % 1000 === 0) {
      return { bonus: -10, reason: "Rund pris — kampagne/lav margin" };
    }
    
    return { bonus: 0, reason: "" };
  }

  // Get full context for AI prompt
  async getAIContext(productName: string, brand: string, price: number): Promise<string> {
    const parts: string[] = [];

    // Brand margin info
    const margin = await this.getBrandMargin(brand);
    if (margin) {
      parts.push(`BRAND MARGIN: ${brand} har ${margin.marginTier} margin (${margin.marginPercent}%). ${margin.notes || ""}`);
    }

    // Price pattern
    const pricePattern = await this.checkPricePattern(price);
    if (pricePattern.bonus !== 0) {
      parts.push(`PRIS MØNSTER: ${pricePattern.reason}`);
    }

    // Sales tips
    const salesTips = await this.getSalesTips();
    if (salesTips.length > 0) {
      parts.push("SALGSTIPS:");
      salesTips.slice(0, 3).forEach(tip => {
        parts.push(`- ${tip.title}: ${tip.content}`);
      });
    }

    // High margin brands
    const highMargin = await this.getHighMarginBrands();
    if (highMargin.length > 0) {
      parts.push(`HØJ MARGIN BRANDS: ${highMargin.map(b => b.brandName).join(", ")}`);
    }

    return parts.join("\n");
  }
}

export const knowledgeStorage = new KnowledgeStorage();
