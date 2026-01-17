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
  gpuVram?: number;
  ram?: string;
  ramGB?: number;
  storage?: string;
  storageGB?: number;
  screenSize?: string;
  screenType?: string;
  screenResolution?: string;
  features?: string[];
  os?: string;
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

function extractSpecs(productName: string, salesArguments?: string): ExtractedSpecs {
  const specs: ExtractedSpecs = {};
  
  // Combine product name and salesArguments for searching
  const searchText = salesArguments 
    ? `${productName}\n${salesArguments}` 
    : productName;
  
  // Extract RAM from salesArguments first (most reliable source)
  // Pattern: "16 GB RAM" or "8GB RAM" or "16 GB DDR4" etc.
  const ramFromSales = searchText.match(/(\d{1,2})\s*GB\s*(?:RAM|DDR[45]|LPDDR[45x])/i);
  if (ramFromSales) {
    const ramValue = parseInt(ramFromSales[1], 10);
    if (ramValue >= 4 && ramValue <= 128) {
      specs.ram = `${ramValue} GB`;
      specs.ramGB = ramValue;
    }
  }
  
  // Extract Storage from salesArguments
  // Pattern: "512 GB SSD" or "1 TB SSD" or "512 GB M.2 SSD"
  const storageFromSales = searchText.match(/(\d+)\s*(?:GB|TB)\s*(?:M\.2\s*)?(?:SSD|NVMe|HDD)/i);
  if (storageFromSales) {
    const value = parseInt(storageFromSales[1], 10);
    const isTB = /TB/i.test(storageFromSales[0]);
    if (isTB) {
      specs.storage = `${value} TB`;
      specs.storageGB = value * 1024;
    } else if (value >= 64) {
      specs.storage = `${value} GB`;
      specs.storageGB = value;
    }
  }
  
  // Extract CPU - check salesArguments first for full model names
  const cpuPatterns = [
    /AMD\s+Ryzen[™]?\s+[3579]\s+\d{4}[A-Z]*/i,
    /Intel\s+Core[™]?\s+(?:Ultra\s+)?[i579][\s-]?(?:\d{4,5}[A-Z]*)/i,
    /Intel\s+Core[™]?\s+(?:Ultra\s+)?[i579]/i,
    /AMD\s+Ryzen[™]?\s+[3579]/i,
    /Apple\s+M[1234]\s*(?:Pro|Max|Ultra)?/i,
    /Snapdragon\s+X\s*(?:Elite|Plus)?/i,
    /Intel\s+(?:Celeron|Pentium|N\d{4})/i,
    /AMD\s+Athlon/i,
  ];
  
  for (const pattern of cpuPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.cpu = match[0].trim().replace(/[™]/g, '');
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
    /Intel\s+(?:Iris\s+Xe|Arc\s+A\d+|UHD\s+Graphics)/i,
    /AMD\s+Radeon[™]?\s+Graphics/i,
  ];
  
  for (const pattern of gpuPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.gpu = match[0].trim().replace(/[™]/g, '');
      specs.gpuTier = getGpuTier(specs.gpu);
      break;
    }
  }
  
  // Fallback: Try parenthesis format from product name if specs not found
  if (!specs.cpu || !specs.ramGB || !specs.storageGB) {
    // Try 3-value format: (CPU/RAM/Storage) like "(i5/8/512 GB)"
    const threeValueMatch = productName.match(/\((i[3579]|R[3579]|U[3579]|M[1234])\/(\d{1,2})\/(\d{2,4})\s*(?:GB|TB)/i);
    // Try 2-value format: (CPU/Storage) like "(R7/512 GB)"
    const twoValueMatch = productName.match(/\((i[3579]|R[3579]|U[3579]|M[1234])\/(\d{2,4})\s*(?:GB|TB)/i);
    
    const parenthesisMatch = threeValueMatch || twoValueMatch;
    const isThreeValue = !!threeValueMatch;
    
    if (parenthesisMatch) {
      const cpuShorthand = parenthesisMatch[1]?.toUpperCase();
      if (cpuShorthand && !specs.cpu) {
        let cpuName = "";
        let tier = 0;
        if (cpuShorthand.startsWith("I")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Intel Core i${num}`;
          tier = num === "9" ? 8 : num === "7" ? 6 : num === "5" ? 5 : 4;
        } else if (cpuShorthand.startsWith("R")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `AMD Ryzen ${num}`;
          tier = num === "9" ? 8 : num === "7" ? 6 : num === "5" ? 5 : 4;
        } else if (cpuShorthand.startsWith("U")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Intel Core Ultra ${num}`;
          tier = num === "9" ? 9 : num === "7" ? 7 : num === "5" ? 5 : 4;
        } else if (cpuShorthand.startsWith("M")) {
          const num = cpuShorthand.charAt(1);
          cpuName = `Apple M${num}`;
          tier = num === "4" ? 10 : num === "3" ? 9 : num === "2" ? 8 : 7;
        }
        if (cpuName) {
          specs.cpu = cpuName;
          specs.cpuTier = tier;
        }
      }
      
      if (isThreeValue && !specs.ramGB) {
        const ramValue = parseInt(parenthesisMatch[2], 10);
        if (ramValue >= 4 && ramValue <= 64) {
          specs.ram = `${ramValue} GB`;
          specs.ramGB = ramValue;
        }
      }
      
      if (!specs.storageGB) {
        const storageIdx = isThreeValue ? 3 : 2;
        const storageValue = parseInt(parenthesisMatch[storageIdx], 10);
        if (storageValue >= 64) {
          specs.storage = `${storageValue} GB`;
          specs.storageGB = storageValue;
        }
      }
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
  
  // Extract screen size (e.g., 14", 15,6", 17,3")
  const screenMatch = searchText.match(/(\d{1,2})[,.]?(\d)?["\u2033]?\s*(?:inch|tommer)?/i);
  if (screenMatch) {
    const sizeStr = screenMatch[2] ? `${screenMatch[1]},${screenMatch[2]}"` : `${screenMatch[1]}"`;
    const size = parseFloat(screenMatch[1] + (screenMatch[2] ? '.' + screenMatch[2] : ''));
    if (size >= 10 && size <= 18) {
      specs.screenSize = sizeStr;
    }
  }
  
  // Extract screen type (OLED, IPS, TN, VA, etc.)
  const screenTypeMatch = searchText.match(/\b(OLED|IPS|TN|VA|Full\s*HD|FHD|QHD|4K|UHD|Retina|AMOLED|Mini-?LED)\b/i);
  if (screenTypeMatch) {
    specs.screenType = screenTypeMatch[1].toUpperCase().replace(/\s+/g, '');
  }
  
  // Extract screen resolution
  const resolutionMatch = searchText.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
  if (resolutionMatch) {
    specs.screenResolution = `${resolutionMatch[1]}x${resolutionMatch[2]}`;
  }
  
  // Extract GPU VRAM (e.g., "6 GB", "8 GB" after GPU name)
  const gpuVramMatch = searchText.match(/(?:RTX|GTX|GeForce|Radeon)[^\n]*?(\d+)\s*GB/i);
  if (gpuVramMatch) {
    specs.gpuVram = parseInt(gpuVramMatch[1], 10);
  }
  
  // Extract operating system
  const osPatterns = [
    /Windows\s+1[01]\s*(?:Home|Pro|S)?/i,
    /macOS[^\n]*/i,
    /Chrome\s*OS/i,
    /Linux/i,
  ];
  for (const pattern of osPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      specs.os = match[0].trim();
      break;
    }
  }
  
  // Extract features
  const features: string[] = [];
  const featurePatterns: [RegExp, string][] = [
    [/USB-C|USB\s*Type-C/i, "USB-C"],
    [/Thunderbolt\s*\d?/i, "Thunderbolt"],
    [/DisplayPort|DP/i, "DisplayPort"],
    [/HDMI/i, "HDMI"],
    [/Touchsk\u00e6rm|Touch\s*screen|Touchdisplay/i, "Touchskærm"],
    [/Fingeraftryk|Fingerprint/i, "Fingeraftryk"],
    [/Baggrundsbelyst|Backlit\s*keyboard/i, "Baggrundsbelyst tastatur"],
    [/WiFi\s*6E?|Wi-Fi\s*6E?/i, "WiFi 6"],
    [/Bluetooth\s*\d+\.?\d*/i, "Bluetooth"],
    [/Webcam|Kamera/i, "Webcam"],
    [/Copilot\+?\s*PC/i, "Copilot+ PC"],
    [/2-i-1|2-in-1|Convertible/i, "2-i-1"],
    [/NVMe|PCIe\s*(?:Gen\s*)?\d/i, "NVMe SSD"],
  ];
  
  for (const [pattern, label] of featurePatterns) {
    if (pattern.test(searchText)) {
      features.push(label);
    }
  }
  
  if (features.length > 0) {
    specs.features = features;
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
  referencePrice: number,
  maxPrice?: number
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
  // Rule 0: Require RAM+Storage for alternatives (CPU optional for broader matches)
  // Alternative must have RAM and Storage; reference specs are optional
  const altHasBasicSpecs = altRam > 0 && altStorage > 0;
  const refHasBasicSpecs = refRam > 0 && refStorage > 0;
  
  // Rule 1: No RAM downgrade allowed (RAM is most important) - only if ref has RAM
  const hasRamDowngrade = refRam > 0 && altRam > 0 && ramDiff < 0;
  
  // Rule 2: No D-tier CPU if reference is C+ tier
  const hasDTierCpu = altCpu === 1;
  const refIsDecentCpu = refCpu >= 4;
  const hasBadCpuDowngrade = hasDTierCpu && refIsDecentCpu;
  
  // Rule 3: Major CPU downgrade (more than 2 tiers) - only if both have CPU
  const hasMajorCpuDowngrade = refCpu > 0 && altCpu > 0 && cpuDiff < -2;
  
  // Rule 4: Price within reasonable range (use provided maxPrice or default to 1.5x)
  const effectiveMaxPrice = maxPrice ?? referencePrice * 1.5;
  const isWithinPriceRange = alternativePrice <= effectiveMaxPrice;
  
  // Determine if this is a valid upgrade
  // If reference has no specs, show any product with RAM+Storage as potential alternatives
  const hasAnyUpgrade = ramDiff > 0 || cpuDiff > 0 || storageDiff > 0 || gpuDiff > 0;
  const refHasNoSpecs = refRam === 0 && refCpu === 0 && refStorage === 0;
  
  const isValidUpgrade = 
    altHasBasicSpecs &&  // Alternative must have at least RAM+Storage
    isWithinPriceRange &&
    !hasBadCpuDowngrade &&
    (
      refHasNoSpecs ? true :  // Fallback: show any alt with RAM+Storage when ref has no specs
      (
        (hasAnyUpgrade || isHighMargin) && 
        !hasRamDowngrade && 
        !hasMajorCpuDowngrade
      )
    );
  
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
  if (priceStr.endsWith("92")) {
    return { isHighMargin: true, reason: "Pris ender på 92" };
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
          const salesArguments = item.salesArguments || "";
          const specs = extractSpecs(name, salesArguments);
          
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
          // Get the reference product from search results
          const refItem = dbResults[0];
          const reference = {
            id: refItem.id,
            name: refItem.name,
            brand: refItem.brand,
            price: refItem.price,
            originalPrice: refItem.originalPrice ?? undefined,
            imageUrl: refItem.imageUrl ?? undefined,
            productUrl: refItem.productUrl,
            sku: refItem.sku ?? undefined,
            inStock: refItem.inStock ?? true,
            isHighMargin: refItem.isHighMargin ?? false,
            marginReason: refItem.marginReason ?? undefined,
            specs: refItem.specs ?? {},
            isTopPick: false,
            priceDifference: 0,
            upgradeScore: 0,
          };
          
          // Fetch ALL products from database to find alternatives (not just search results)
          const allDbProducts = await storage.getAllProducts();
          const referencePrice = reference.price;
          const referenceSpecs = reference.specs as ExtractedSpecs;
          // For budget laptops, ensure minimum price ceiling of 3000 kr or 2x reference price
          const maxPrice = Math.max(referencePrice * 1.5, referencePrice * 2, 3000);
          
          // Filter to valid alternatives with RAM+Storage specs
          const validDbProducts = allDbProducts.filter((p) => {
            if (p.id === reference.id) return false;
            if (p.price > maxPrice) return false;
            
            const specs = p.specs as ExtractedSpecs | null;
            if (!specs) return false;
            if (!specs.ramGB || specs.ramGB === 0) return false;
            if (!specs.storageGB || specs.storageGB === 0) return false;
            
            return true;
          });
          
          const scoredAlternatives = validDbProducts.map((p) => {
            const specs = (p.specs as ExtractedSpecs) || {};
            const priceDiff = p.price - referencePrice;
            const { score, isValidUpgrade, upgradeReason } = calculateUpgradeScore(
              specs,
              referenceSpecs,
              p.isHighMargin ?? false,
              p.price,
              referencePrice,
              maxPrice
            );
            
            return {
              id: p.id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              originalPrice: p.originalPrice ?? undefined,
              imageUrl: p.imageUrl ?? undefined,
              productUrl: p.productUrl,
              sku: p.sku ?? undefined,
              inStock: p.inStock ?? true,
              isHighMargin: p.isHighMargin ?? false,
              marginReason: p.marginReason ?? undefined,
              specs,
              isTopPick: false,
              priceDifference: priceDiff,
              upgradeScore: score,
              isValidUpgrade,
              upgradeReason,
            };
          });
          
          const validUpgrades = scoredAlternatives
            .filter((alt) => alt.isValidUpgrade)
            .sort((a, b) => b.upgradeScore - a.upgradeScore)
            .slice(0, 8);
          
          const topPickIndex = findTopPick(validUpgrades);
          if (topPickIndex >= 0) {
            validUpgrades[topPickIndex].isTopPick = true;
          }
          
          const products = [reference, ...validUpgrades];
          
          console.log(`Found ${products.length} products (1 reference + ${validUpgrades.length} alternatives) from database for "${query}"`);
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

      // Filter to only in-stock products (online availability)
      rawProducts = rawProducts.filter((p: any) => p.stockCount > 0 || p.canAddToCart);

      // Guard: If no products found from API, return empty result
      if (rawProducts.length === 0) {
        console.log(`No in-stock products found for query "${query}"`);
        return res.json({
          products: [],
          totalCount: 0,
          searchQuery: query,
        });
      }

      // Map the main searched product from API
      const mainProduct = rawProducts[0];
      const mainName = mainProduct.title || "Ukendt produkt";
      const mainBrand = mainProduct.manufacturerName || "Ukendt";
      const mainPrice = mainProduct.price || 0;
      const mainMarginInfo = isHighMarginProduct(mainBrand, mainPrice);
      
      // Try to get specs from database first, fallback to extraction using salesArguments
      const mainProductId = mainProduct.productId?.toString() || "product-0";
      const dbProduct = await storage.getProductById(mainProductId);
      const mainSalesArgs = mainProduct.salesArguments || "";
      const mainSpecs = (dbProduct?.specs as ExtractedSpecs) || extractSpecs(mainName, mainSalesArgs);
      console.log(`Main product ${mainProductId} specs from ${dbProduct ? 'database' : 'extraction'}:`, mainSpecs);
      
      let mainProductUrl = mainProduct.url || "";
      if (mainProductUrl && !mainProductUrl.startsWith("http")) {
        mainProductUrl = `https://www.power.dk${mainProductUrl}`;
      }
      
      const reference = {
        id: mainProductId,
        name: mainName,
        brand: mainBrand,
        price: mainPrice,
        originalPrice: mainProduct.previousPrice || undefined,
        imageUrl: getImageUrl(mainProduct.productImage) || undefined,
        productUrl: mainProductUrl,
        sku: mainProduct.barcode || mainProduct.elguideId || undefined,
        inStock: mainProduct.stockCount > 0 || mainProduct.canAddToCart,
        isHighMargin: mainMarginInfo.isHighMargin,
        marginReason: mainMarginInfo.reason,
        specs: mainSpecs,
        isTopPick: false,
        priceDifference: 0,
        upgradeScore: 0,
      };
      
      // Fetch alternatives from database if available
      let products = [reference];
      const dbAltCount = await storage.getProductCount();
      
      if (dbAltCount > 0) {
        console.log("Fetching alternatives from database...");
        const dbAlternatives = await storage.getAllProducts();
        const referencePrice = reference.price;
        const referenceSpecs = reference.specs;
        // For budget laptops, ensure minimum price ceiling of 3000 kr or 2x reference price
        const maxPrice = Math.max(referencePrice * 1.5, referencePrice * 2, 3000);
        
        // Filter to HIGH MARGIN products with RAM+Storage specs (CPU optional) and within price range
        const validDbProducts = dbAlternatives.filter((p) => {
          if (p.id === reference.id) return false;
          if (p.price > maxPrice) return false;
          
          // ONLY show high margin alternatives
          if (!p.isHighMargin) return false;
          
          // Require at least RAM+Storage for valid comparison (CPU optional)
          const specs = p.specs as ExtractedSpecs | null;
          if (!specs) return false;
          if (!specs.ramGB || specs.ramGB === 0) return false;
          if (!specs.storageGB || specs.storageGB === 0) return false;
          
          return true;
        });
        
        // Map DB products directly to response format and score them
        const scoredAlternatives = validDbProducts.map((p) => {
          const specs = (p.specs as ExtractedSpecs) || {};
          const priceDiff = p.price - referencePrice;
          const { score, isValidUpgrade, upgradeReason } = calculateUpgradeScore(
            specs,
            referenceSpecs,
            p.isHighMargin ?? false,
            p.price,
            referencePrice,
            maxPrice
          );
          
          return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            price: p.price,
            originalPrice: p.originalPrice ?? undefined,
            imageUrl: p.imageUrl ?? undefined,
            productUrl: p.productUrl,
            sku: p.sku ?? undefined,
            inStock: p.inStock ?? true,
            isHighMargin: p.isHighMargin ?? false,
            marginReason: p.marginReason ?? undefined,
            specs,
            isTopPick: false,
            priceDifference: priceDiff,
            upgradeScore: score,
            isValidUpgrade,
            upgradeReason,
          };
        });
        
        // Sort by upgrade score and take top 8
        const validUpgrades = scoredAlternatives
          .filter((alt) => alt.isValidUpgrade)
          .sort((a, b) => b.upgradeScore - a.upgradeScore)
          .slice(0, 8);
        
        const topPickIndex = findTopPick(validUpgrades);
        if (topPickIndex >= 0) {
          validUpgrades[topPickIndex].isTopPick = true;
        }
        
        products = [reference, ...validUpgrades];
        console.log(`Found ${validUpgrades.length} valid alternatives from database`);
      } else {
        // Fallback to Power.dk category if database is empty
        console.log("Database empty, fetching alternatives from Power.dk...");
        if (rawProducts.length === 1) {
          const categoryUrl = `${POWER_API_BASE}?cat=${LAPTOP_CATEGORY_ID}&size=20&from=0`;
          
          try {
            const altResponse = await axios.get(categoryUrl, { headers, timeout: 15000 });
            const altProducts = altResponse.data?.products || [];
            const alternatives = altProducts
              .filter((p: any) => p.productId?.toString() !== reference.id)
              .filter((p: any) => p.stockCount > 0 || p.canAddToCart)
              .slice(0, 15);
            
            const mappedAlts = alternatives.map((item: any) => {
              const name = item.title || "Ukendt produkt";
              const brand = item.manufacturerName || "Ukendt";
              const price = item.price || 0;
              const marginInfo = isHighMarginProduct(brand, price);
              const salesArgs = item.salesArguments || "";
              const specs = extractSpecs(name, salesArgs);
              let productUrl = item.url || "";
              if (productUrl && !productUrl.startsWith("http")) {
                productUrl = `https://www.power.dk${productUrl}`;
              }
              
              const priceDiff = price - reference.price;
              const { score, isValidUpgrade, upgradeReason } = calculateUpgradeScore(
                specs, reference.specs, marginInfo.isHighMargin, price, reference.price
              );
              
              return {
                id: item.productId?.toString() || "",
                name, brand, price,
                originalPrice: item.previousPrice || undefined,
                imageUrl: getImageUrl(item.productImage) || undefined,
                productUrl,
                sku: item.barcode || item.elguideId || undefined,
                inStock: item.stockCount > 0 || item.canAddToCart,
                isHighMargin: marginInfo.isHighMargin,
                marginReason: marginInfo.reason,
                specs,
                isTopPick: false,
                priceDifference: priceDiff,
                upgradeScore: score,
                isValidUpgrade,
                upgradeReason,
              };
            });
            
            const validUpgrades = mappedAlts
              .filter((alt: any) => alt.isValidUpgrade && alt.isHighMargin)
              .sort((a: any, b: any) => b.upgradeScore - a.upgradeScore)
              .slice(0, 8);
            
            const topPickIndex = findTopPick(validUpgrades);
            if (topPickIndex >= 0) {
              validUpgrades[topPickIndex].isTopPick = true;
            }
            
            products = [reference, ...validUpgrades];
            console.log(`Added ${validUpgrades.length} alternatives from Power.dk category`);
          } catch (altError) {
            console.log("Could not fetch alternatives:", altError);
          }
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
