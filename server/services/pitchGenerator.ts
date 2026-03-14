// Enhanced AI Pitch Generator with OpenAI Integration
// Replaces the basic deterministic logic with intelligent, contextual pitches

import OpenAI from "openai";

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

function generateDeterministicPitch(input: PitchInput): PitchResult {
  const { mainProduct, topPick } = input;
  const priceDiff = topPick.priceDifference || (topPick.price - mainProduct.price);
  const dailyCost = Math.round(priceDiff / (365 * 3)); // Over 3 years
  const monthlyCost = Math.round(priceDiff / 36);

  const improvements: string[] = [];
  
  // RAM improvement
  if ((topPick.specs.ramGB || 0) > (mainProduct.specs.ramGB || 0)) {
    const ramDiff = (topPick.specs.ramGB || 0) - (mainProduct.specs.ramGB || 0);
    improvements.push(`${ramDiff}GB ekstra RAM`);
  }

  // CPU improvement
  if ((topPick.specs.cpuTier || 0) > (mainProduct.specs.cpuTier || 0)) {
    improvements.push("hurtigere processor");
  }

  // Storage improvement
  if ((topPick.specs.storageGB || 0) > (mainProduct.specs.storageGB || 0)) {
    const storageDiff = (topPick.specs.storageGB || 0) - (mainProduct.specs.storageGB || 0);
    if (storageDiff >= 512) {
      improvements.push("dobbelt lagerplads");
    } else {
      improvements.push("mere lagerplads");
    }
  }

  // GPU improvement
  if ((topPick.specs.gpuTier || 0) > (mainProduct.specs.gpuTier || 0)) {
    improvements.push("dedikeret grafikkort");
  }

  const improvementsText = improvements.length > 0 
    ? improvements.join(", ") 
    : "bedre ydeevne";

  // Value Pitch
  let valuePitch: string;
  if (priceDiff > 0) {
    valuePitch = `For kun ${dailyCost} kr om dagen (${monthlyCost} kr/måned) får du ${improvementsText}. Det er mindre end en kop kaffe for en markant bedre computer.`;
  } else {
    valuePitch = `Du sparer ${Math.abs(priceDiff)} kr OG får ${improvementsText}. Det er en ren win-win!`;
  }

  // Loss Aversion Pitch
  let lossAversionPitch: string;
  const mainRam = mainProduct.specs.ramGB || 0;
  const topRam = topPick.specs.ramGB || 0;
  
  if (mainRam < 16 && topRam >= 16) {
    lossAversionPitch = `Med kun ${mainRam}GB RAM vil computeren begynde at hakke når du har flere faner åbne. ${topRam}GB sikrer at du kan arbejde uden frustrationer — de fleste kunder der køber ${mainRam}GB fortryder inden for et år.`;
  } else if ((mainProduct.specs.storageGB || 0) < 512 && (topPick.specs.storageGB || 0) >= 512) {
    lossAversionPitch = `256GB lager bliver fyldt overraskende hurtigt — især med Windows-opdateringer og billeder. Med 512GB slipper du for at skulle slette ting konstant eller købe ekstern lager.`;
  } else if ((mainProduct.specs.cpuTier || 0) <= 4 && (topPick.specs.cpuTier || 0) >= 6) {
    lossAversionPitch = `Den billige processor bliver en flaskehals meget hurtigere end du tror. Hjemmesider, apps og Windows selv kræver mere og mere — en bedre CPU holder 2-3 år længere.`;
  } else {
    lossAversionPitch = `Mange fortryder at spare de sidste penge, når computeren efter 6 måneder begynder at føles langsom. Denne opgradering sikrer den gode oplevelse i hele computerens levetid.`;
  }

  // Future Proofing Pitch
  let futureProofingPitch: string;
  if (topRam >= 32) {
    futureProofingPitch = `32GB RAM er fremtidssikret de næste 5+ år. AI-værktøjer som Copilot kræver mere hukommelse — denne computer er klar til fremtiden.`;
  } else if ((topPick.specs.cpuTier || 0) >= 8) {
    futureProofingPitch = `Denne processor er i den nyeste generation og understøtter alle de nye AI-funktioner der kommer i Windows. Den holder nemt 4-5 år frem.`;
  } else {
    futureProofingPitch = `Denne konfiguration er byglet med nyere komponenter der holder 2-3 år længere end den billigere model. Det er billigere end at skulle købe ny computer om 2 år.`;
  }

  // Objection Handlers
  const objectionHandlers = [
    {
      objection: "Det er for dyrt",
      response: `Regnet per dag over 3 år er det kun ${dailyCost} kr. En kaffe koster 40 kr — og du bruger computeren 8+ timer dagligt.`
    },
    {
      objection: "Jeg behøver ikke noget så kraftigt",
      response: `De fleste siger det samme — indtil Chrome med 10 faner og Teams begynder at hakke. Med denne spec er du fremtidssikret.`
    },
    {
      objection: "Kan jeg ikke bare opgradere senere?",
      response: `Langt de fleste laptops kan ikke opgraderes efter køb. RAM og CPU er loddet fast på moderne maskiner — det er nu eller aldrig.`
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
  // Try OpenAI first if API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      
      const prompt = `Du er en erfaren sælger hos Power.dk. Generer kortfattede, overbevisende salgsargumenter på DANSK.

KUNDENS VALG:
- ${input.mainProduct.name}
- Pris: ${input.mainProduct.price} kr
- CPU: ${input.mainProduct.specs.cpu || "ukendt"} (Tier ${input.mainProduct.specs.cpuTier || "?"})
- RAM: ${input.mainProduct.specs.ramGB || "?"}GB
- Lager: ${input.mainProduct.specs.storageGB || "?"}GB

DIT FORSLAG (høj avance for Power):
- ${input.topPick.name}
- Pris: ${input.topPick.price} kr (forskel: ${input.topPick.priceDifference} kr)
- CPU: ${input.topPick.specs.cpu || "ukendt"} (Tier ${input.topPick.specs.cpuTier || "?"})
- RAM: ${input.topPick.specs.ramGB || "?"}GB
- Lager: ${input.topPick.specs.storageGB || "?"}GB

Generer JSON med disse felter:
1. valuePitch: Hvorfor det er pengene værd (max 2 sætninger, nævn specifik pris per dag)
2. lossAversionPitch: Hvad der går galt med den billige (max 2 sætninger, vær specifik)
3. futureProofingPitch: Hvorfor det holder længere (max 2 sætninger)
4. objectionHandlers: 3 korte svar på typiske indvendinger

Hold det kort, konkret og sælgende. Brug danske kroner og daglige sammenligninger.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          ...parsed,
          isAiGenerated: true
        };
      }
    } catch (error) {
      console.warn("OpenAI pitch generation failed, falling back to deterministic:", error);
    }
  }

  // Fallback to deterministic generation
  return generateDeterministicPitch(input);
}

export { generateDeterministicPitch };
