// Copilot Readiness Score v1
// Scorer laptops på hvor klar de er til AI/Copilot+ features
// Kriterier: NPU, RAM, CPU generation, Windows 11 support

interface CopilotScore {
  score: number;        // 0-100
  tier: 'basic' | 'ready' | 'copilot+' | 'ai-pro';
  badges: string[];
  explanation: string;
}

interface LaptopSpecs {
  cpu?: string;
  cpuTier?: number;
  ramGB?: number;
  storageGB?: number;
  gpu?: string;
  gpuTier?: number;
  features?: string[];
}

export function calculateCopilotReadiness(specs: LaptopSpecs): CopilotScore {
  let score = 0;
  const badges: string[] = [];
  const reasons: string[] = [];

  const cpu = (specs.cpu || '').toLowerCase();
  const ramGB = specs.ramGB || 0;
  const cpuTier = specs.cpuTier || 0;
  const gpuTier = specs.gpuTier || 0;
  const features = specs.features || [];

  // === RAM (max 30 points) ===
  if (ramGB >= 32) {
    score += 30;
    badges.push('32GB+ RAM');
    reasons.push('Masser af RAM til AI-modeller');
  } else if (ramGB >= 16) {
    score += 20;
    badges.push('16GB RAM');
    reasons.push('Godt grundlag for AI-opgaver');
  } else if (ramGB >= 8) {
    score += 10;
    reasons.push('Basis RAM — begrænset AI-ydeevne');
  } else {
    score += 0;
    reasons.push('For lidt RAM til seriøst AI-arbejde');
  }

  // === NPU Detection (max 25 points) ===
  const hasNPU = /snapdragon\s+x\s*(elite|plus)/i.test(cpu) ||
                 /core\s+ultra/i.test(cpu) ||
                 /ryzen\s+ai/i.test(cpu) ||
                 features.some(f => /copilot|npu|ai\s*engine/i.test(f));

  if (hasNPU) {
    score += 25;
    badges.push('NPU');
    reasons.push('Dedikeret AI-processor (NPU) til Copilot+');
  }

  // === CPU Generation (max 25 points) ===
  // Nyeste generationer er bedst til AI
  if (/snapdragon\s+x\s*elite/i.test(cpu)) {
    score += 25;
    badges.push('Snapdragon X Elite');
  } else if (/apple\s+m[34]\s*(pro|max|ultra)/i.test(cpu)) {
    score += 25;
    badges.push('Apple Silicon Pro');
  } else if (/core\s+ultra\s+[79]/i.test(cpu) || /ryzen\s+ai\s+9/i.test(cpu)) {
    score += 23;
    badges.push('Nyeste CPU gen');
  } else if (/core\s+ultra\s+5/i.test(cpu) || /ryzen\s+ai\s+7/i.test(cpu)) {
    score += 20;
  } else if (/apple\s+m[34]/i.test(cpu)) {
    score += 20;
    badges.push('Apple M3/M4');
  } else if (cpuTier >= 8) {
    score += 15; // Høj tier men ikke nyeste gen
  } else if (cpuTier >= 6) {
    score += 10;
  } else if (cpuTier >= 4) {
    score += 5;
  }

  // === GPU (max 15 points) — til AI/ML arbejde ===
  if (gpuTier >= 7) {
    score += 15;
    badges.push('Kraftigt GPU');
    reasons.push('RTX 4070+ — kørende lokale AI-modeller');
  } else if (gpuTier >= 5) {
    score += 10;
    badges.push('Dedikeret GPU');
  } else if (gpuTier >= 3) {
    score += 5;
  }

  // === Copilot+ PC badge (bonus 5 points) ===
  const isCopilotPlus = hasNPU && ramGB >= 16 && cpuTier >= 6;
  if (isCopilotPlus) {
    score += 5;
    badges.push('Copilot+ PC');
  }

  // Cap at 100
  score = Math.min(100, score);

  // Determine tier
  let tier: CopilotScore['tier'];
  if (score >= 85) tier = 'ai-pro';
  else if (score >= 60) tier = 'copilot+';
  else if (score >= 35) tier = 'ready';
  else tier = 'basic';

  // Tier labels
  const tierLabels = {
    'basic': 'Basis',
    'ready': 'AI-klar',
    'copilot+': 'Copilot+',
    'ai-pro': 'AI Pro'
  };

  const explanation = reasons.join('. ') + `. Score: ${score}/100 (${tierLabels[tier]})`;

  return { score, tier, badges, explanation };
}

// Generer salgsargument baseret på Copilot score
export function generateCopilotPitch(score: CopilotScore, priceDiff: number): string {
  if (score.tier === 'ai-pro') {
    return `Denne computer er AI Pro-certificeret med ${score.badges.join(' + ')}. Klar til alle fremtidige Copilot-funktioner og lokale AI-modeller.`;
  }
  if (score.tier === 'copilot+') {
    return `Copilot+ PC med dedikeret NPU. Microsofts nye AI-funktioner kræver præcis denne type hardware — du er fremtidssikret.`;
  }
  if (score.tier === 'ready') {
    return `AI-klar computer der håndterer Copilot og AI-værktøjer fint. ${priceDiff > 0 ? `For ${Math.round(priceDiff / 36)} kr/md ekstra får du meget mere AI-kraft.` : ''}`;
  }
  return `Basis computer — fint til almindeligt arbejde, men begrænset til AI-funktioner. Overvej opgradering hvis AI bliver vigtigt.`;
}
