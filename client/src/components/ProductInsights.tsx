import { useQuery } from "@tanstack/react-query";
import { Shield, TrendingUp, TrendingDown, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductInsightsProps {
  productId: string;
}

interface Insight {
  score: number;
  verdict: string;
  pros: string[];
  cons: string[];
  pricePerRamGB: number;
  pricePerStorageGB: number;
  cpuValueScore: number;
  recommendation: "excellent" | "good" | "average" | "poor";
}

export function ProductInsights({ productId }: ProductInsightsProps) {
  const { data: insight, isLoading } = useQuery<Insight>({
    queryKey: [`/api/insights/${productId}`],
    enabled: !!productId,
    staleTime: 300000, // 5 min cache
  });

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-4 h-32" />
    );
  }

  if (!insight) return null;

  const scoreColor = 
    insight.recommendation === "excellent" ? "from-emerald-500 to-green-400" :
    insight.recommendation === "good" ? "from-blue-500 to-cyan-400" :
    insight.recommendation === "average" ? "from-amber-500 to-yellow-400" :
    "from-red-500 to-rose-400";

  const scoreBg =
    insight.recommendation === "excellent" ? "bg-emerald-500/10 border-emerald-500/20" :
    insight.recommendation === "good" ? "bg-blue-500/10 border-blue-500/20" :
    insight.recommendation === "average" ? "bg-amber-500/10 border-amber-500/20" :
    "bg-red-500/10 border-red-500/20";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header with score */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-bold text-foreground">AI Produktanalyse</span>
          </div>
          <div className={cn("px-3 py-1 rounded-full border text-xs font-bold", scoreBg)}>
            Score: {insight.score}/100
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-4 pt-3">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", scoreColor)}
            style={{ width: `${insight.score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{insight.verdict}</p>
      </div>

      {/* Pros & Cons */}
      <div className="p-4 grid gap-3">
        {insight.pros.length > 0 && (
          <div className="space-y-1.5">
            {insight.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs text-foreground/90">{pro}</span>
              </div>
            ))}
          </div>
        )}
        {insight.cons.length > 0 && (
          <div className="space-y-1.5">
            {insight.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                <span className="text-xs text-foreground/90">{con}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value metrics */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <div className="text-[10px] text-muted-foreground">Pris/GB RAM</div>
          <div className="text-sm font-bold text-foreground">{insight.pricePerRamGB} kr</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <div className="text-[10px] text-muted-foreground">CPU Værdi</div>
          <div className="text-sm font-bold text-foreground">{insight.cpuValueScore}</div>
        </div>
      </div>
    </div>
  );
}
