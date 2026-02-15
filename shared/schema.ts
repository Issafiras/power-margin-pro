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
