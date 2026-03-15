// AI-Powered Alternative Finder v2
// Uses OpenRouter/hunter-alpha + AI Knowledge Base

import { knowledgeStorage } from "../storage/knowledge";

interface LaptopAlternative {
  name: string;
  brand: string;
  estimatedPrice: number;
  isHighMargin: boolean;
  marginReason: string;
  specs: {
    cpu?: string;
    cpuTier?: number;
    ramGB?: number;
    storageGB?: number;
    gpu?: string;
    gpuTier?: number;
  };
  reasoning: string;
  confidence: number;
}

interface FindAlternativesInput {
  referenceProduct: {
    name: string;
    brand: string;
    price: number;
    specs: {
      cpu?: string;
      cpuTier?: number;
      ramGB?: number;
      storageGB?: number;
      gpu?: string;
      gpuTier?: number;
    };
  };
  maxPrice?: number;
}

export async function findAIAlternatives(input: FindAlternativesInput): Promise<LaptopAlternative[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  const { referenceProduct } = input;
  const maxPrice = input.maxPrice ?? referenceProduct.price * 1.5;

  // Get AI context from knowledge base
  const aiContext = await knowledgeStorage.getAIContext(
    referenceProduct.name,
    referenceProduct.brand,
    referenceProduct.price
  );

  // Get sales tips and brand margins
  const highMarginBrands = await knowledgeStorage.getHighMarginBrands();
  const highMarginNames = highMarginBrands.map(b => b.brandName).join(", ");

  const prompt = `Du er en ekspert på Power.dk's laptop sortiment i Danmark. Find 5 bedre alternativer til denne laptop.

KUNDENS VALG:
- ${referenceProduct.name}
- Pris: ${referenceProduct.price} kr
- CPU: ${referenceProduct.specs.cpu || "ukendt"} (Tier ${referenceProduct.specs.cpuTier || "?"})
- RAM: ${referenceProduct.specs.ramGB || "?"}GB
- Lager: ${referenceProduct.specs.storageGB || "?"}GB
- GPU: ${referenceProduct.specs.gpu || "integreret"}

VIDEN FRA DATABASE:
${aiContext}

HØJ MARGIN BRANDS (PRIORITER DISSE): ${highMarginNames || "Cepter, Dream Machines, MSI"}

REGLER FOR ALTERNATIVER:
1. Maks pris: ${maxPrice} kr
2. PRIORITER disse (høj avance for Power.dk):
   - Cepter brand (ALTID høj avance — 35% margin!)
   - Dream Machines (Power's gaming brand — 28% margin)
   - Priser der slutter på 92 eller 98 (f.eks. 6992, 8498)
3. Alternativer skal have BEDRE specs end kundens valg
4. Vær realistisk — brug rigtige laptop modeller der findes i Danmark 2025/2026
5. Undgå Apple (kun 8% margin) medmindre det er markant bedre
6. Bland Cepter/Dream Machines med andre mærker

Svar KUN med gyldig JSON array (ingen markdown):
[
  {
    "name": "Fulde laptop navn med specs",
    "brand": "Mærke",
    "estimatedPrice": 7992,
    "isHighMargin": true,
    "marginReason": "Cepter brand (35% margin)" eller "Pris slutter på 92" eller "Dream Machines (28% margin)",
    "specs": {
      "cpu": "Processor navn",
      "cpuTier": 6,
      "ramGB": 16,
      "storageGB": 512,
      "gpu": "Grafikkort navn",
      "gpuTier": 3
    },
    "reasoning": "Kort forklaring på hvorfor dette er bedre",
    "confidence": 0.85
  }
]`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Issafiras/power-margin-pro",
        "X-Title": "Power Margin Pro - AI Alternatives v2"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.warn("OpenRouter API error:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const alternatives: LaptopAlternative[] = JSON.parse(jsonStr);

    // Enrich with database knowledge
    for (const alt of alternatives) {
      // Verify margin info from database
      const brandMargin = await knowledgeStorage.getBrandMargin(alt.brand);
      if (brandMargin && brandMargin.marginTier === "highest") {
        alt.isHighMargin = true;
        alt.marginReason = `${alt.brand} (${brandMargin.marginPercent}% margin)`;
      }
      
      // Check price pattern
      const pricePattern = await knowledgeStorage.checkPricePattern(alt.estimatedPrice);
      if (pricePattern.bonus >= 40) {
        alt.isHighMargin = true;
        alt.marginReason = pricePattern.reason;
      }
    }

    // Sort: high margin first, then confidence
    return alternatives.sort((a, b) => {
      if (a.isHighMargin !== b.isHighMargin) return a.isHighMargin ? -1 : 1;
      return b.confidence - a.confidence;
    });
  } catch (error) {
    console.warn("AI alternative finder failed:", error);
    return [];
  }
}

export function scoreAlternative(alt: LaptopAlternative): {
  marginScore: number;
  upgradeScore: number;
  totalScore: number;
} {
  let marginScore = 0;
  
  if (alt.brand.toLowerCase() === "cepter") marginScore += 50;
  if (alt.brand.toLowerCase() === "dream machines") marginScore += 45;
  if (alt.brand.toLowerCase() === "msi") marginScore += 35;

  const priceStr = Math.floor(alt.estimatedPrice).toString();
  if (priceStr.endsWith("92")) marginScore += 40;
  if (priceStr.endsWith("98")) marginScore += 40;

  let upgradeScore = 0;
  upgradeScore += (alt.specs.ramGB || 0) * 2;
  upgradeScore += (alt.specs.cpuTier || 0) * 5;
  upgradeScore += (alt.specs.storageGB || 0) / 100;
  upgradeScore += (alt.specs.gpuTier || 0) * 3;

  const confidenceMultiplier = alt.confidence || 0.5;

  return {
    marginScore: Math.round(marginScore * confidenceMultiplier),
    upgradeScore: Math.round(upgradeScore * confidenceMultiplier),
    totalScore: Math.round((marginScore + upgradeScore) * confidenceMultiplier)
  };
}
