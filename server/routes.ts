import type { Express } from "express";
import type { Server } from "http";
import axios from "axios";
import { storage } from "./storage";
import { type InsertProduct, type ProductWithMargin, gpuBenchmarks, cpuBenchmarks } from "../shared/schema";
import { db, dbConfigured } from "./db";
import { sql, eq } from "drizzle-orm";

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


// GPU Score Cache
const gpuScoreCache = new Map<string, number>();
// CPU Score Cache
const cpuScoreCache = new Map<string, number>();

function normalizeCpuName(name: string): string {
  return name.toLowerCase()
    .replace(/(?:intel|amd|apple|qualcomm|snapdragon|processor|cpu)/g, "")
    .replace(/core/g, "") // "core i5" -> "i5"
    .replace(/ryzen/g, "") // "ryzen 7" -> "7"
    .replace(/\s+/g, "")
    .trim();
}

function normalizeGpuName(name: string): string {
  return name.toLowerCase()
    .replace(/(?:nvidia|amd|intel|geforce|radeon|graphics|mobile|laptop|gpu)/g, "")
    .replace(/with\s+max-q\s+design/g, "")
    .replace(/max-q/g, "")
    .replace(/\s+/g, "")
    .trim();
}

async function initializeGpuCache() {
  if (!dbConfigured) {
    console.warn("Skipping GPU cache init: Database not configured");
    return;
  }

  try {
    const benchmarks = await db.select().from(gpuBenchmarks);
    benchmarks.forEach(b => {
      if (b.gpuName && b.score) {
        gpuScoreCache.set(normalizeGpuName(b.gpuName), b.score);
      }
    });
  } catch (error) {
    console.error("Error loading GPU benchmarks:", error);
  }
}

async function initializeCpuCache() {
  if (!dbConfigured) {
    console.warn("Skipping CPU cache init: Database not configured");
    return;
  }

  try {
    // Select only what we need to save memory
    const benchmarks = await db.select({
      name: cpuBenchmarks.cpuName,
      score: cpuBenchmarks.score
    }).from(cpuBenchmarks);

    benchmarks.forEach(b => {
      if (b.name && b.score) {
        // Store both raw and normalized? Or just normalized to save space?
        // Let's store normalized for fuzzy matching
        cpuScoreCache.set(normalizeCpuName(b.name), b.score);
      }
    });
    console.log(`Loaded ${benchmarks.length} CPU benchmarks into cache.`);
  } catch (error) {
    console.error("Error loading CPU benchmarks:", error);
  }
}

// CPU Tier mapping based on buying guide (S=10, A=8, B=6, C=4, D=1)
function getCpuTier(cpuString: string): number {
  const cpu = cpuString.toLowerCase();

  // 1. Try Benchmark Cache first
  if (cpuScoreCache.size > 0) {
    const normalized = normalizeCpuName(cpuString);
    let score = cpuScoreCache.get(normalized);

    // Simple fuzzy lookup if exact match fails
    if (!score) {
      for (const [key, val] of cpuScoreCache.entries()) {
        // careful with short keys matching everything
        if (key.length > 3 && (normalized.includes(key) || key.includes(normalized))) {
          score = val;
          break;
        }
      }
    }

    if (score) {
      // Map PassMark score to Tier (1-10)
      // Calibrated for Laptop/Desktop mix (approximate)
      if (score > 35000) return 10; // S-Tier Data Center / Top Enthusiast
      if (score > 28000) return 9; // High-end i9/R9
      if (score > 22000) return 8; // High-end i7/R7 (A-Tier)
      if (score > 18000) return 7;
      if (score > 14000) return 6; // Mid-range i5/R5 (B-Tier - Sweet Spot)
      if (score > 10000) return 5;
      if (score > 6000) return 4; // Budget i3/R3 (C-Tier)
      if (score > 4000) return 3;
      if (score > 2000) return 2;
      return 1; // D-Tier
    }
  }

  // 2. Fallback to Regex Heuristics if no benchmark found

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
  if (!gpuString) return 0;

  // Try to find score in cache
  const normalizedInput = normalizeGpuName(gpuString);
  let score = gpuScoreCache.get(normalizedInput);

  // Fallback fuzzy matching if exact normalized match fails
  if (score === undefined) {
    for (const [key, value] of gpuScoreCache.entries()) {
      if (key.includes(normalizedInput) || normalizedInput.includes(key)) {
        score = value;
        break;
      }
    }
  }

  // If we have a benchmark score, map it to a tier (1-10)
  if (score !== undefined) {
    // Mapping Time Spy Graphics Scores to Tiers (Approximate)
    if (score > 18000) return 9; // RTX 4090/5090
    if (score > 14000) return 8; // RTX 4080
    if (score > 10000) return 7; // RTX 4070 / 3080
    if (score > 8000) return 6;  // RTX 4060 / 3070
    if (score > 6000) return 5;  // RTX 4050 / 3060
    if (score > 3500) return 4;  // GTX 1650 / Arc A370M
    if (score > 1500) return 3;  // MX550 / Radeon 680M
    if (score > 800) return 2;   // Iris Xe / Vega 8
    return 1;                    // Basic iGPU
  }

  // Fallback to legacy regex logic if no DB match found
  const gpu = gpuString.toLowerCase();

  // 50-series (Blackwell) - 2025 Flagships
  if (/rtx\s*5090/i.test(gpu)) return 9;
  if (/rtx\s*5080/i.test(gpu)) return 8;
  if (/rtx\s*5070/i.test(gpu)) return 7;
  if (/rtx\s*5060/i.test(gpu)) return 6;

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

function extractSpecs(productName: string, salesArguments?: string): ExtractedSpecs {
  const specs: ExtractedSpecs = {};

  // Clean inputs
  const cleanName = productName.replace(/[™®]/g, '');
  const cleanSalesArgs = (salesArguments || "").replace(/[™®]/g, '');

  // Combine product name and salesArguments for searching
  const searchText = cleanSalesArgs
    ? `${cleanName}\n${cleanSalesArgs}`
    : cleanName;

  // Extract RAM from salesArguments first (most reliable source)
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
    /(\d+)\s*(?:GB|TB|G|T)\s*(?:M\.2\s*)?(?:SSD|NVMe|HDD|PCIe|Gen\d)/i,
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

  // Extract CPU - Expanded patterns
  const cpuPatterns = [
    // Apple M-series
    /Apple\s+M[1234]\s*(?:Pro|Max|Ultra)?/i,
    // Snapdragon
    /Snapdragon\s+X\s*(?:Elite|Plus)?/i,
    // Intel Core Ultra (Series 1 & 2)
    /Intel\s+Core\s+Ultra\s+[3579]\s*(?:\d{3}[A-Z]*)?/i,
    // Intel Core (Series 1, e.g. Core 5 120U)
    /Intel\s+Core\s+[3579]\s+\d{3}[A-Z]*/i,
    // Intel Core i-series (Legacy)
    /Intel\s+Core\s+i[3579][\s-]?(?:\d{4,5}[A-Z]*)?/i,
    // AMD Ryzen AI
    /AMD\s+Ryzen\s+AI\s*\d+\s*(?:\d{3,4}[A-Z]*)?/i,
    // AMD Ryzen
    /AMD\s+Ryzen\s+[3579]\s*\d{4}[A-Z]*/i,
    // Budget
    /Intel\s+(?:Celeron|Pentium|N\d{2,4})/i,
    /AMD\s+(?:Athlon|A\d)/i,
    // Fallback simple
    /Intel\s+Core\s+[3579]/i, // Catch generic "Core 5"
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

  // Fallback: Try parenthesis format from product name if specs not found
  if (!specs.cpu || !specs.ramGB || !specs.storageGB) {
    // Handling (CPU/RAM/Storage) format
    // Matches: (i5/16/512), (R7/16GB/1TB), (Core 5/8/512)
    const complexMatch = cleanName.match(/\(([^/]+)\/(\d{1,2}(?:GB)?)\/(\d{2,4}(?:GB|TB)?)\)/i);

    if (complexMatch) {
      const cpuPart = complexMatch[1].trim();
      const ramPart = complexMatch[2].trim();
      const storagePart = complexMatch[3].trim();

      // CPU Logic
      if (!specs.cpu) {
        specs.cpu = cpuPart; // Just use what's there if valid?
        // Try to normalize
        if (/^i[3579]$/i.test(cpuPart)) specs.cpu = `Intel Core ${cpuPart}`;
        else if (/^R[3579]$/i.test(cpuPart)) specs.cpu = `AMD Ryzen ${cpuPart.substring(1)}`;
        else if (/^M[1234]$/i.test(cpuPart)) specs.cpu = `Apple ${cpuPart}`;

        specs.cpuTier = getCpuTier(specs.cpu);
      }

      // RAM Logic
      if (!specs.ramGB) {
        const ramVal = parseInt(ramPart);
        if (!isNaN(ramVal)) {
          specs.ramGB = ramVal;
          specs.ram = `${ramVal} GB`;
        }
      }

      // Storage Logic
      if (!specs.storageGB) {
        const storageVal = parseInt(storagePart);
        if (!isNaN(storageVal)) {
          if (/TB/i.test(storagePart) || (storageVal >= 1 && storageVal <= 8)) {
            // Assume TB if low number or text says TB
            specs.storageGB = storageVal * 1024;
            specs.storage = `${storageVal} TB`;
          } else {
            specs.storageGB = storageVal;
            specs.storage = `${storageVal} GB`;
          }
        }
      }
    } else {
      // Fallback legacy checking
      const oldStyleMatch = cleanName.match(/\((i[359]|R[3579]|M[1234])\/(\d{1,2})\/(\d{2,4})\s*(?:GB|TB)/i);
      if (oldStyleMatch && !specs.cpu) {
        // ... existing fallback logic mostly relies on this ...
        const cpuShorthand = oldStyleMatch[1].toUpperCase();
        if (cpuShorthand.startsWith("I")) specs.cpu = `Intel Core ${cpuShorthand}`;
        else if (cpuShorthand.startsWith("R")) specs.cpu = `AMD Ryzen ${cpuShorthand.substring(1)}`;
        specs.cpuTier = getCpuTier(specs.cpu || "");
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

  // Fallback storage patterns if still not found
  if (!specs.storageGB) {
    const storagePatterns = [
      /(\d+(?:\.\d+)?)\s*(?:TB|T)\s*(?:SSD|NVMe|HDD|PCIe)?/i,
      /(\d{3,4})\s*(?:GB|G)\s*(?:SSD|NVMe|HDD|PCIe)?/i,
    ];

    for (const pattern of storagePatterns) {
      const match = productName.match(pattern);
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

  // === HIGH MARGIN BONUS (Seller Priority) ===
  // These bonuses push high-margin products up WITHOUT showing customer why
  if (isHighMargin) {
    score += 25; // Base high-margin bonus
    // Note: We don't add "Høj avance" to customer-visible reasons
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

  // Initialize Caches
  try {
    await initializeGpuCache();
    await initializeCpuCache();
    console.log(`GPU Cache: ${gpuScoreCache.size} | CPU Cache: ${cpuScoreCache.size}`);
  } catch (error) {
    console.error("Failed to initialize GPU cache:", error);
  }

  const requireDb = (req: any, res: any, next: any) => {
    if (!dbConfigured) {
      return res.status(503).json({
        success: false,
        error: "Database not configured. set DATABASE_URL in Vercel."
      });
    }
    next();
  };

  // Health check endpoint (No DB required)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // DB Connection test endpoint
  app.get("/api/db/test-connection", async (req, res) => {
    if (!dbConfigured) {
      return res.status(503).json({ success: false, error: "Database not configured." });
    }
    try {
      console.log("Testing DB connection...");
      const result = await db.execute(sql`SELECT 1 as connected`);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("DB Connection test failed:", error);
      res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
  });

  // Sync laptops from Power.dk (Paginated for Vercel Serverless)
  app.post("/api/sync", requireDb, async (req, res) => {
    try {
      const from = parseInt(req.query.from as string) || 0;
      const size = 30; // Small batch size for serverless limits

      const headers = {
        "User-Agent": getRandomUserAgent(),
        "Accept": "application/json",
        "Referer": "https://www.power.dk/",
      };

      // If this is the first batch, clear the database to ensure full sync
      if (from === 0) {
        console.log("Starting full sync: Clearing existing products from database...");
        await storage.clearProducts();
      }

      // Fetch from Power.dk category (Laptops = 1341)
      const url = `${POWER_API_BASE}?cat=${LAPTOP_CATEGORY_ID}&size=${size}&from=${from}`;
      console.log(`Syncing batch from ${from} (size ${size}):`, url);

      const response = await axios.get(url, { headers, timeout: 20000 });
      const data = response.data;
      const rawProducts = data?.products || [];
      const totalCount = data?.totalProductCount || 0;

      if (rawProducts.length === 0) {
        return res.json({
          success: true,
          syncedCount: 0,
          totalCount,
          hasMore: false,
          message: "Ingen flere produkter at synkronisere."
        });
      }

      const productsToUpsert: InsertProduct[] = rawProducts.map((p: any) => {
        const name = p.title || "Ukendt produkt";
        const brand = p.manufacturerName || "Ukendt";
        const price = p.price || 0;
        const marginInfo = isHighMarginProduct(brand, price);
        const salesArgs = p.salesArguments || "";
        const specs = extractSpecs(name, salesArgs);

        let productUrl = p.url || "";
        if (productUrl && !productUrl.startsWith("http")) {
          productUrl = `https://www.power.dk${productUrl}`;
        }

        return {
          id: p.productId?.toString() || `p-${Math.random().toString(36).substr(2, 9)}`,
          name,
          brand,
          price,
          originalPrice: p.previousPrice || null,
          imageUrl: getImageUrl(p.productImage) || null,
          productUrl,
          sku: p.barcode || p.elguideId || null,
          inStock: p.stockCount > 0 || p.canAddToCart,
          isHighMargin: marginInfo.isHighMargin,
          marginReason: marginInfo.reason || null,
          specs: specs,
        };
      });

      await storage.upsertProducts(productsToUpsert);

      const syncedCount = productsToUpsert.length;
      const nextFrom = from + syncedCount;
      const hasMore = nextFrom < totalCount;

      res.json({
        success: true,
        syncedCount,
        nextFrom,
        hasMore,
        totalCount,
        message: `Synkroniserede ${syncedCount} produkter (total: ${nextFrom}/${totalCount})`
      });

    } catch (error: any) {
      console.error("Sync API error:", error.message);
      res.status(500).json({
        success: false,
        error: "Fejl ved synkronisering: " + error.message
      });
    }
  });

  // Autocomplete suggestions endpoint
  app.get("/api/suggestions", async (req, res) => {
    if (!dbConfigured) return res.json({ suggestions: [] });
    try {
      const q = req.query.q as string;
      if (!q || q.length < 2) return res.json({ suggestions: [] });

      const results = await storage.searchProducts(q);
      // Return full objects for the search bar, deduplicated by ID
      const suggestions = results
        .slice(0, 8)
        .map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          isHighMargin: p.isHighMargin
        }));

      res.json({ suggestions });
    } catch (error) {
      console.error("Suggestions error:", error);
      res.json({ suggestions: [] });
    }
  });

  // Database status endpoint
  app.get("/api/db/status", async (req, res) => {
    if (!dbConfigured) {
      return res.json({
        productCount: 0,
        highMarginCount: 0,
        hasProducts: false,
        status: "not_configured",
        message: "Database not connected. Please set DATABASE_URL."
      });
    }
    try {
      const count = await storage.getProductCount();
      const highMarginCount = await storage.getHighMarginCount();
      res.json({
        productCount: count,
        highMarginCount: highMarginCount,
        hasProducts: count > 0,
        status: "connected"
      });
    } catch (error: any) {
      console.error("CRITICAL: DB status error:", error);
      res.status(500).json({
        error: "Database fejl: " + (error.message || "Ukendt fejl"),
        details: error.toString(),
        status: "error"
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
      let dbProductCount = 0;
      try {
        if (dbConfigured) {
          dbProductCount = await storage.getProductCount();
        }
      } catch (dbErr) {
        console.warn("DB product count check failed, falling back to API:", (dbErr as Error).message);
      }
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

            // Enforce strict high-margin requirement for suggestions per user request (92/98/Cepter)
            if (!p.isHighMargin) return false;

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


  // Compare products endpoint
  app.get("/api/compare", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ error: "Missing ids parameter" });
      }

      const ids = idsParam.split(",").map(id => id.trim()).filter(id => id.length > 0);
      const products: ProductWithMargin[] = [];

      console.log(`Comparing products: ${ids.join(", ")}`);

      const headers = {
        "User-Agent": getRandomUserAgent(),
        "Accept": "application/json",
      };

      // Helper to fetch details
      const fetchDetails = async (id: string) => {
        // 1. Try DB first
        try {
          const dbProduct = await storage.getProductById(id);
          if (dbProduct) {
            const specs = (dbProduct.specs as ExtractedSpecs) || {};
            return {
              id: dbProduct.id,
              name: dbProduct.name,
              brand: dbProduct.brand,
              price: dbProduct.price,
              originalPrice: dbProduct.originalPrice ?? undefined,
              imageUrl: dbProduct.imageUrl ?? undefined,
              productUrl: dbProduct.productUrl,
              sku: dbProduct.sku ?? undefined,
              inStock: dbProduct.inStock ?? true,
              isHighMargin: dbProduct.isHighMargin ?? false,
              marginReason: dbProduct.marginReason ?? undefined,
              specs,
              // Add default fields for ProductWithMargin
              isTopPick: false,
              priceDifference: 0,
              upgradeScore: 0,
              upgradeReason: undefined
            } as ProductWithMargin;
          }
        } catch (dbErr) {
          console.error(`DB error for ${id}:`, dbErr);
        }

        // 2. Try Power Search API with specific ID query
        // Matches logic in generic search but targeted
        const searchUrl = `${POWER_API_BASE}?q=${id}&cat=${LAPTOP_CATEGORY_ID}&size=1`;
        try {
          console.log(`Fetching ${id} from Power API...`);
          const response = await axios.get(searchUrl, { headers, timeout: 5000 });
          const raw = response.data?.products?.[0];

          if (raw) {
            const name = raw.title || "Ukendt produkt";
            const price = raw.price || 0;
            const brand = raw.manufacturerName || "Ukendt";
            const marginInfo = isHighMarginProduct(brand, price);
            const sales = raw.salesArguments || "";
            const specs = extractSpecs(name, sales);

            let productUrl = raw.url || "";
            if (productUrl && !productUrl.startsWith("http")) {
              productUrl = `https://www.power.dk${productUrl}`;
            }

            return {
              id: raw.productId?.toString() || id,
              name,
              brand,
              price,
              originalPrice: raw.previousPrice || undefined,
              imageUrl: getImageUrl(raw.productImage) || undefined,
              productUrl,
              sku: raw.barcode || raw.elguideId,
              inStock: raw.stockCount > 0 || raw.canAddToCart,
              isHighMargin: marginInfo.isHighMargin,
              marginReason: marginInfo.reason,
              specs,
              isTopPick: false,
              priceDifference: 0,
              upgradeScore: 0,
              upgradeReason: undefined
            } as ProductWithMargin;
          } else {
            console.log(`Product ${id} not found in Power API`);
          }
        } catch (e: any) {
          console.error(`Failed to fetch ${id} from Power:`, e.message);
        }
        return null;
      };

      for (const id of ids) {
        const product = await fetchDetails(id);
        if (product) {
          products.push(product);
        }
      }

      res.json({ products });

    } catch (error: any) {
      console.error("Compare error:", error);
      res.status(500).json({ error: "Failed to compare products" });
    }
  });

  // Power.dk AI Comparison Proxy Endpoint
  app.post("/api/ai-compare", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length < 2) {
        return res.status(400).json({ error: "Kræver mindst 2 produkt-ID'er" });
      }

      // Construct Power.dk API URL
      // Format: https://www.power.dk/api/v2/products/comparison-summary?productIds=ID1&productIds=ID2
      const queryString = ids.map(id => `productIds=${id}`).join("&");
      const url = `https://www.power.dk/api/v2/products/comparison-summary?${queryString}`;

      console.log("Fetching AI summary from Power.dk:", url);

      const response = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept": "application/json"
        },
        timeout: 10000
      });

      // The API returns a JSON string containing HTML
      const htmlContent = response.data;

      res.json({ summary: htmlContent });

    } catch (error: any) {
      console.error("AI Compare Proxy Error:", error.message);

      // Fallback: If Power API fails, generate deterministic summary
      // We need to fetch products first for deterministic summary, but let's just return a generic error or simple text if API fails
      // Since fetching products again is expensive here inside the catch block without the products object readily available.
      // We'll just return an error message that the client can handle or display.
      // Or we can try to return a simple text if we have product data? No, let's keep it simple.
      res.status(502).json({
        error: "Kunne ikke hente AI-oversigt fra Power.dk",
        details: error.message
      });
    }
  });


  // AI Pitch Generation endpoint (Deterministic fallback - Puppeteer removed for Vercel compatibility)
  app.post("/api/generate-pitch", async (req, res) => {
    try {
      const { mainProduct, topPick } = req.body;

      if (!mainProduct || !topPick) {
        return res.status(400).json({ error: "Missing mainProduct or topPick in request body" });
      }

      const priceDiff = topPick.priceDifference || (topPick.price - mainProduct.price);
      const dailyCost = Math.round(priceDiff / 365);

      let valuePitch = "";
      let lossPitch = "";
      let futurePitch = "";

      // Value Pitch Logic
      if (priceDiff > 0) {
        valuePitch = `For kun ${dailyCost} kr om dagen får du en maskine der er langt hurtigere. Det er en lille pris for at undgå ventetid i hverdagen.`;
      } else {
        valuePitch = `Du sparer ${Math.abs(priceDiff)} kr og får samtidig en bedre maskine. Det er en ren win-win situation.`;
      }

      // Loss Aversion Logic
      if ((mainProduct.specs?.ramGB || 0) < 16 && (topPick.specs?.ramGB || 0) >= 16) {
        lossPitch = "Den billige model har kun 8GB RAM - det bliver hurtigt en flaskehals. Med 16GB slipper du for at den hakker når du har mange faner åbne.";
      } else if ((mainProduct.specs?.storageGB || 0) < 512 && (topPick.specs?.storageGB || 0) >= 512) {
        lossPitch = "256GB lager bliver fyldt overraskende hurtigt. Med 512GB undgår du at skulle slette dine filer og billeder om et år.";
      } else {
        lossPitch = "Mange fortryder at spare de sidste penge, når computeren begynder at blive langsom. Denne opgradering sikrer den gode oplevelse.";
      }

      // Future Proofing Logic
      futurePitch = `Denne model er bygget med nyere komponenter der holder 2-3 år længere. Det er billigere end at skulle skifte computeren ud før tid.`;

      res.json({
        valuePitch,
        lossAversionPitch: lossPitch,
        futureProofingPitch: futurePitch,
        isAiGenerated: false
      });

    } catch (error: any) {
      console.error("Pitch generation error:", error.message);
      res.status(500).json({
        valuePitch: "Denne opgradering giver dig bedre ydelse til en fornuftig pris.",
        lossAversionPitch: "Mange fortryder at spare de sidste penge, når computeren begynder at blive langsom.",
        futureProofingPitch: "Nyere komponenter holder længere - det er billigere end at skifte før tid.",
        isAiGenerated: false
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

      // Dynamic import to avoid loading ~14MB font files at cold start (crashes Vercel)
      const PDFDocument = (await import("pdfkit")).default;
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

      // Dynamic import to avoid bundling issues in serverless
      const XLSX = await import("xlsx");

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
