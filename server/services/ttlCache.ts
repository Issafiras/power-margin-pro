// TTL Cache with auto-expiry
// Gemmer værdier med en Time-To-Live (TTL) — gamle entries slettes automatisk

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(defaultTTLMs: number = 5 * 60 * 1000, cleanupIntervalMs: number = 60 * 1000) {
    this.defaultTTL = defaultTTLMs;
    // Auto-cleanup hvert minut
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  set(key: K, value: V, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    this.cleanup(); // Ryd op før count
    return this.cache.size;
  }

  // Ryd op i udløbne entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Stop cleanup interval (vigtigt for graceful shutdown)
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  // Stats
  stats(): { size: number; expired: number; valid: number } {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) expired++;
      else valid++;
    }
    return { size: this.cache.size, expired, valid };
  }
}

// Convenience: GPU cache med 1 times TTL
export function createGpuCache(): TTLCache<string, number> {
  return new TTLCache<string, number>(60 * 60 * 1000); // 1 time
}

// Convenience: CPU cache med 1 times TTL
export function createCpuCache(): TTLCache<string, number> {
  return new TTLCache<string, number>(60 * 60 * 1000); // 1 time
}

// Search results cache med 15 min TTL
export function createSearchCache<T>(): TTLCache<string, T> {
  return new TTLCache<string, T>(15 * 60 * 1000); // 15 min
}
