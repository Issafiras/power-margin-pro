// Product Insights API - Sammenligningsanalyse mellem produkter
// Giver dybere indsigt i pris/ydeevne forhold

interface ProductInsight {
  score: number; // 0-100
  verdict: string;
  pros: string[];
  cons: string[];
  pricePerRamGB: number;
  pricePerStorageGB: number;
  cpuValueScore: number;
  recommendation: "excellent" | "good" | "average" | "poor";
}

export function analyzeProduct(product: {
  name: string;
  price: number;
  specs: {
    cpuTier?: number;
    ramGB?: number;
    storageGB?: number;
    gpuTier?: number;
  };
}): ProductInsight {
  const { price, specs } = product;
  const pros: string[] = [];
  const cons: string[] = [];

  // Price per GB RAM
  const pricePerRamGB = specs.ramGB ? Math.round(price / specs.ramGB) : Infinity;
  const pricePerStorageGB = specs.storageGB ? Math.round(price / specs.storageGB) : Infinity;

  // CPU value score (tier / price * 1000)
  const cpuValueScore = specs.cpuTier ? Math.round((specs.cpuTier / price) * 10000) : 0;

  // Analyze RAM
  if ((specs.ramGB || 0) >= 32) {
    pros.push("32GB+ RAM — fremtidssikret til AI og tunge arbejdsopgaver");
  } else if ((specs.ramGB || 0) >= 16) {
    pros.push("16GB RAM — tilstrækkelig til de fleste opgaver");
  } else if ((specs.ramGB || 0) >= 8) {
    cons.push("8GB RAM kan blive begrænsende med mange åbne programmer");
  } else {
    cons.push("Under 8GB RAM — ikke anbefalet i 2026");
  }

  // Analyze CPU
  if ((specs.cpuTier || 0) >= 8) {
    pros.push("Højtydende processor (Tier A/S) — klar til krævende opgaver");
  } else if ((specs.cpuTier || 0) >= 6) {
    pros.push("God processor (Tier B) — sweet spot for de fleste");
  } else if ((specs.cpuTier || 0) <= 3) {
    cons.push("Svag processor — vil føles langsom hurtigt");
  }

  // Analyze Storage
  if ((specs.storageGB || 0) >= 1024) {
    pros.push("1TB+ lagerplads — masser af plads til filer");
  } else if ((specs.storageGB || 0) >= 512) {
    pros.push("512GB SSD — god balance");
  } else if ((specs.storageGB || 0) < 512) {
    cons.push("Under 512GB — fyldes hurtigt op");
  }

  // Analyze GPU
  if ((specs.gpuTier || 0) >= 6) {
    pros.push("Kraftigt dedikeret grafikkort — gaming og kreativt arbejde");
  } else if ((specs.gpuTier || 0) >= 4) {
    pros.push("Dedikeret grafikkort — bedre end integreret");
  }

  // Calculate overall score (0-100)
  let score = 50; // Base
  score += Math.min(20, (specs.ramGB || 0) * 0.6); // RAM contribution
  score += Math.min(15, (specs.cpuTier || 0) * 1.5); // CPU contribution
  score += Math.min(10, (specs.storageGB || 0) / 100); // Storage contribution
  score += Math.min(5, (specs.gpuTier || 0) * 0.5); // GPU contribution
  
  // Price penalty/bonus
  if (price < 4000) score += 5; // Budget friendly bonus
  if (price > 15000) score -= 5; // Premium penalty

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Verdict
  let verdict: string;
  let recommendation: ProductInsight["recommendation"];

  if (score >= 80) {
    verdict = "Fremragende værdi for pengene";
    recommendation = "excellent";
  } else if (score >= 65) {
    verdict = "God købsmulighed";
    recommendation = "good";
  } else if (score >= 45) {
    verdict = "Gennemsnitlig — sammenlign alternativer";
    recommendation = "average";
  } else {
    verdict = "Overvej bedre alternativer";
    recommendation = "poor";
  }

  return {
    score,
    verdict,
    pros,
    cons,
    pricePerRamGB,
    pricePerStorageGB,
    cpuValueScore,
    recommendation
  };
}
