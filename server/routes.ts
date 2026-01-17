import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import type { InsertProduct, ProductWithMargin } from "@shared/schema";

const POWER_API_BASE = "https://www.power.dk/api/v2/productlists";
const LAPTOP_CATEGORY_ID = 1341;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

interface ExtractedSpecs {
  cpu?: string;
  cpuTier?: number;
  gpu?: string;
  gpuTier?: number;
  ram?: string;
  ramGB?: number;
  storage?: string;
  storageGB?: number;
  screenSize?: number;
}

// CPU Tier mapping based on buying guide (S=10, A=8, B=6, C=4, D=1)
// Tier S: M3/M4 Max, i9-14900HX, Core Ultra 9, Ryzen 9 7945HX
// Tier A: M3/M4 Pro, M4 base, Core Ultra 7, i7-13700H, Ryzen 7 8845HS
// Tier B: M2/M3 base, Core Ultra 5, i5-13500H, Ryzen 5 7640HS (Sweet spot)
// Tier C: i3, Ryzen 3, Core 3 (Budget)
// Tier D: Celeron, Pentium, Athlon, A-series, N-series (Avoid!)
function getCpuTier(cpuString: string): number {
  const cpu = cpuString.toLowerCase();
  
  // Tier D (Avoid!) - Score 1
  // Includes: Celeron, Pentium, Athlon, AMD A-series, Intel N-series
  if (/celeron|pentium|athlon|amd\s+a\d|intel\s+n\d{4}/i.test(cpu)) return 1;
  
  // Tier S (Workstation) - Score 10
  // Apple M3/M4 Max/Ultra
  if (/apple\s+m[34]\s*(max|ultra)/i.test(cpu)) return 10;
  // Intel Core Ultra 9 (explicitly Ultra 9, not just "Core 9")
  if (/core\s+ultra\s+9/i.test(cpu)) return 10;
  // Intel i9 HX series (14th/15th gen high-performance)
  if (/i9[- ]?(14|15)\d{3}hx/i.test(cpu)) return 10;
  // AMD Ryzen 9 HX series (7945HX, 8945HX etc.)
  if (/ryzen\s+9.*\d{4}hx/i.test(cpu)) return 10;
  // Snapdragon X Elite
  if (/snapdragon\s+x\s*elite/i.test(cpu)) return 10;
  // Ryzen AI 300-series high-end
  if (/ryzen\s+ai\s+9\s+3\d{2}/i.test(cpu)) return 10;
  
  // Tier A (High-End) - Score 8
  // Apple M3/M4 Pro
  if (/apple\s+m[34]\s*pro/i.test(cpu)) return 8;
  // Apple M4 base (very strong)
  if (/apple\s+m4(?!\s*max|\s*pro|\s*ultra)/i.test(cpu)) return 8;
  // Intel Core Ultra 7 (Series 2)
  if (/core\s+ultra\s+7/i.test(cpu)) return 8;
  // Intel i7 H-series (13th/14th gen)
  if (/i7[- ]?(13|14)\d{3}h/i.test(cpu)) return 8;
  // AMD Ryzen 7 HS/H series
  if (/ryzen\s+7.*\d{4}h[sx]?/i.test(cpu)) return 8;
  // AMD Ryzen AI 9
  if (/ryzen\s+ai\s+9/i.test(cpu)) return 8;
  // Snapdragon X Plus
  if (/snapdragon\s+x\s*plus/i.test(cpu)) return 7;
  
  // Tier B (Sweet Spot) - Score 6
  // Apple M2/M3 base (MacBook Air)
  if (/apple\s+m[23](?!\s*max|\s*pro|\s*ultra)/i.test(cpu)) return 6;
  // Intel Core Ultra 5
  if (/core\s+ultra\s+5/i.test(cpu)) return 6;
  // Intel i5 H/P-series (12th/13th/14th gen)
  if (/i5[- ]?(12|13|14)\d{3}[hp]/i.test(cpu)) return 6;
  // AMD Ryzen 5 HS series (7640HS, 8645HS)
  if (/ryzen\s+5.*\d{4}h[sx]?/i.test(cpu)) return 6;
  // AMD Ryzen 7 U-series (efficient)
  if (/ryzen\s+7.*u/i.test(cpu)) return 6;
  // Apple M1 (still good)
  if (/apple\s+m1(?!\s*max|\s*pro|\s*ultra)/i.test(cpu)) return 6;
  
  // Tier C (Budget) - Score 4
  // Intel i3 (12th/13th/14th gen)
  if (/i3[- ]?(12|13|14)\d{3}/i.test(cpu)) return 4;
  // Intel Core 3
  if (/core\s+3/i.test(cpu)) return 4;
  // AMD Ryzen 3
  if (/ryzen\s+3/i.test(cpu)) return 4;
  // AMD Ryzen 5 U-series (older/slower)
  if (/ryzen\s+5.*u/i.test(cpu)) return 4;
  // Intel i5 U-series (ultrabook, slower)
  if (/i5.*u/i.test(cpu)) return 4;
  
  // Fallback for older/unknown CPUs (generic patterns)
  if (/i9/i.test(cpu)) return 8;
  if (/i7/i.test(cpu)) return 6;
  if (/i5/i.test(cpu)) return 5;
  if (/i3/i.test(cpu)) return 4;
  if (/ryzen\s+9/i.test(cpu)) return 8;
  if (/ryzen\s+7/i.test(cpu)) return 6;
  if (/ryzen\s+5/i.test(cpu)) return 5;
  
  return 0; // Unknown
}

function getGpuTier(gpuString: string): number {
  const gpu = gpuString.toLowerCase();
  if (/rtx\s*40\d{2}/i.test(gpu)) return 7;
  if (/rtx\s*30\d{2}/i.test(gpu)) return 5;
  if (/gtx/i.test(gpu)) return 3;
  if (/intel\s+(?:iris|uhd|arc)/i.test(gpu) || /radeon\s+graphics/i.test(gpu)) return 1;
  return 0;
}

function extractSpecs(productName: string): ExtractedSpecs {
  const specs: ExtractedSpecs = {};
  
  const cpuPatterns = [
    /Intel\s+Core\s+(?:Ultra\s+)?[i579][\s-]?(?:\d{4,5}[A-Z]*)/i,
    /Intel\s+Core\s+(?:Ultra\s+)?[i579]/i,
    /AMD\s+Ryzen\s+[3579]\s+\d{4}[A-Z]*/i,
    /AMD\s+Ryzen\s+[3579]/i,
    /Apple\s+M[1234]\s*(?:Pro|Max|Ultra)?/i,
    /Snapdragon\s+X\s*(?:Elite|Plus)?/i,
    /Intel\s+(?:Celeron|Pentium|N\d{4})/i,
    /AMD\s+Athlon/i,
  ];
  
  for (const pattern of cpuPatterns) {
    const match = productName.match(pattern);
    if (match) {
      specs.cpu = match[0].trim();
      specs.cpuTier = getCpuTier(specs.cpu);
      break;
    }
  }
  
  const gpuPatterns = [
    /RTX\s*\d{4}(?:\s*Ti)?(?:\s*Super)?/i,
    /GTX\s*\d{4}(?:\s*Ti)?/i,
    /GeForce\s+(?:RTX|GTX)\s*\d{4}(?:\s*Ti)?(?:\s*Super)?/i,
    /Radeon\s+RX\s*\d{4}[A-Z]*/i,
    /Intel\s+(?:Iris\s+Xe|Arc\s+A\d+|UHD\s+Graphics)/i,
    /AMD\s+Radeon\s+Graphics/i,
  ];
  
  for (const pattern of gpuPatterns) {
    const match = productName.match(pattern);
    if (match) {
      specs.gpu = match[0].trim();
      specs.gpuTier = getGpuTier(specs.gpu);
      break;
    }
  }
  
  const parenthesisMatch = productName.match(/\((?:i[3579]|R[3579]|M[1234])?[\/\s]*(\d{1,2})[\/\s]*(\d{2,4})\s*(?:GB|TB)/i);
  if (parenthesisMatch) {
    const ramValue = parseInt(parenthesisMatch[1], 10);
    if (ramValue >= 4 && ramValue <= 64) {
      specs.ram = `${ramValue} GB`;
      specs.ramGB = ramValue;
    }
    const storageValue = parseInt(parenthesisMatch[2], 10);
    if (storageValue >= 64) {
      specs.storage = `${storageValue} GB`;
      specs.storageGB = storageValue;
    }
  }
  
  if (!specs.ramGB) {
    const ramPatterns = [
      /(\d{1,2})\s*GB\s*(?:DDR[45]|RAM|LPDDR[45x])/i,
      /[\/\s](\d{1,2})\s*GB[\/\s]/i,
    ];
    
    for (const pattern of ramPatterns) {
      const match = productName.match(pattern);
      if (match) {
        const ramValue = parseInt(match[1], 10);
        if (ramValue >= 4 && ramValue <= 64) {
          specs.ram = `${ramValue} GB`;
          specs.ramGB = ramValue;
          break;
        }
      }
    }
  }
  
  if (!specs.storageGB) {
    const storagePatterns = [
      /(\d+(?:\.\d+)?)\s*TB\s*(?:SSD|NVMe|HDD)?/i,
      /(\d{3,4})\s*GB\s*(?:SSD|NVMe|HDD)?/i,
    ];
    
    for (const pattern of storagePatterns) {
      const match = productName.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (/TB/i.test(match[0])) {
          specs.storage = `${value} TB`;
          specs.storageGB = value * 1024;
        } else if (value >= 64) {
          specs.storage = `${value} GB`;
          specs.storageGB = value;
        }
        break;
      }
    }
  }
  
  const screenMatch = productName.match(/(\d{1,2}(?:\.\d)?)["\u2033-]?\s*(?:inch|tommer|"|'')?/i);
  if (screenMatch) {
    const size = parseFloat(screenMatch[1]);
    if (size >= 10 && size <= 18) {
      specs.screenSize = size;
    }
  }
  
  return specs;
}

// Scoring based on buying guide priority: RAM > CPU > Storage > GPU
// RAM: Most important - no downgrade allowed, 16GB is standard, 32GB is bonus
// CPU: Tier system (S/A/B/C/D), penalize D-tier heavily
// Storage: 512GB minimum for good score
// GPU: Only matters for gaming (RTX series)
function calculateUpgradeScore(
  alternative: ExtractedSpecs,
  reference: ExtractedSpecs,
  isHighMargin: boolean,
  alternativePrice: number,
  referencePrice: number
): { score: number; isValidUpgrade: boolean; upgradeReason?: string } {
  const altRam = alternative.ramGB || 0;
  const refRam = reference.ramGB || 0;
  const altCpu = alternative.cpuTier || 0;
  const refCpu = reference.cpuTier || 0;
  const altStorage = alternative.storageGB || 0;
  const refStorage = reference.storageGB || 0;
  const altGpu = alternative.gpuTier || 0;
  const refGpu = reference.gpuTier || 0;
  
  const ramDiff = altRam - refRam;
  const cpuDiff = altCpu - refCpu;
  const storageDiff = altStorage - refStorage;
  const gpuDiff = altGpu - refGpu;
  
  let score = 0;
  const reasons: string[] = [];
  const penalties: string[] = [];
  
  // === RAM SCORING (Most Important) ===
  // RAM bands: <8=bad, 8=minimum, 16=standard, 32=nice-to-have
  if (altRam >= 32) {
    score += 30; // Premium RAM
    if (refRam < 32) reasons.push("32GB RAM");
  } else if (altRam >= 16) {
    score += 20; // Standard RAM
    if (refRam < 16) reasons.push("16GB RAM (standard)");
  } else if (altRam >= 8) {
    score += 5; // Minimum acceptable
  } else if (altRam > 0) {
    score -= 20; // Below minimum
    penalties.push("Under 8GB RAM");
  }
  
  // RAM upgrade bonus
  if (ramDiff > 0) {
    score += ramDiff * 3; // Heavy weight for RAM upgrades
    if (!reasons.some(r => r.includes("RAM"))) {
      reasons.push(`+${ramDiff}GB RAM`);
    }
  }
  
  // === CPU SCORING (Second Priority) ===
  // Bonus for good CPU tiers
  if (altCpu >= 8) { // Tier A or S
    score += 15;
    if (refCpu < 8) reasons.push("Høj-ydeevne CPU (Tier A/S)");
  } else if (altCpu >= 6) { // Tier B (sweet spot)
    score += 10;
    if (refCpu < 6) reasons.push("God CPU (Sweet Spot)");
  } else if (altCpu <= 1 && altCpu > 0) { // Tier D (avoid!)
    score -= 40; // Heavy penalty for D-tier CPUs
    penalties.push("Undgå: Celeron/Pentium CPU");
  }
  
  // CPU upgrade bonus
  if (cpuDiff > 0) {
    score += cpuDiff * 8;
    if (!reasons.some(r => r.includes("CPU"))) {
      reasons.push("Bedre CPU");
    }
  }
  
  // === STORAGE SCORING ===
  // 512GB is minimum recommended
  if (altStorage >= 1024) { // 1TB+
    score += 10;
    if (refStorage < 1024) reasons.push("1TB+ lagerplads");
  } else if (altStorage >= 512) {
    score += 5;
    if (refStorage < 512) reasons.push("512GB+ SSD");
  } else if (altStorage > 0 && altStorage < 256) {
    score -= 5;
    penalties.push("Lille lagerplads");
  }
  
  // Storage upgrade bonus
  if (storageDiff > 0) {
    score += storageDiff * 0.02;
  }
  
  // === GPU SCORING (Only for gaming/video) ===
  // Only add GPU score if reference has dedicated GPU (gaming context)
  if (refGpu >= 3 || altGpu >= 5) { // Gaming context
    if (gpuDiff > 0) {
      score += gpuDiff * 3;
      reasons.push("Bedre grafikkort");
    }
  }
  
  // === HIGH MARGIN BONUS ===
  if (isHighMargin) {
    score += 25;
    reasons.push("Høj avance");
  }
  
  // === PRICE PROXIMITY BONUS ===
  const priceRatio = alternativePrice / referencePrice;
  if (priceRatio >= 0.9 && priceRatio <= 1.2) {
    score += 10; // Similar price range
  } else if (priceRatio > 1.2 && priceRatio <= 1.4) {
    score += 5; // Slightly higher but reasonable
  }
  
  // === VALIDITY CHECKS ===
  // Rule 1: No RAM downgrade allowed (RAM is most important)
  const hasRamDowngrade = refRam > 0 && altRam > 0 && ramDiff < 0;
  
  // Rule 2: No D-tier CPU if reference is C+ tier
  const hasDTierCpu = altCpu === 1;
  const refIsDecentCpu = refCpu >= 4;
  const hasBadCpuDowngrade = hasDTierCpu && refIsDecentCpu;
  
  // Rule 3: Major CPU downgrade (more than 2 tiers)
  const hasMajorCpuDowngrade = refCpu > 0 && altCpu > 0 && cpuDiff < -2;
  
  // Rule 4: Price within reasonable range
  const isWithinPriceRange = alternativePrice <= referencePrice * 1.5;
  
  // Valid upgrade requires: no RAM downgrade, no bad CPU, within price
  const hasAnyUpgrade = ramDiff > 0 || cpuDiff > 0 || storageDiff > 0 || gpuDiff > 0;
  const isValidUpgrade = 
    (hasAnyUpgrade || isHighMargin) && 
    !hasRamDowngrade && 
    !hasBadCpuDowngrade && 
    !hasMajorCpuDowngrade && 
    isWithinPriceRange;
  
  // Combine reasons and penalties
  const allReasons = [...reasons];
  if (penalties.length > 0) {
    allReasons.push(`Advarsel: ${penalties.join(", ")}`);
  }
  
  return { 
    score, 
    isValidUpgrade, 
    upgradeReason: allReasons.length > 0 ? allReasons.join(", ") : undefined 
  };
}

function isHighMarginProduct(brand: string, price: number): { isHighMargin: boolean; reason?: string } {
  if (brand.toLowerCase() === "cepter") {
    return { isHighMargin: true, reason: "Cepter brand" };
  }
  
  const priceStr = Math.floor(price).toString();
  if (priceStr.endsWith("98")) {
    return { isHighMargin: true, reason: "Pris ender på 98" };
  }
  
  return { isHighMargin: false };
}

function findTopPick(products: any[]): number {
  let bestIndex = -1;
  let bestScore = -Infinity;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.isHighMargin) continue;
    
    const score = product.upgradeScore || 0;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  
  return bestIndex;
}

function getImageUrl(productImage: any): string | undefined {
  if (!productImage) return undefined;
  
  const basePath = productImage.basePath || "";
  const variants = productImage.variants || [];
  
  if (variants.length > 0 && variants[0].filename) {
    // Add slash between basePath and filename
    const separator = basePath.endsWith("/") ? "" : "/";
    const imagePath = `${basePath}${separator}${variants[0].filename}`;
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    // Images are hosted on Power's CDN, not main domain
    return `https://media.power-cdn.net${imagePath}`;
  }
  
  return undefined;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Sync all laptops from Power.dk to database
  app.post("/api/sync", async (req, res) => {
    try {
      const pageSize = 50;
      let from = 0;
      let totalSynced = 0;
      let hasMore = true;
      
      console.log("Starting sync of all laptops from Power.dk...");
      
      const headers = {
        "User-Agent": getRandomUserAgent(),
        "Accept": "application/json",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
        "Referer": "https://www.power.dk/",
        "Origin": "https://www.power.dk",
      };
      
      while (hasMore) {
        const url = `${POWER_API_BASE}?cat=${LAPTOP_CATEGORY_ID}&size=${pageSize}&from=${from}`;
        console.log(`Fetching page from=${from}, size=${pageSize}`);
        
        const response = await axios.get(url, { headers, timeout: 30000 });
        const data = response.data;
        const rawProducts = data?.products || [];
        const totalCount = data?.totalProductCount || 0;
        
        if (rawProducts.length === 0) {
          hasMore = false;
          break;
        }
        
        const productsToInsert: InsertProduct[] = rawProducts.map((item: any, index: number) => {
          const name = item.title || "Ukendt produkt";
          const brand = item.manufacturerName || "Ukendt";
          const price = item.price || 0;
          const originalPrice = item.previousPrice;
          const productId = item.productId?.toString() || `product-${from}-${index}`;
          const imageUrl = getImageUrl(item.productImage);
          
          let productUrl = item.url || "";
          if (productUrl && !productUrl.startsWith("http")) {
            productUrl = `https://www.power.dk${productUrl}`;
          }
          
          const marginInfo = isHighMarginProduct(brand, price);
          const specs = extractSpecs(name);
          
          return {
            id: productId,
            name,
            brand,
            price,
            originalPrice: originalPrice || null,
            imageUrl: imageUrl || null,
            productUrl,
            sku: item.barcode || item.elguideId || null,
            inStock: item.stockCount > 0 || item.canAddToCart,
            isHighMargin: marginInfo.isHighMargin,
            marginReason: marginInfo.reason || null,
            specs,
          };
        });
        
        await storage.upsertProducts(productsToInsert);
        totalSynced += productsToInsert.length;
        from += pageSize;
        
        console.log(`Synced ${totalSynced}/${totalCount} products`);
        
        if (from >= totalCount || rawProducts.length < pageSize) {
          hasMore = false;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const finalCount = await storage.getProductCount();
      console.log(`Sync complete. Total products in database: ${finalCount}`);
      
      res.json({
        success: true,
        totalSynced,
        totalInDatabase: finalCount,
        message: `Synkroniserede ${totalSynced} produkter`,
      });
      
    } catch (error: any) {
      console.error("Sync error:", error.message);
      res.status(500).json({
        success: false,
        error: "Fejl ved synkronisering: " + error.message,
      });
    }
  });
  
  // Database status endpoint
  app.get("/api/db/status", async (req, res) => {
    try {
      const count = await storage.getProductCount();
      res.json({
        productCount: count,
        hasProducts: count > 0,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Database fejl: " + error.message,
      });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const useDatabase = req.query.db === "true";
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ 
          error: "Søgeord er påkrævet",
          products: [],
          totalCount: 0,
          searchQuery: ""
        });
      }

      // Try database search first if db=true or if we have products in database
      const dbProductCount = await storage.getProductCount();
      if (useDatabase && dbProductCount > 0) {
        console.log(`Searching database for: ${query}`);
        const dbResults = await storage.searchProducts(query);
        
        if (dbResults.length > 0) {
          // Convert DB products to response format with upgrade scoring
          const allProducts = dbResults.map((item) => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            price: item.price,
            originalPrice: item.originalPrice ?? undefined,
            imageUrl: item.imageUrl ?? undefined,
            productUrl: item.productUrl,
            sku: item.sku ?? undefined,
            inStock: item.inStock ?? true,
            isHighMargin: item.isHighMargin ?? false,
            marginReason: item.marginReason ?? undefined,
            specs: item.specs ?? {},
            isTopPick: false,
            priceDifference: 0,
            upgradeScore: 0,
          }));
          
          let products = allProducts;
          
          if (allProducts.length > 1) {
            const reference = allProducts[0];
            const referencePrice = reference.price;
            const referenceSpecs = reference.specs as ExtractedSpecs;
            const maxPrice = referencePrice * 1.5;
            
            const scoredAlternatives = allProducts.slice(1).map((alt: any) => {
              const priceDiff = alt.price - referencePrice;
              const { score, isValidUpgrade, upgradeReason } = calculateUpgradeScore(
                alt.specs,
                referenceSpecs,
                alt.isHighMargin,
                alt.price,
                referencePrice
              );
              
              return {
                ...alt,
                priceDifference: priceDiff,
                upgradeScore: score,
                isValidUpgrade,
                upgradeReason,
              };
            });
            
            const validUpgrades = scoredAlternatives
              .filter((alt: any) => alt.isValidUpgrade && alt.price <= maxPrice)
              .sort((a: any, b: any) => b.upgradeScore - a.upgradeScore)
              .slice(0, 8);
            
            const topPickIndex = findTopPick(validUpgrades);
            if (topPickIndex >= 0) {
              validUpgrades[topPickIndex].isTopPick = true;
            }
            
            products = [reference, ...validUpgrades];
          }
          
          console.log(`Found ${products.length} products in database for "${query}"`);
          return res.json({
            products,
            totalCount: dbResults.length,
            searchQuery: query,
            source: "database",
          });
        }
      }

      // Fallback to Power.dk API
      const headers = {
        "User-Agent": getRandomUserAgent(),
        "Accept": "application/json",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
        "Referer": "https://www.power.dk/",
        "Origin": "https://www.power.dk",
      };

      const searchUrl = `${POWER_API_BASE}?q=${encodeURIComponent(query)}&cat=${LAPTOP_CATEGORY_ID}&size=15&from=0`;
      
      console.log("Fetching from Power.dk:", searchUrl);
      
      const response = await axios.get(searchUrl, {
        headers,
        timeout: 15000,
      });

      const data = response.data;
      
      let rawProducts = data?.products || [];
      const totalCount = data?.totalProductCount || rawProducts.length;

      // If we found only 1 product (SKU search), fetch more laptops as alternatives
      if (rawProducts.length === 1) {
        console.log("Only 1 product found, fetching alternatives from category...");
        const categoryUrl = `${POWER_API_BASE}?cat=${LAPTOP_CATEGORY_ID}&size=20&from=0`;
        
        try {
          const altResponse = await axios.get(categoryUrl, {
            headers,
            timeout: 15000,
          });
          
          const altProducts = altResponse.data?.products || [];
          // Add alternatives (excluding the searched product)
          const searchedProductId = rawProducts[0].productId?.toString();
          const alternatives = altProducts.filter((p: any) => 
            p.productId?.toString() !== searchedProductId
          ).slice(0, 10);
          
          rawProducts = [...rawProducts, ...alternatives];
          console.log(`Added ${alternatives.length} alternatives from category`);
        } catch (altError) {
          console.log("Could not fetch alternatives:", altError);
        }
      }

      const allProducts = rawProducts.map((item: any, index: number) => {
        const name = item.title || "Ukendt produkt";
        const brand = item.manufacturerName || "Ukendt";
        const price = item.price || 0;
        const originalPrice = item.previousPrice;
        const productId = item.productId?.toString() || `product-${index}`;
        
        let imageUrl = getImageUrl(item.productImage);
        
        let productUrl = item.url || "";
        if (productUrl && !productUrl.startsWith("http")) {
          productUrl = `https://www.power.dk${productUrl}`;
        }

        const marginInfo = isHighMarginProduct(brand, price);
        const specs = extractSpecs(name);

        return {
          id: productId,
          name,
          brand,
          price,
          originalPrice: originalPrice || undefined,
          imageUrl: imageUrl || undefined,
          productUrl,
          sku: item.barcode || item.elguideId || undefined,
          inStock: item.stockCount > 0 || item.canAddToCart,
          isHighMargin: marginInfo.isHighMargin,
          marginReason: marginInfo.reason,
          specs,
          isTopPick: false,
          priceDifference: 0,
          upgradeScore: 0,
        };
      });

      let products = allProducts;

      if (allProducts.length > 1) {
        const reference = allProducts[0];
        const referencePrice = reference.price;
        const referenceSpecs = reference.specs;
        const maxPrice = referencePrice * 1.5;
        
        const scoredAlternatives = allProducts.slice(1).map((alt: any) => {
          const priceDiff = alt.price - referencePrice;
          const { score, isValidUpgrade, upgradeReason } = calculateUpgradeScore(
            alt.specs,
            referenceSpecs,
            alt.isHighMargin,
            alt.price,
            referencePrice
          );
          
          return {
            ...alt,
            priceDifference: priceDiff,
            upgradeScore: score,
            isValidUpgrade,
            upgradeReason,
          };
        });
        
        const validUpgrades = scoredAlternatives
          .filter((alt: any) => alt.isValidUpgrade && alt.price <= maxPrice)
          .sort((a: any, b: any) => b.upgradeScore - a.upgradeScore)
          .slice(0, 8);
        
        const topPickIndex = findTopPick(validUpgrades);
        if (topPickIndex >= 0) {
          validUpgrades[topPickIndex].isTopPick = true;
        }
        
        products = [reference, ...validUpgrades];
      }

      const result = {
        products,
        totalCount,
        searchQuery: query,
      };

      console.log(`Found ${products.length} products for query "${query}"`);
      res.json(result);
      
    } catch (error: any) {
      console.error("Search API error:", error.message);
      
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          return res.status(504).json({
            error: "Timeout ved forbindelse til Power.dk",
            products: [],
            totalCount: 0,
            searchQuery: req.query.q || "",
          });
        }
        
        if (error.response?.status === 403 || error.response?.status === 429) {
          return res.status(503).json({
            error: "Adgang til Power.dk API er midlertidigt blokeret. Prøv igen om et øjeblik.",
            products: [],
            totalCount: 0,
            searchQuery: req.query.q || "",
          });
        }
        
        console.error("API Response:", error.response?.status, error.response?.data);
      }
      
      res.status(500).json({
        error: "Der opstod en fejl ved søgning. Prøv igen.",
        products: [],
        totalCount: 0,
        searchQuery: req.query.q || "",
      });
    }
  });

  // PDF Export endpoint
  app.post("/api/export/pdf", async (req, res) => {
    try {
      const { products, searchQuery } = req.body as {
        products: ProductWithMargin[];
        searchQuery: string;
      };

      if (!products || products.length === 0) {
        return res.status(400).json({ error: "Ingen produkter at eksportere" });
      }

      const doc = new PDFDocument({ margin: 50, size: "A4" });
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="power-produkter-${Date.now()}.pdf"`
      );

      doc.pipe(res);

      // Header
      doc.fontSize(20).text("Power.dk - Produktsammenligning", { align: "center" });
      doc.moveDown(0.5);
      
      // Date and search info
      const now = new Date();
      doc.fontSize(10).fillColor("#666666");
      doc.text(`Dato: ${now.toLocaleDateString("da-DK")} kl. ${now.toLocaleTimeString("da-DK")}`, { align: "center" });
      doc.text(`Søgning: "${searchQuery}"`, { align: "center" });
      doc.moveDown(1);

      // Table setup
      const tableTop = doc.y;
      const colWidths = [180, 70, 70, 100, 75];
      const colHeaders = ["Produkt", "Mærke", "Pris (DKK)", "Specs", "Avance"];
      const startX = 50;
      const rowHeight = 40;
      
      // Draw table header
      doc.fontSize(9).fillColor("#FFFFFF");
      doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b, 0), 20).fill("#FF6600");
      
      let xPos = startX;
      colHeaders.forEach((header, i) => {
        doc.fillColor("#FFFFFF").text(header, xPos + 4, tableTop + 5, { width: colWidths[i] - 8, height: 15 });
        xPos += colWidths[i];
      });
      
      // Draw table rows
      let yPos = tableTop + 20;
      
      products.forEach((product, index) => {
        // Check for page break
        if (yPos > 720) {
          doc.addPage();
          yPos = 50;
          
          // Redraw header on new page
          doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), 20).fill("#FF6600");
          xPos = startX;
          colHeaders.forEach((header, i) => {
            doc.fillColor("#FFFFFF").text(header, xPos + 4, yPos + 5, { width: colWidths[i] - 8, height: 15 });
            xPos += colWidths[i];
          });
          yPos += 20;
        }
        
        const isHighMargin = product.isHighMargin;
        const rowColor = isHighMargin ? "#FFF5EB" : (index % 2 === 0 ? "#FFFFFF" : "#F8F8F8");
        
        // Row background
        doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(rowColor);
        
        // Row border
        doc.strokeColor("#DDDDDD").lineWidth(0.5);
        doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
        
        // Cell data
        const specs = product.specs || {};
        const specText = [specs.cpu, specs.ram, specs.storage].filter(Boolean).join(", ");
        const marginText = isHighMargin ? `Høj${product.marginReason ? "\n(" + product.marginReason + ")" : ""}` : "Standard";
        
        const rowData = [
          (isHighMargin ? "★ " : "") + product.name.substring(0, 50) + (product.name.length > 50 ? "..." : ""),
          product.brand,
          product.price.toLocaleString("da-DK"),
          specText.substring(0, 35) + (specText.length > 35 ? "..." : ""),
          marginText,
        ];
        
        xPos = startX;
        doc.fontSize(7).fillColor(isHighMargin ? "#FF6600" : "#333333");
        
        rowData.forEach((cell, i) => {
          doc.text(cell, xPos + 3, yPos + 4, { width: colWidths[i] - 6, height: rowHeight - 8 });
          xPos += colWidths[i];
        });
        
        yPos += rowHeight;
      });

      // Footer
      doc.fontSize(8).fillColor("#999999");
      doc.text(`Genereret af Power Margin Optimizer Pro - ${products.length} produkter`, 50, 780, { align: "center" });

      doc.end();
      
    } catch (error: any) {
      console.error("PDF export error:", error.message);
      res.status(500).json({ error: "Fejl ved PDF-eksport: " + error.message });
    }
  });

  // Excel Export endpoint
  app.post("/api/export/excel", async (req, res) => {
    try {
      const { products, searchQuery } = req.body as {
        products: ProductWithMargin[];
        searchQuery: string;
      };

      if (!products || products.length === 0) {
        return res.status(400).json({ error: "Ingen produkter at eksportere" });
      }

      // Prepare data for Excel
      const data = products.map((product) => ({
        "Produkt": product.name,
        "Mærke": product.brand,
        "Pris (DKK)": product.price,
        "Original Pris": product.originalPrice || "",
        "CPU": product.specs?.cpu || "",
        "RAM": product.specs?.ram || "",
        "Lagerplads": product.specs?.storage || "",
        "Høj Avance": product.isHighMargin ? "Ja" : "Nej",
        "Grund": product.marginReason || "",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      worksheet["!cols"] = [
        { wch: 50 }, // Produkt
        { wch: 15 }, // Mærke
        { wch: 12 }, // Pris
        { wch: 12 }, // Original Pris
        { wch: 25 }, // CPU
        { wch: 10 }, // RAM
        { wch: 12 }, // Lagerplads
        { wch: 10 }, // Høj Avance
        { wch: 20 }, // Grund
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Produkter");

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="power-produkter-${Date.now()}.xlsx"`
      );
      res.send(buffer);
      
    } catch (error: any) {
      console.error("Excel export error:", error.message);
      res.status(500).json({ error: "Fejl ved Excel-eksport: " + error.message });
    }
  });

  return httpServer;
}
