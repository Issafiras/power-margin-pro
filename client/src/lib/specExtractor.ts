import type { ProductSpecs } from "@shared/schema";

export function extractSpecs(productName: string): ProductSpecs {
  const specs: ProductSpecs = {};
  
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

export function isHighMarginProduct(brand: string, price: number): { isHighMargin: boolean; reason?: string } {
  if (brand.toLowerCase() === "cepter") {
    return { isHighMargin: true, reason: "Cepter brand" };
  }
  
  const priceStr = Math.floor(price).toString();
  if (priceStr.endsWith("98")) {
    return { isHighMargin: true, reason: "Pris ender på 98" };
  }
  
  return { isHighMargin: false };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function findTopPick(
  alternatives: Array<{ isHighMargin: boolean; price: number; priceDifference?: number }>,
  referencePrice: number
): number {
  let bestIndex = -1;
  let bestScore = -Infinity;
  
  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    if (!alt.isHighMargin) continue;
    
    const priceDiff = Math.abs(alt.price - referencePrice);
    const priceProximityScore = 1000 - priceDiff;
    
    if (priceProximityScore > bestScore) {
      bestScore = priceProximityScore;
      bestIndex = i;
    }
  }
  
  return bestIndex;
}
