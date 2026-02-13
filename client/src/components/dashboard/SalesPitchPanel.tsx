import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Trophy, Target, Sparkles, AlertCircle, ChevronRight, MessageCircle } from "lucide-react";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";
import { cn } from "@/lib/utils";

interface SalesPitchPanelProps {
    mainProduct: ProductWithMargin;
    topPick: ProductWithMargin;
}

export function SalesPitchPanel({ mainProduct, topPick }: SalesPitchPanelProps) {
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeObjection, setActiveObjection] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!mainProduct?.id || !topPick?.id) return;

            setIsLoading(true);
            try {
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

    const objections = [
        {
            id: "price",
            trigger: "For dyr",
            response: `Regnet per dag over 3 år er det kun ${Math.round((topPick.priceDifference || 0) / 1095)} kr ekstra for en markant bedre oplevelse.`
        },
        {
            id: "need",
            trigger: "Behøver ikke",
            response: "De fleste siger det - indtil de opdager at Chrome og tunge hjemmesider hurtigt sluger al memory på den billige model."
        }
    ];

    return (
        <section
            aria-label="Salgsargumenter"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:shadow-primary/5 hover:border-primary/20"
        >
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 -z-10 h-[200px] w-[200px] bg-primary/20 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700" />

            <div className="p-5 space-y-6">
                {/* HEADER AREA */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5">
                            <Trophy className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
                                SÆLGER SCRIPTS
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-primary to-purple-600 text-white shadow-sm">AI POWERED</span>
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium">Overbevis kunden med data</p>
                        </div>
                    </div>

                    {/* STATUS BADGES */}
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold shadow-sm backdrop-blur-md">
                            <CheckCircle2 className="h-3 w-3" />
                            På lager
                        </div>
                        {topPick.isHighMargin && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold shadow-sm backdrop-blur-md animate-pulse">
                                <Flame className="h-3 w-3" />
                                High Margin
                            </div>
                        )}
                    </div>
                </div>

                {/* PRICE ANCHORING - VISUALIZED */}
                {topPick.originalPrice && topPick.originalPrice > topPick.price && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent p-3 border border-green-500/10">
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Normalpris</span>
                                <span className="text-xs font-mono text-muted-foreground line-through decoration-red-400/50">{formatPrice(topPick.originalPrice)}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-border/50 mx-2"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider animate-pulse">Du sparer kunden</span>
                                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                                    {formatPrice(topPick.originalPrice - topPick.price)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI PITCH CONTENT */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-300">Power.dk Analyse</span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-2 animate-pulse p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                            <div className="h-2 w-full bg-white/10 rounded"></div>
                            <div className="h-2 w-5/6 bg-white/10 rounded"></div>
                        </div>
                    ) : aiSummary ? (
                        <div className="relative p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-purple-500/30 transition-colors group/summary">
                            <div
                                className="prose prose-invert prose-sm max-w-none text-xs text-muted-foreground leading-relaxed [&>p]:mb-2 [&>strong]:text-foreground [&>strong]:font-bold"
                                dangerouslySetInnerHTML={{ __html: aiSummary }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-white/10 bg-white/5">
                            <AlertCircle className="h-5 w-5 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">Kunne ikke hente salgsscript.</p>
                        </div>
                    )}
                </div>

                {/* INTERACTIVE OBJECTION HANDLERS */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Indvendingsbehandling</span>
                    </div>
                    <div className="grid gap-2">
                        {objections.map((obj) => (
                            <button
                                key={obj.id}
                                onClick={() => setActiveObjection(activeObjection === obj.id ? null : obj.id)}
                                className={cn(
                                    "text-left w-full p-3 rounded-lg border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    activeObjection === obj.id
                                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]"
                                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                )}
                                aria-expanded={activeObjection === obj.id}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-xs font-bold transition-colors",
                                        activeObjection === obj.id ? "text-primary" : "text-red-300"
                                    )}>
                                        "{obj.trigger}"
                                    </span>
                                    <ChevronRight className={cn(
                                        "h-3 w-3 text-muted-foreground transition-transform duration-300",
                                        activeObjection === obj.id && "rotate-90 text-primary"
                                    )} />
                                </div>
                                <div className={cn(
                                    "grid transition-[grid-template-rows] duration-300 ease-out",
                                    activeObjection === obj.id ? "grid-rows-[1fr] mt-2 opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-foreground/90 italic leading-relaxed pl-2 border-l-2 border-primary/30">
                                            "{obj.response}"
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* BOTTOM CTA */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-0.5">
                    <div className="relative flex items-center justify-center gap-2 bg-background/40 backdrop-blur-sm p-2 rounded-[7px]">
                        <Target className="h-3.5 w-3.5 text-primary animate-bounce-subtle" />
                        <span className="text-[10px] font-bold text-foreground tracking-wide uppercase">
                            {topPick.isHighMargin ? 'Absolut bedste valg for butikken' : 'Solid opgradering for kunden'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
