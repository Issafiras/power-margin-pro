import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Trophy, Target } from "lucide-react";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

interface SalesPitchPanelProps {
    mainProduct: ProductWithMargin;
    topPick: ProductWithMargin;
}

export function SalesPitchPanel({ mainProduct, topPick }: SalesPitchPanelProps) {
    // State for AI summary
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Power.dk AI Summary
    useEffect(() => {
        const fetchSummary = async () => {
            if (!mainProduct?.id || !topPick?.id) return;

            setIsLoading(true);
            try {
                // Use the new AI Compare Proxy
                const response = await fetch("/api/ai-compare", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: [mainProduct.id, topPick.id] }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setAiSummary(data.summary);
                } else {
                    console.warn("AI Summary fetch failed");
                }
            } catch (e) {
                console.error("AI Summary error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, [mainProduct.id, topPick.id]);


    return (
        <div className="pt-3 mt-2 border-t border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-4 space-y-4 animate-fade-in">

            {/* URGENCY + ANCHORING */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold animate-pulse shadow-sm shadow-green-500/10">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        På lager
                    </div>
                    {topPick.isHighMargin && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold shadow-sm shadow-amber-500/10">
                            <Flame className="h-3.5 w-3.5" />
                            Populær
                        </div>
                    )}
                </div>
                {/* ANCHORING */}
                {topPick.originalPrice && topPick.originalPrice > topPick.price && (
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground line-through font-mono">{formatPrice(topPick.originalPrice)}</p>
                        <p className="text-xs font-bold text-green-400">Spar {formatPrice(topPick.originalPrice - topPick.price)}!</p>
                    </div>
                )}
            </div>

            {/* HEADER */}
            <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-amber-400 drop-shadow-md" />
                <p className="text-[11px] text-primary uppercase tracking-[0.15em] font-bold">
                    Sælger Scripts
                </p>
            </div>

            {/* PITCHES */}
            <div className="space-y-3">
                {/* AI Generated Listing (replacing old pitches) */}
                {isLoading ? (
                    <div className="bg-white/5 rounded-lg p-3 animate-pulse">
                        <div className="h-2 w-3/4 bg-white/10 rounded mb-2"></div>
                        <div className="h-2 w-full bg-white/10 rounded mb-2"></div>
                        <div className="h-2 w-5/6 bg-white/10 rounded"></div>
                    </div>
                ) : aiSummary ? (
                    <div className="bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg p-3 border-l-2 border-purple-500 hover:bg-purple-500/[0.15] transition-colors cursor-default">
                        <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                            <Flame className="h-3 w-3" />
                            Power.dk Vurdering
                        </p>
                        <div
                            className="text-sm text-foreground/90 leading-relaxed border-l-2 border-purple-500/20 pl-2 prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-2"
                            dangerouslySetInnerHTML={{ __html: aiSummary }}
                        />
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground italic text-center p-2">
                        Kunne ikke hente salgsscript fra Power.dk
                    </div>
                )}
            </div>

            {/* QUICK OBJECTION HANDLERS */}
            <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-medium">Hvis kunden siger...</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex gap-2 items-center group">
                        <span className="text-red-400 font-medium whitespace-nowrap bg-red-400/10 px-1.5 py-0.5 rounded group-hover:bg-red-400/20 transition-colors">"For dyr"</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground/80 italic">"Regnet per dag over 3 år er det kun {Math.round((topPick.priceDifference || 0) / 1095)} kr ekstra"</span>
                    </div>
                    <div className="flex gap-2 items-center group">
                        <span className="text-red-400 font-medium whitespace-nowrap bg-red-400/10 px-1.5 py-0.5 rounded group-hover:bg-red-400/20 transition-colors">"Behøver ikke"</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground/80 italic">"De fleste siger det - indtil de opdager at Chrome sluger al RAM 😅"</span>
                    </div>
                </div>
            </div>

            {/* SKRIPT AFSLUTNING */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary/20 border border-primary/30 text-center mt-2 shadow-lg shadow-primary/5 animate-pulse-subtle">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary tracking-wide">
                    {topPick.isHighMargin ? '⭐ Sælger favorit!' : 'Godt alternativ til kunden'}
                </span>
            </div>
        </div>
    );
}
