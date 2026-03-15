import { useQuery } from "@tanstack/react-query";
import { Cpu, Zap, Brain, Bot, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotReadinessProps {
  specs: {
    cpu?: string;
    cpuTier?: number;
    ramGB?: number;
    storageGB?: number;
    gpu?: string;
    gpuTier?: number;
    features?: string[];
  };
  priceDiff?: number;
}

interface CopilotScore {
  score: number;
  tier: "basic" | "ready" | "copilot+" | "ai-pro";
  badges: string[];
  explanation: string;
  pitch: string;
}

async function fetchCopilotScore(specs: any, priceDiff?: number): Promise<CopilotScore> {
  const res = await fetch("/api/copilot-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specs, priceDiff }),
  });
  if (!res.ok) throw new Error("Failed to fetch copilot score");
  return res.json();
}

export function CopilotReadiness({ specs, priceDiff }: CopilotReadinessProps) {
  const { data: copilot, isLoading } = useQuery<CopilotScore>({
    queryKey: ["copilot-score", specs],
    queryFn: () => fetchCopilotScore(specs, priceDiff),
    enabled: !!specs?.cpu,
    staleTime: 600000, // 10 min cache
  });

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-4 h-32" />
    );
  }

  if (!copilot) return null;

  const tierConfig = {
    basic: {
      color: "from-gray-500 to-gray-400",
      bg: "bg-gray-500/10 border-gray-500/20",
      icon: <Cpu className="h-4 w-4" />,
      label: "Basis",
      emoji: "💻",
    },
    ready: {
      color: "from-blue-500 to-cyan-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      icon: <Zap className="h-4 w-4" />,
      label: "AI-klar",
      emoji: "⚡",
    },
    "copilot+": {
      color: "from-purple-500 to-violet-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      icon: <Bot className="h-4 w-4" />,
      label: "Copilot+",
      emoji: "🤖",
    },
    "ai-pro": {
      color: "from-emerald-500 to-green-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: <Brain className="h-4 w-4" />,
      label: "AI Pro",
      emoji: "🧠",
    },
  };

  const config = tierConfig[copilot.tier];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-bold text-foreground">Copilot Readiness</span>
          </div>
          <div className={cn("px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1", config.bg)}>
            {config.icon}
            {config.label}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black text-foreground">{copilot.score}</div>
          <div className="text-xs text-muted-foreground">/ 100</div>
          <div className="text-2xl ml-auto">{config.emoji}</div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", config.color)}
            style={{ width: `${copilot.score}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      {copilot.badges.length > 0 && (
        <div className="p-4 flex flex-wrap gap-1.5">
          {copilot.badges.map((badge, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-foreground/80"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* AI Pitch */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-3">
          <div className="flex items-start gap-2">
            <Star className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/80 leading-relaxed">{copilot.pitch}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
