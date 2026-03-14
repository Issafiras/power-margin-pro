// AI-Powered Alternative Finder
// Bruger OpenRouter/hunter-alpha til at finde høj-avance laptops baseret på produktviden

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
  confidence: number; // 0-1
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

  const prompt = `Du er en ekspert på Power.dk's laptop sortiment i Danmark. Find 5 bedre alternativer til denne laptop.

KUNDENS VALG:
- ${referenceProduct.name}
- Pris: ${referenceProduct.price} kr
- CPU: ${referenceProduct.specs.cpu || "ukendt"} (Tier ${referenceProduct.specs.cpuTier || "?"})
- RAM: ${referenceProduct.specs.ramGB || "?"}GB
- Lager: ${referenceProduct.specs.storageGB || "?"}GB

REGLER FOR ALTERNATIVER:
1. Maks pris: ${maxPrice} kr
2. PRIORITER disse (høj avance for Power.dk):
   - Cepter brand (ALTID høj avance)
   - Priser der slutter på 92 eller 98 (f.eks. 6992, 8498)
3. Alternativer skal have BEDRE specs (mindst én af: mere RAM, bedre CPU, mere lager, bedre GPU)
4. Vær realistisk — brug rigtige laptop modeller der findes i Danmark 2025/2026
5. Bland Cepter med andre mærker (ASUS, Lenovo, HP, Acer, MSI)

Svar KUN med gyldig JSON array (ingen markdown):
[
  {
    "name": "Fulde laptop navn med specs",
    "brand": "Mærke",
    "estimatedPrice": 7992,
    "isHighMargin": true,
    "marginReason": "Cepter brand" eller "Pris slutter på 92",
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
        "X-Title": "Power Margin Pro - AI Alternatives"
      },
      body: JSON.stringify({
        model: "openrouter/hunter-alpha",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.warn("OpenRouter API error:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    // Parse JSON from response
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const alternatives: LaptopAlternative[] = JSON.parse(jsonStr);

    // Sort by high margin first, then by confidence
    return alternatives.sort((a, b) => {
      if (a.isHighMargin !== b.isHighMargin) return a.isHighMargin ? -1 : 1;
      return b.confidence - a.confidence;
    });
  } catch (error) {
    console.warn("AI alternative finder failed:", error);
    return [];
  }
}

// Score et alternativ baseret på margin-regler
export function scoreAlternative(alt: LaptopAlternative): {
  marginScore: number;
  upgradeScore: number;
  totalScore: number;
} {
  let marginScore = 0;
  
  // Cepter brand = højeste margin
  if (alt.brand.toLowerCase() === "cepter") {
    marginScore += 50;
  }

  // Pris slutter på 92 eller 98
  const priceStr = Math.floor(alt.estimatedPrice).toString();
  if (priceStr.endsWith("92")) marginScore += 40;
  if (priceStr.endsWith("98")) marginScore += 40;

  // Upgrade score baseret på specs
  let upgradeScore = 0;
  upgradeScore += (alt.specs.ramGB || 0) * 2;
  upgradeScore += (alt.specs.cpuTier || 0) * 5;
  upgradeScore += (alt.specs.storageGB || 0) / 100;
  upgradeScore += (alt.specs.gpuTier || 0) * 3;

  // Confidence justering
  const confidenceMultiplier = alt.confidence || 0.5;

  return {
    marginScore: Math.round(marginScore * confidenceMultiplier),
    upgradeScore: Math.round(upgradeScore * confidenceMultiplier),
    totalScore: Math.round((marginScore + upgradeScore) * confidenceMultiplier)
  };
}
