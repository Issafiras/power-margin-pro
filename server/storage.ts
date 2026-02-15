import { type User, type InsertUser, products, type InsertProduct, type DbProduct, type ProductSpecs, gpuBenchmarks, type InsertGpuBenchmark, type DbGpuBenchmark, cpuBenchmarks, type InsertCpuBenchmark, type DbCpuBenchmark } from "../shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { and, eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertProducts(items: InsertProduct[]): Promise<void>;
  searchProducts(query: string): Promise<DbProduct[]>;
  getAllProducts(): Promise<DbProduct[]>;
  getProductCount(): Promise<number>;
  getHighMarginCount(): Promise<number>;
  getProductById(id: string): Promise<DbProduct | undefined>;
  upsertGpuBenchmarks(items: InsertGpuBenchmark[]): Promise<void>;
  getGpuBenchmark(gpuName: string): Promise<DbGpuBenchmark | undefined>;
  getAllGpuBenchmarks(): Promise<DbGpuBenchmark[]>;
  upsertCpuBenchmarks(items: any[]): Promise<void>; // Using any since we haven't defined the type yet
  getCpuBenchmark(cpuName: string): Promise<any | undefined>; // Using any since we haven't defined the type yet
  getAllCpuBenchmarks(): Promise<any[]>; // Using any since we haven't defined the type yet
  clearProducts(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async upsertProducts(_items: InsertProduct[]): Promise<void> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async searchProducts(_query: string): Promise<DbProduct[]> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async getAllProducts(): Promise<DbProduct[]> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async getProductCount(): Promise<number> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async getHighMarginCount(): Promise<number> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async getProductById(_id: string): Promise<DbProduct | undefined> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }

  async upsertGpuBenchmarks(_items: InsertGpuBenchmark[]): Promise<void> {
    throw new Error("MemStorage does not support GPU benchmarks. Use DatabaseStorage.");
  }

  async getGpuBenchmark(_gpuName: string): Promise<DbGpuBenchmark | undefined> {
    throw new Error("MemStorage does not support GPU benchmarks. Use DatabaseStorage.");
  }

  async getAllGpuBenchmarks(): Promise<DbGpuBenchmark[]> {
    throw new Error("MemStorage does not support GPU benchmarks. Use DatabaseStorage.");
  }

  async upsertCpuBenchmarks(_items: InsertCpuBenchmark[]): Promise<void> {
    throw new Error("MemStorage does not support CPU benchmarks. Use DatabaseStorage.");
  }

  async getCpuBenchmark(_cpuName: string): Promise<DbCpuBenchmark | undefined> {
    throw new Error("MemStorage does not support CPU benchmarks. Use DatabaseStorage.");
  }

  async getAllCpuBenchmarks(): Promise<DbCpuBenchmark[]> {
    throw new Error("MemStorage does not support CPU benchmarks. Use DatabaseStorage.");
  }

  async clearProducts(): Promise<void> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
  }
}
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    return { ...insertUser, id };
  }

  async upsertProducts(items: InsertProduct[]): Promise<void> {
    if (items.length === 0) return;

    // Use bulk insert for better performance
    await db
      .insert(products)
      .values(items.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        originalPrice: item.originalPrice ?? null,
        imageUrl: item.imageUrl ?? null,
        productUrl: item.productUrl,
        sku: item.sku ?? null,
        inStock: item.inStock ?? true,
        isHighMargin: item.isHighMargin ?? false,
        marginReason: item.marginReason ?? null,
        specs: (item.specs as ProductSpecs | undefined) ?? null,
        updatedAt: new Date(),
      })))
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: sql`excluded.name`,
          brand: sql`excluded.brand`,
          price: sql`excluded.price`,
          originalPrice: sql`excluded.original_price`,
          imageUrl: sql`excluded.image_url`,
          productUrl: sql`excluded.product_url`,
          sku: sql`excluded.sku`,
          inStock: sql`excluded.in_stock`,
          isHighMargin: sql`excluded.is_high_margin`,
          marginReason: sql`excluded.margin_reason`,
          specs: sql`excluded.specs`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async searchProducts(query: string): Promise<DbProduct[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.inStock, true),
          or(
            ilike(products.name, searchPattern),
            ilike(products.brand, searchPattern),
            ilike(products.sku, searchPattern)
          )
        )
      );
  }

  async getAllProducts(): Promise<DbProduct[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.inStock, true));
  }

  async getProductCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(products);
    return Number(result[0]?.count ?? 0);
  }

  async getHighMarginCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isHighMargin, true));
    return Number(result[0]?.count ?? 0);
  }

  async getProductById(id: string): Promise<DbProduct | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async upsertGpuBenchmarks(items: InsertGpuBenchmark[]): Promise<void> {
    if (items.length === 0) return;

    await db
      .insert(gpuBenchmarks)
      .values(items)
      .onConflictDoUpdate({
        target: gpuBenchmarks.gpuName,
        set: {
          score: sql`excluded.score`,
          url: sql`excluded.url`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async getGpuBenchmark(gpuName: string): Promise<DbGpuBenchmark | undefined> {
    const result = await db
      .select()
      .from(gpuBenchmarks)
      .where(eq(gpuBenchmarks.gpuName, gpuName));
    return result[0];
  }

  async getAllGpuBenchmarks(): Promise<DbGpuBenchmark[]> {
    return await db.select().from(gpuBenchmarks);
  }

  async clearProducts(): Promise<void> {
    await db.delete(products);
  }

  async upsertCpuBenchmarks(items: InsertCpuBenchmark[]): Promise<void> {
    if (items.length === 0) return;

    await db
      .insert(cpuBenchmarks)
      .values(items)
      .onConflictDoUpdate({
        target: cpuBenchmarks.cpuName,
        set: {
          score: sql`excluded.score`,
          rank: sql`excluded.rank`,
          samples: sql`excluded.samples`,
          url: sql`excluded.url`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async getCpuBenchmark(cpuName: string): Promise<DbCpuBenchmark | undefined> {
    const result = await db
      .select()
      .from(cpuBenchmarks)
      .where(eq(cpuBenchmarks.cpuName, cpuName));
    return result[0];
  }

  async getAllCpuBenchmarks(): Promise<DbCpuBenchmark[]> {
    return await db.select().from(cpuBenchmarks);
  }
}

export const storage = new DatabaseStorage();
