import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Flame, Cpu, HardDrive, MemoryStick, Star, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/specExtractor";

interface AIAlternativesProps {
  product: {
    id: string;
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
}

interface AIAlternative {
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
  scores: {
    marginScore: number;
    upgradeScore: number;
    totalScore: number;
  };
}

export function AIAlternatives({ product }: AIAlternativesProps) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, refetch } = useQuery<{
    alternatives: AIAlternative[];
    count: number;
    aiGenerated: boolean;
  }>({
    queryKey: ["/api/ai-alternatives", product.id],
    queryFn: async () => {
      const res = await fetch("/api/ai-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            name: product.name,
            brand: product.brand,
            price: product.price,
            specs: product.specs
          },
          maxPrice: Math.max(product.price * 1.5, 3000)
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: expanded,
    staleTime: 600000, // 10 min cache
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 ring-1 ring-purple-500/20">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-foreground">AI Alternativer</span>
            <p className="text-[10px] text-muted-foreground">Hunter-alpha finder bedre høj-avance laptops</p>
          </div>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          expanded && "rotate-90"
        )} />
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              <span className="text-xs text-muted-foreground">AI finder alternativer...</span>
            </div>
          ) : data?.alternatives && data.alternatives.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                  🤖 {data.count} AI-genererede alternativer
                </span>
              </div>
              
              {data.alternatives.map((alt, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border transition-all hover:border-purple-500/30",
                    alt.isHighMargin 
                      ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  {/* Name & Price */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {alt.isHighMargin && (
                          <Flame className="h-3 w-3 text-amber-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-foreground">{alt.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{alt.brand}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{formatPrice(alt.estimatedPrice)}</div>
                      {alt.isHighMargin && (
                        <span className="text-[9px] text-amber-400 font-medium">{alt.marginReason}</span>
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="flex items-center gap-1 text-[10px]">
                      <Cpu className="h-3 w-3 text-blue-400" />
                      <span className="text-muted-foreground truncate">{alt.specs.cpu?.split(" ").slice(-1)[0] || "?"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <MemoryStick className="h-3 w-3 text-green-400" />
                      <span className="text-muted-foreground">{alt.specs.ramGB || "?"}GB</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <HardDrive className="h-3 w-3 text-purple-400" />
                      <span className="text-muted-foreground">{alt.specs.storageGB || "?"}GB</span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-[10px] text-muted-foreground italic border-l-2 border-purple-500/30 pl-2">
                    {alt.reasoning}
                  </p>

                  {/* Scores */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">Score: {alt.scores.totalScore}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400 font-medium">Margin: {alt.scores.marginScore}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground ml-auto">
                      {Math.round(alt.confidence * 100)}% sikker
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Ingen alternativer fundet</p>
              <button 
                onClick={() => refetch()}
                className="text-xs text-purple-400 hover:text-purple-300 mt-1"
              >
                Prøv igen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
