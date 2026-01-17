import { z } from "zod";

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
  ram: z.string().optional(),
  ramGB: z.number().optional(),
  storage: z.string().optional(),
  storageGB: z.number().optional(),
  screenSize: z.number().optional(),
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

export const users = {} as any;
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
