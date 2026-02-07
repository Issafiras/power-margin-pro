import type { ProductSpecs } from "@shared/schema";

// CPU Tier mapping based on buying guide (S=10, A=8, B=6, C=4, D=1)
function getCpuTier(cpuString: string): number {
  const cpu = cpuString.toLowerCase();

  // Tier D (Avoid!) - Score 1
  if (/celeron|pentium|athlon|amd\s+a\d|intel\s+n\d{2,4}/i.test(cpu)) return 1;

  // Tier S (Workstation/Ultimate) - Score 10
  if (/apple\s+m[34]\s*(max|ultra)/i.test(cpu)) return 10;
  if (/core\s+ultra\s+9/i.test(cpu)) return 10;
  if (/i9[- ]?(1\d)\d{3}hx/i.test(cpu)) return 10;
  if (/ryzen\s+9.*\d{4}hx/i.test(cpu)) return 10;
  if (/snapdragon\s+x\s*elite/i.test(cpu)) return 10;
  // Specific Ryzen AI 300 high-end (Ryzen AI 9 HX 370 etc)
  if (/ryzen\s+ai\s+9\s+3\d{2}/i.test(cpu)) return 10;

  // Tier A (High-End) - Score 8-9
  if (/apple\s+m[34]\s*pro/i.test(cpu)) return 9;
  if (/apple\s+m4(?!\s*max|\s*ultra)/i.test(cpu)) return 8; // M4 base is very strong
  if (/core\s+ultra\s+7/i.test(cpu)) return 8;
  if (/core\s+7/i.test(cpu)) return 8;
  if (/i7[- ]?(13|14|15)\d{3}h/i.test(cpu)) return 8;
  if (/ryzen\s+7.*\d{4}h[sx]?/i.test(cpu)) return 8;
  if (/ryzen\s+ai\s+9/i.test(cpu)) return 8; // Standard Ryzen AI 9
  if (/snapdragon\s+x\s*plus/i.test(cpu)) return 7;

  // Tier B (Sweet Spot) - Score 6-7
  if (/apple\s+m[23](?!\s*max|\s*pro|\s*ultra)/i.test(cpu)) return 7;
  if (/core\s+ultra\s+5/i.test(cpu)) return 7; // Ultra 5 is solid mid-high
  if (/ryzen\s+ai\s+7/i.test(cpu)) return 7; // Ryzen AI 7
  if (/core\s+5/i.test(cpu)) return 6;
  if (/i5[- ]?(12|13|14|15)\d{3}[hp]/i.test(cpu)) return 6;
  if (/ryzen\s+5.*\d{4}h[sx]?/i.test(cpu)) return 6;
  if (/ryzen\s+7.*u/i.test(cpu)) return 6;
  if (/apple\s+m1(?!\s*max|\s*pro|\s*ultra)/i.test(cpu)) return 6;

  // Tier C (Budget/Office) - Score 4-5
  if (/i3[- ]?(12|13|14)\d{3}/i.test(cpu)) return 4;
  if (/core\s+3/i.test(cpu)) return 4;
  if (/ryzen\s+3/i.test(cpu)) return 4;
  if (/ryzen\s+5.*u/i.test(cpu)) return 4; // Older/efficiency Ryzen 5
  if (/i5.*u/i.test(cpu)) return 4; // Older/efficiency i5

  // Fallback generic heuristic
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

  // 50-series (Blackwell) - 2025 Flagships
  if (/rtx\s*5090/i.test(gpu)) return 9; // Monster
  if (/rtx\s*5080/i.test(gpu)) return 8; // Very high end
  if (/rtx\s*5070/i.test(gpu)) return 7; // High end
  if (/rtx\s*5060/i.test(gpu)) return 6; // Solid mid-range

  // 40-series
  if (/rtx\s*4090/i.test(gpu)) return 8;
  if (/rtx\s*4080/i.test(gpu)) return 7;
  if (/rtx\s*4070/i.test(gpu)) return 6;
  if (/rtx\s*4060/i.test(gpu)) return 5;
  if (/rtx\s*4050/i.test(gpu)) return 4;

  // 30-series (Legacy high-end is now mid-range)
  if (/rtx\s*308\d/i.test(gpu)) return 6;
  if (/rtx\s*307\d/i.test(gpu)) return 5;
  if (/rtx\s*3060/i.test(gpu)) return 4;
  if (/rtx\s*3050/i.test(gpu)) return 3;

  // Entry Level
  if (/gtx\s*16\d{2}/i.test(gpu)) return 3;
  if (/rtx\s*2050/i.test(gpu)) return 3;

  // Integrated / Basic
  if (/intel\s+arc\s+a\d+/i.test(gpu)) return 4; // Arc dedicated is decent
  if (/radeon\s+rx\s*6\d{2}0/i.test(gpu)) return 4;

  if (/intel\s+(?:iris|uhd|arc)/i.test(gpu) || /radeon\s+graphics/i.test(gpu)) return 1;

  return 0; // Unknown or integrated
}

export function extractSpecs(productName: string, salesArguments?: string): ProductSpecs {
  const specs: ProductSpecs = {};

  // Clean inputs
  const cleanName = productName.replace(/[™®]/g, '');
  const cleanSalesArgs = (salesArguments || "").replace(/[™®]/g, '');

  const searchText = cleanSalesArgs
    ? `${cleanName}\n${cleanSalesArgs}`
    : cleanName;

  // Extract RAM
  const ramPatterns = [
    /(\d{1,3})\s*GB\s*(?:RAM|DDR[45]|LPDDR[45x])/i,
    /RAM\s*(\d{1,3})\s*GB/i
  ];

  for (const pattern of ramPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const ramValue = parseInt(match[1], 10);
      if (ramValue >= 4 && ramValue <= 128) {
        specs.ram = `${ramValue} GB`;
        specs.ramGB = ramValue;
        break;
      }
    }
  }

  // Extract Storage (Improved Logic)
  const storagePatterns = [
    /(\d+)\s*(?:GB|TB|G|T)\s*(?:M\.2\s*)?(?:SSD|NVMe|PCIe|Gen\d)/i,
    /Lager\s*(\d+)\s*(?:GB|TB|G|T)/i,
    /SSD\s*:\s*(\d+)\s*(?:GB|TB|G|T)/i,
    /HARDDISK\s*:\s*(\d+)\s*(?:GB|TB|G|T)/i
  ];

  for (const pattern of storagePatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      const isTB = /T/i.test(match[0]);
      if (isTB) {
        specs.storage = `${value} TB`;
        specs.storageGB = value * 1024;
      } else if (value >= 64) {
        specs.storage = `${value} GB`;
        specs.storageGB = value;
      }
      break;
    }
  }

  // Extract CPU
  const cpuPatterns = [
    /Apple\s+M[1234]\s*(?:Pro|Max|Ultra)?/i,
    /Snapdragon\s+X\s*(?:Elite|Plus)?/i,
    /Intel\s+Core\s+Ultra\s+[3579]\s*(?:\d{3}[A-Z]*)?/i,
    /Intel\s+Core\s+[3579]\s+\d{3}[A-Z]*/i,
    /Intel\s+Core\s+i[3579][\s-]?(?:\d{4,5}[A-Z]*)?/i,
    /AMD\s+Ryzen\s+AI\s*\d+\s*(?:\d{3,4}[A-Z]*)?/i,
    /AMD\s+Ryzen\s+[3579]\s*\d{4}[A-Z]*/i,
    /Intel\s+(?:Celeron|Pentium|N\d{2,4})/i,
    /AMD\s+(?:Athlon|A\d)/i,
    /Intel\s+Core\s+[3579]/i,
    /AMD\s+Ryzen\s+[3579]/i,
  ];

  for (const pattern of cpuPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.cpu = match[0].trim();
      specs.cpuTier = getCpuTier(specs.cpu);
      break;
    }
  }

  // Extract GPU
  const gpuPatterns = [
    /RTX\s*\d{4}(?:\s*Ti)?(?:\s*Super)?/i,
    /GTX\s*\d{4}(?:\s*Ti)?/i,
    /GeForce\s+(?:RTX|GTX)\s*\d{4}(?:\s*Ti)?(?:\s*Super)?/i,
    /Radeon\s+RX\s*\d{4}[A-Z]*/i,
    /Intel\s+(?:Iris\s+Xe|Arc\s+[\dA-Z]+|UHD\s+Graphics)/i,
    /AMD\s+Radeon\s+Graphics/i,
  ];

  for (const pattern of gpuPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.gpu = match[0].trim();
      specs.gpuTier = getGpuTier(specs.gpu);
      break;
    }
  }

  // Fallback Logic
  if (!specs.cpu || !specs.ramGB || !specs.storageGB) {
    const threeValueMatch = productName.match(/\((i[3579]|R[3579]|U[3579]|M[1234])\/(\d{1,2}(?:GB)?)\/(\d{2,4}(?:GB|TB|G|T)?)/i);

    if (threeValueMatch) {
      const cpuShorthand = threeValueMatch[1]?.toUpperCase();

      if (!specs.cpu && cpuShorthand) {
        let cpuName = "";
        if (cpuShorthand.startsWith("I")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Intel Core i${num}`;
        } else if (cpuShorthand.startsWith("R")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `AMD Ryzen ${num}`;
        } else if (cpuShorthand.startsWith("U")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Intel Core Ultra ${num}`;
        } else if (cpuShorthand.startsWith("M")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Apple M${num}`;
        }
        if (cpuName) {
          specs.cpu = cpuName;
          specs.cpuTier = getCpuTier(cpuName);
        }
      }

      if (!specs.ramGB) {
        const ramVal = parseInt(threeValueMatch[2], 10);
        if (ramVal >= 4) {
          specs.ram = `${ramVal} GB`;
          specs.ramGB = ramVal;
        }
      }

      if (!specs.storageGB) {
        const storageVal = parseInt(threeValueMatch[3], 10);
        const isTB = /T/i.test(threeValueMatch[3]);
        if (isTB) {
          specs.storage = `${storageVal} TB`;
          specs.storageGB = storageVal * 1024;
        } else if (storageVal >= 64) {
          specs.storage = `${storageVal} GB`;
          specs.storageGB = storageVal;
        }
      }
    } else {
      // Old style fallback (legacy)
      const oldStyleMatch = cleanName.match(/\((i[359]|R[3579]|M[1234])\/(\d{1,2})\/(\d{2,4})\s*(?:GB|TB)/i);
      if (oldStyleMatch && !specs.cpu) {
        const cpuShorthand = oldStyleMatch[1].toUpperCase();
        if (cpuShorthand.startsWith("I")) specs.cpu = `Intel Core ${cpuShorthand}`;
        else if (cpuShorthand.startsWith("R")) specs.cpu = `AMD Ryzen ${cpuShorthand.substring(1)}`;
        specs.cpuTier = getCpuTier(specs.cpu || "");
      }
    }
  }

  // Storage patterns if not found yet (Fallback)
  if (!specs.storageGB) {
    const storagePatterns = [
      /(\d+(?:\.\d+)?)\s*(?:TB|T)\s*(?:SSD|NVMe|HDD|PCIe)?/i,
      /(\d{3,4})\s*(?:GB|G)\s*(?:SSD|NVMe|HDD|PCIe)?/i,
    ];

    for (const pattern of storagePatterns) {
      const match = searchText.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (/T/i.test(match[0])) {
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
      specs.screenSize = `${size}"`;
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
  if (priceStr.endsWith("92")) {
    return { isHighMargin: true, reason: "Pris ender på 92" };
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
