import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Gift, AlertTriangle, Shield, Trophy, Target } from "lucide-react";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

interface SalesPitchPanelProps {
    mainProduct: ProductWithMargin;
    topPick: ProductWithMargin;
}

export function SalesPitchPanel({ mainProduct, topPick }: SalesPitchPanelProps) {
    // State for AI pitches
    const [aiPitches, setAiPitches] = useState<{ valuePitch?: string; lossAversionPitch?: string; futureProofingPitch?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch AI pitches on mount
    useEffect(() => {
        const fetchPitches = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/generate-pitch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mainProduct, topPick }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setAiPitches(data);
                } else {
                    // Fallback to static logic on error (e.g. no key)
                    console.warn("AI Pitch generation failed, using fallback");
                }
            } catch (e) {
                console.error("AI Pitch fetch error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPitches();
    }, [mainProduct.id, topPick.id]); // Re-fetch if products change

    // Logic for Value Pitch (Fallback)
    const getValuePitch = () => {
        if (aiPitches?.valuePitch) return aiPitches.valuePitch;

        const priceDiff = topPick.priceDifference || 0;
        const dailyCost = Math.round(priceDiff / 365);
        const upgrades: string[] = [];

        if ((topPick.specs?.ramGB || 0) > (mainProduct.specs?.ramGB || 0)) {
            const ramDiff = (topPick.specs?.ramGB || 0) - (mainProduct.specs?.ramGB || 0);
            upgrades.push(`${ramDiff}GB ekstra RAM`);
        }
        if ((topPick.specs?.storageGB || 0) > (mainProduct.specs?.storageGB || 0)) {
            upgrades.push(`større SSD (${topPick.specs?.storage})`);
        }
        if ((topPick.specs?.cpuTier || 0) > (mainProduct.specs?.cpuTier || 0)) {
            upgrades.push('kraftigere processor');
        }

        const upgradeText = upgrades.slice(0, 2).join(' og ');
        if (priceDiff > 0 && priceDiff < 500) {
            return `For kun ${priceDiff} kr mere – mindre end en kop kaffe om dagen – får du ${upgradeText}. Det er en no-brainer!`;
        } else if (priceDiff > 0) {
            return `For ${dailyCost} kr om dagen i et år får du ${upgradeText || 'en meget bedre computer'}. Den investering tjener sig selv hjem i produktivitet!`;
        } else {
            return `Du SPARER ${Math.abs(priceDiff)} kr OG får ${upgradeText || 'bedre specs'}. Det er win-win!`;
        }
    };

    // Logic for Loss Aversion Pitch (Fallback)
    const getLossAversionPitch = () => {
        if (aiPitches?.lossAversionPitch) return aiPitches.lossAversionPitch;

        const issues: string[] = [];

        if ((mainProduct.specs?.ramGB || 0) < 16) {
            issues.push('8GB RAM bliver hurtigt for lidt med mange browser-tabs');
        }
        if ((mainProduct.specs?.storageGB || 0) < 512) {
            issues.push('Windows-opdateringer fylder mere og mere');
        }
        if ((mainProduct.specs?.cpuTier || 0) < 6) {
            issues.push('en budget-processor der føles langsom om 1-2 år');
        }

        if (issues.length === 0) {
            return 'Denne er faktisk et godt valg, men anbefalingen giver dig ekstra fremtidssikring!';
        }

        return `Mange kunder der vælger den billige model kommer tilbage og siger: '${issues[0]}'. Med anbefalingen undgår du den frustration.`;
    };

    // Logic for Future Proofing Pitch (Fallback)
    const getFutureProofingPitch = () => {
        if (aiPitches?.futureProofingPitch) return aiPitches.futureProofingPitch;

        const years = 5;
        const yearlyCost = Math.round((topPick.priceDifference || 0) / years);

        if ((topPick.specs?.ramGB || 0) >= 16 && (topPick.specs?.storageGB || 0) >= 512) {
            return `Med ${topPick.specs?.ram} RAM og ${topPick.specs?.storage} SSD holder denne computer ${years} år uden problemer. Det er kun ${yearlyCost > 0 ? yearlyCost + ' kr/år mere' : 'gratis opgradering'} for at undgå at købe ny om 2-3 år.`;
        }
        return `Denne computer er bygget til at holde ${years}+ år. Du slipper for at bekymre dig om udskiftning længe.`;
    };

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
                {/* Check if we have a Power.dk AI Summary (Scraped) */}
                {(aiPitches as any)?.source === "Power.dk" && (aiPitches?.valuePitch) ? (
                    <div className="bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg p-3 border-l-2 border-purple-500 hover:bg-purple-500/[0.15] transition-colors cursor-default">
                        <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                            <Flame className="h-3 w-3" />
                            Power.dk AI Sammenligning
                        </p>
                        <div className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-purple-500/20 pl-2 whitespace-pre-wrap">
                            {aiPitches.valuePitch}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Value Pitch */}
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent rounded-lg p-3 border-l-2 border-green-500 hover:bg-green-500/[0.15] transition-colors cursor-default">
                            <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                                <Gift className="h-3 w-3" />
                                Værdi-pitch
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-green-500/20 pl-2">
                                "{getValuePitch()}"
                            </p>
                        </div>

                        {/* Loss Aversion Pitch */}
                        <div className="bg-gradient-to-r from-red-500/10 to-transparent rounded-lg p-3 border-l-2 border-red-500 hover:bg-red-500/[0.15] transition-colors cursor-default">
                            <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                                <AlertTriangle className="h-3 w-3" />
                                Undgå-fortrydelse pitch
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-red-500/20 pl-2">
                                "{getLossAversionPitch()}"
                            </p>
                        </div>

                        {/* Future Proofing Pitch */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg p-3 border-l-2 border-blue-500 hover:bg-blue-500/[0.15] transition-colors cursor-default">
                            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                                <Shield className="h-3 w-3" />
                                Fremtidssikring pitch
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-blue-500/20 pl-2">
                                "{getFutureProofingPitch()}"
                            </p>
                        </div>
                    </>
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
