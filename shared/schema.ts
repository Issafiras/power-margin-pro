import { z } from "zod";
import { pgTable, text, boolean, real, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ... (imports remain the same, just showing the change in pgTable)

// Drizzle schema for PostgreSQL products table
export const products = pgTable("power_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  imageUrl: text("image_url"),
  productUrl: text("product_url").notNull(),
  sku: text("sku"),
  inStock: boolean("in_stock").default(true),
  isHighMargin: boolean("is_high_margin").default(false),
  marginReason: text("margin_reason"),
  specs: jsonb("specs").$type<ProductSpecs>(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    brandIdx: index("brand_idx").on(table.brand),
    priceIdx: index("price_idx").on(table.price),
    highMarginIdx: index("is_high_margin_idx").on(table.isHighMargin),
  };
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  imageUrl: z.string().optional(),
  productUrl: z.string(),
  sku: z.string().optional(),
  inStock: z.boolean().default(true),
});

export type Product = z.infer<typeof productSchema>;

export const productSpecsSchema = z.object({
  cpu: z.string().optional(),
  cpuTier: z.number().optional(),
  gpu: z.string().optional(),
  gpuTier: z.number().optional(),
  gpuVram: z.number().optional(),
  ram: z.string().optional(),
  ramGB: z.number().optional(),
  storage: z.string().optional(),
  storageGB: z.number().optional(),
  screenSize: z.string().optional(),
  screenType: z.string().optional(),
  screenResolution: z.string().optional(),
  features: z.array(z.string()).optional(),
  os: z.string().optional(),
});

export type ProductSpecs = z.infer<typeof productSpecsSchema>;

export const productWithMarginSchema = productSchema.extend({
  isHighMargin: z.boolean(),
  marginReason: z.string().optional(),
  specs: productSpecsSchema.optional(),
  isTopPick: z.boolean().default(false),
  priceDifference: z.number().optional(),
  upgradeScore: z.number().optional(),
  upgradeReason: z.string().optional(),
});

export type ProductWithMargin = z.infer<typeof productWithMarginSchema>;

export const searchResponseSchema = z.object({
  products: z.array(productWithMarginSchema),
  totalCount: z.number(),
  searchQuery: z.string(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

// Drizzle schema for PostgreSQL products table


export const insertProductSchema = createInsertSchema(products).omit({ updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type DbProduct = typeof products.$inferSelect;

// User types - used by storage.ts for in-memory user management
// TODO: Implement proper database schema when authentication is needed
export type InsertUser = {
  username: string;
  password: string;
};
export type User = InsertUser & { id: string };



// GPU Benchmarks table
export const gpuBenchmarks = pgTable("gpu_benchmarks", {
  id: text("id").primaryKey(), // We can use the GPU name as ID or a slug
  gpuName: text("gpu_name").notNull().unique(),
  score: real("score").notNull(), // 3DMark Time Spy Graphics Score
  url: text("url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGpuBenchmarkSchema = createInsertSchema(gpuBenchmarks).omit({ updatedAt: true });
export type InsertGpuBenchmark = z.infer<typeof insertGpuBenchmarkSchema>;
export type DbGpuBenchmark = typeof gpuBenchmarks.$inferSelect;

// CPU Benchmarks table
export const cpuBenchmarks = pgTable("cpu_benchmarks", {
  id: text("id").primaryKey(), // CPU name normalized or slug
  cpuName: text("cpu_name").notNull().unique(),
  score: real("score").notNull(), // PassMark / CPU Mark
  rank: real("rank"),
  samples: real("samples"),
  url: text("url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCpuBenchmarkSchema = createInsertSchema(cpuBenchmarks).omit({ updatedAt: true });
export type InsertCpuBenchmark = z.infer<typeof insertCpuBenchmarkSchema>;
export type DbCpuBenchmark = typeof cpuBenchmarks.$inferSelect;

// ============================================
// AI KNOWLEDGE BASE TABLES
// ============================================

// Brand margin information
export const brandMargins = pgTable("brand_margins", {
  id: text("id").primaryKey(),
  brandName: text("brand_name").notNull().unique(),
  marginTier: text("margin_tier").notNull(), // "highest", "high", "medium", "low"
  marginPercent: real("margin_percent"), // Estimated margin %
  isHouseBrand: boolean("is_house_brand").default(false), // Power's own brands
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBrandMarginSchema = createInsertSchema(brandMargins).omit({ updatedAt: true });
export type InsertBrandMargin = z.infer<typeof insertBrandMarginSchema>;
export type DbBrandMargin = typeof brandMargins.$inferSelect;

// Price patterns for margin detection
export const marginPricePatterns = pgTable("margin_price_patterns", {
  id: text("id").primaryKey(),
  pattern: text("pattern").notNull(), // e.g., "ends_with_92", "ends_with_98"
  description: text("description").notNull(),
  marginBonus: real("margin_bonus").notNull(), // Score bonus
  examples: text("examples").array(), // Example prices
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarginPatternSchema = createInsertSchema(marginPricePatterns).omit({ updatedAt: true });
export type InsertMarginPattern = z.infer<typeof insertMarginPatternSchema>;
export type DbMarginPattern = typeof marginPricePatterns.$inferSelect;

// AI knowledge entries - what the AI knows about laptops
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // "laptop_model", "cpu_info", "gpu_info", "use_case", "upgrade_tip"
  title: text("title").notNull(),
  content: text("content").notNull(), // The actual knowledge
  tags: text("tags").array(), // For searchability
  priority: real("priority").default(50), // Higher = more important
  embedding: jsonb("embedding"), // For future vector search
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    categoryIdx: index("knowledge_category_idx").on(table.category),
    tagsIdx: index("knowledge_tags_idx").on(table.tags),
  };
});

export const insertAiKnowledgeSchema = createInsertSchema(aiKnowledgeBase).omit({ updatedAt: true });
export type InsertAiKnowledge = z.infer<typeof insertAiKnowledgeSchema>;
export type DbAiKnowledge = typeof aiKnowledgeBase.$inferSelect;

// Laptop categories and use cases
export const laptopCategories = pgTable("laptop_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // "Gaming", "Business", "Student", "Creative"
  description: text("description").notNull(),
  minRamGB: real("min_ram_gb"),
  recommendedRamGB: real("recommended_ram_gb"),
  minCpuTier: real("min_cpu_tier"),
  recommendedCpuTier: real("recommended_cpu_tier"),
  needsDedicatedGpu: boolean("needs_dedicated_gpu").default(false),
  importantFeatures: text("important_features").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLaptopCategorySchema = createInsertSchema(laptopCategories).omit({ updatedAt: true });
export type InsertLaptopCategory = z.infer<typeof insertLaptopCategorySchema>;
export type DbLaptopCategory = typeof laptopCategories.$inferSelect;

// Common upgrade paths
export const upgradePaths = pgTable("upgrade_paths", {
  id: text("id").primaryKey(),
  fromTier: text("from_tier").notNull(), // "budget", "mid_range", "high_end"
  toTier: text("to_tier").notNull(),
  fromSpecs: jsonb("from_specs").$type<ProductSpecs>(),
  toSpecs: jsonb("to_specs").$type<ProductSpecs>(),
  priceRangeMin: real("price_range_min"),
  priceRangeMax: real("price_range_max"),
  recommendation: text("recommendation").notNull(), // Why this upgrade makes sense
  targetAudience: text("target_audience"), // Who benefits from this upgrade
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUpgradePathSchema = createInsertSchema(upgradePaths).omit({ updatedAt: true });
export type InsertUpgradePath = z.infer<typeof insertUpgradePathSchema>;
export type DbUpgradePath = typeof upgradePaths.$inferSelect;
