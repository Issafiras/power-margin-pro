import type { ProductSpecs } from "@shared/schema";

function getCpuTier(cpuString: string): number {
  const cpu = cpuString.toLowerCase();
  if (/intel\s+core\s+(?:ultra\s+)?i3/i.test(cpu)) return 3;
  if (/intel\s+core\s+(?:ultra\s+)?i5/i.test(cpu)) return 5;
  if (/intel\s+core\s+(?:ultra\s+)?i7/i.test(cpu)) return 7;
  if (/intel\s+core\s+(?:ultra\s+)?i9/i.test(cpu)) return 9;
  if (/amd\s+ryzen\s+3/i.test(cpu)) return 3;
  if (/amd\s+ryzen\s+5/i.test(cpu)) return 5;
  if (/amd\s+ryzen\s+7/i.test(cpu)) return 7;
  if (/amd\s+ryzen\s+9/i.test(cpu)) return 9;
  if (/apple\s+m4/i.test(cpu)) return 10;
  if (/apple\s+m3/i.test(cpu)) return 9;
  if (/apple\s+m2/i.test(cpu)) return 8;
  if (/apple\s+m1/i.test(cpu)) return 7;
  if (/celeron|pentium|athlon/i.test(cpu)) return 1;
  return 0;
}

function getGpuTier(gpuString: string): number {
  const gpu = gpuString.toLowerCase();
  if (/rtx\s*40\d{2}/i.test(gpu)) return 7;
  if (/rtx\s*30\d{2}/i.test(gpu)) return 5;
  if (/gtx/i.test(gpu)) return 3;
  if (/intel\s+(?:iris|uhd|arc)/i.test(gpu) || /radeon\s+graphics/i.test(gpu)) return 1;
  return 0;
}

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
