import { type User, type InsertUser, products, type InsertProduct, type DbProduct, type ProductSpecs } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertProducts(items: InsertProduct[]): Promise<void>;
  searchProducts(query: string): Promise<DbProduct[]>;
  getAllProducts(): Promise<DbProduct[]>;
  getProductCount(): Promise<number>;
  getProductById(id: string): Promise<DbProduct | undefined>;
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

  async getProductById(_id: string): Promise<DbProduct | undefined> {
    throw new Error("MemStorage does not support products. Use DatabaseStorage.");
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

    for (const item of items) {
      const specs = (item.specs as ProductSpecs | undefined) ?? null;
      await db
        .insert(products)
        .values({
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
          specs,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
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
            specs,
            updatedAt: new Date(),
          },
        });
    }
  }

  async searchProducts(query: string): Promise<DbProduct[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchPattern),
          ilike(products.brand, searchPattern),
          ilike(products.sku, searchPattern)
        )
      );
  }

  async getAllProducts(): Promise<DbProduct[]> {
    return await db.select().from(products);
  }

  async getProductCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(products);
    return Number(result[0]?.count ?? 0);
  }

  async getProductById(id: string): Promise<DbProduct | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }
}

export const storage = new DatabaseStorage();
