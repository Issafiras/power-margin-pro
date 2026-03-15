// Enhanced AI Pitch Generator with OpenRouter Integration
// Uses OpenRouter for intelligent, contextual Danish sales pitches

interface PitchInput {
  mainProduct: {
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
  topPick: {
    name: string;
    brand: string;
    price: number;
    priceDifference: number;
    specs: {
      cpu?: string;
      cpuTier?: number;
      ramGB?: number;
      storageGB?: number;
      gpu?: string;
      gpuTier?: number;
    };
  };
}

interface PitchResult {
  valuePitch: string;
  lossAversionPitch: string;
  futureProofingPitch: string;
  objectionHandlers: { objection: string; response: string }[];
  isAiGenerated: boolean;
}

async function generateWithOpenRouter(input: PitchInput): Promise<PitchResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const { mainProduct, topPick } = input;
  const priceDiff = topPick.priceDifference || (topPick.price - mainProduct.price);

  const prompt = `Du er en ekspert sælger hos Power.dk i Danmark. Generer kortfattede, overbevisende salgsargumenter på DANSK.

KUNDENS VALG:
- ${mainProduct.name}
- Pris: ${mainProduct.price} kr
- CPU: ${mainProduct.specs.cpu || "ukendt"} (Tier ${mainProduct.specs.cpuTier || "?"})
- RAM: ${mainProduct.specs.ramGB || "?"}GB
- Lager: ${mainProduct.specs.storageGB || "?"}GB
- GPU: ${mainProduct.specs.gpu || "integreret"}

DIT FORSLAG (høj avance for Power):
- ${topPick.name}
- Pris: ${topPick.price} kr (prisforskel: ${priceDiff} kr)
- CPU: ${topPick.specs.cpu || "ukendt"} (Tier ${topPick.specs.cpuTier || "?"})
- RAM: ${topPick.specs.ramGB || "?"}GB
- Lager: ${topPick.specs.storageGB || "?"}GB
- GPU: ${topPick.specs.gpu || "integreret"}

Svar KUN med gyldig JSON (ingen markdown):
{
  "valuePitch": "Max 2 sætninger. Beregn pris per dag over 3 år (${Math.round(priceDiff / 1095)} kr/dag). Vær specifik.",
  "lossAversionPitch": "Max 2 sætninger. Hvad går galt med den billige? Vær konkret (RAM, CPU, eller storage).",
  "futureProofingPitch": "Max 2 sætninger. Hvorfor holder denne længere? Nævn AI/Copilot hvis relevant.",
  "objectionHandlers": [
    {"objection": "Det er for dyrt", "response": "Kort svar med daglig pris"},
    {"objection": "Jeg behøver ikke noget så kraftigt", "response": "Kort svar om fremtidige behov"},
    {"objection": "Kan jeg ikke bare opgradere senere?", "response": "Kort svar om at moderne laptops ikke kan opgraderes"}
  ]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Issafiras/power-margin-pro",
        "X-Title": "Power Margin Pro"
      },
      body: JSON.stringify({
        model: "openrouter/hunter-alpha",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.warn("OpenRouter API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      ...parsed,
      isAiGenerated: true
    };
  } catch (error) {
    console.warn("OpenRouter pitch generation failed:", error);
    return null;
  }
}

function generateDeterministicPitch(input: PitchInput): PitchResult {
  const { mainProduct, topPick } = input;
  const priceDiff = topPick.priceDifference || (topPick.price - mainProduct.price);
  const dailyCost = Math.round(priceDiff / 1095); // Over 3 years
  const monthlyCost = Math.round(priceDiff / 36);

  const improvements: string[] = [];
  
  if ((topPick.specs.ramGB || 0) > (mainProduct.specs.ramGB || 0)) {
    const ramDiff = (topPick.specs.ramGB || 0) - (mainProduct.specs.ramGB || 0);
    improvements.push(`${ramDiff}GB ekstra RAM`);
  }
  if ((topPick.specs.cpuTier || 0) > (mainProduct.specs.cpuTier || 0)) {
    improvements.push("hurtigere processor");
  }
  if ((topPick.specs.storageGB || 0) > (mainProduct.specs.storageGB || 0)) {
    improvements.push("mere lagerplads");
  }
  if ((topPick.specs.gpuTier || 0) > (mainProduct.specs.gpuTier || 0)) {
    improvements.push("dedikeret grafikkort");
  }

  const improvementsText = improvements.length > 0 ? improvements.join(", ") : "bedre ydeevne";

  let valuePitch: string;
  if (priceDiff > 0) {
    valuePitch = `For kun ${dailyCost} kr om dagen (${monthlyCost} kr/måned) får du ${improvementsText}. Det er mindre end en kop kaffe for en markant bedre computer.`;
  } else {
    valuePitch = `Du sparer ${Math.abs(priceDiff)} kr OG får ${improvementsText}. Det er en ren win-win!`;
  }

  let lossAversionPitch: string;
  const mainRam = mainProduct.specs.ramGB || 0;
  const topRam = topPick.specs.ramGB || 0;
  
  if (mainRam < 16 && topRam >= 16) {
    lossAversionPitch = `Med kun ${mainRam}GB RAM vil computeren hakke når du har flere faner åbne. ${topRam}GB sikrer problemfrit arbejde — de fleste der køber ${mainRam}GB fortryder inden for et år.`;
  } else if ((mainProduct.specs.storageGB || 0) < 512 && (topPick.specs.storageGB || 0) >= 512) {
    lossAversionPitch = `256GB lager fyldes overraskende hurtigt med Windows-opdateringer og billeder. Med 512GB slipper du for konstant at skulle slette ting.`;
  } else if ((mainProduct.specs.cpuTier || 0) <= 4 && (topPick.specs.cpuTier || 0) >= 6) {
    lossAversionPitch = `Den billige processor bliver en flaskehals meget hurtigere end du tror. En bedre CPU holder 2-3 år længere.`;
  } else {
    lossAversionPitch = `Mange fortryder at spare de sidste penge, når computeren efter 6 måneder begynder at føles langsom.`;
  }

  let futureProofingPitch: string;
  if (topRam >= 32) {
    futureProofingPitch = `32GB RAM er fremtidssikret de næste 5+ år. AI-værktøjer som Copilot kræver mere hukommelse — denne computer er klar.`;
  } else if ((topPick.specs.cpuTier || 0) >= 8) {
    futureProofingPitch = `Denne processor er i nyeste generation og understøtter alle nye AI-funktioner. Den holder nemt 4-5 år.`;
  } else {
    futureProofingPitch = `Nyere komponenter holder 2-3 år længere. Det er billigere end at købe ny computer om 2 år.`;
  }

  const objectionHandlers = [
    {
      objection: "Det er for dyrt",
      response: `Over 3 år er det kun ${dailyCost} kr om dagen. En kaffe koster 40 kr — og du bruger computeren 8+ timer dagligt.`
    },
    {
      objection: "Jeg behøver ikke noget så kraftigt",
      response: `De fleste siger det — indtil Chrome med 10 faner og Teams begynder at hakke. Denne spec er fremtidssikret.`
    },
    {
      objection: "Kan jeg ikke bare opgradere senere?",
      response: `Moderne laptops har RAM og CPU loddet fast — det er ikke muligt at opgradere efter køb. Det er nu eller aldrig.`
    }
  ];

  return {
    valuePitch,
    lossAversionPitch,
    futureProofingPitch,
    objectionHandlers,
    isAiGenerated: false
  };
}

export async function generateEnhancedPitch(input: PitchInput): Promise<PitchResult> {
  // Try OpenRouter first
  const aiResult = await generateWithOpenRouter(input);
  if (aiResult) return aiResult;

  // Fallback to deterministic
  return generateDeterministicPitch(input);
}

export { generateDeterministicPitch };
