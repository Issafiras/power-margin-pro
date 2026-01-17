import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

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

function extractSpecs(productName: string) {
  const specs: { cpu?: string; gpu?: string; ram?: string } = {};
  
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
      break;
    }
  }
  
  const ramPatterns = [
    /(\d{1,3})\s*GB\s*(?:DDR[45]|RAM|LPDDR[45x])/i,
    /(\d{1,3})\s*GB/i,
  ];
  
  for (const pattern of ramPatterns) {
    const match = productName.match(pattern);
    if (match) {
      specs.ram = `${match[1]} GB`;
      break;
    }
  }
  
  return specs;
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

function findTopPick(products: any[], referencePrice: number): number {
  let bestIndex = -1;
  let bestScore = -Infinity;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.isHighMargin) continue;
    
    const priceDiff = Math.abs(product.price - referencePrice);
    const priceProximityScore = 10000 - priceDiff;
    
    if (priceProximityScore > bestScore) {
      bestScore = priceProximityScore;
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
    const imagePath = `${basePath}${variants[0].filename}`;
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    return `https://www.power.dk${imagePath}`;
  }
  
  return undefined;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ 
          error: "Søgeord er påkrævet",
          products: [],
          totalCount: 0,
          searchQuery: ""
        });
      }

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

      const products = rawProducts.map((item: any, index: number) => {
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
        };
      });

      if (products.length > 1) {
        const referencePrice = products[0].price;
        
        for (let i = 1; i < products.length; i++) {
          products[i].priceDifference = products[i].price - referencePrice;
        }
        
        const alternatives = products.slice(1);
        const topPickIndex = findTopPick(alternatives, referencePrice);
        
        if (topPickIndex >= 0) {
          products[topPickIndex + 1].isTopPick = true;
        }
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

  return httpServer;
}
