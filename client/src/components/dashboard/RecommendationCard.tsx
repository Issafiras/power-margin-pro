import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Sparkles, TrendingDown as TrendingDownIcon } from "lucide-react";
import type { ProductWithMargin } from "@shared/schema";
import { SalesPitchPanel } from "./SalesPitchPanel";
import { formatPrice } from "@/lib/specExtractor";

interface RecommendationCardProps {
    mainProduct: ProductWithMargin;
    topPick: ProductWithMargin;
}

export function RecommendationCard({ mainProduct, topPick }: RecommendationCardProps) {
    const [showComparison, setShowComparison] = useState(false);

    return (
        <Card className="mb-6 p-4 glass-card border-primary/20 animate-scale-in shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-shadow duration-500">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Badge className="badge-premium gap-1.5 px-3 py-1 text-sm shadow-lg shadow-orange-500/20 animate-glow">
                        <TrendingUp className="h-4 w-4" />
                        Hurtig Anbefaling
                    </Badge>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        Skift fra <span className="text-foreground font-medium border-b border-transparent hover:border-foreground/20 transition-colors">{mainProduct.brand}</span> til{" "}
                        <span className="text-primary font-bold border-b border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">{topPick.brand} {topPick.name}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Merpris</p>
                        <p className={`text-base font-bold tabular-nums ${(topPick.priceDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {(topPick.priceDifference || 0) > 0 ? '+' : ''}{formatPrice(topPick.priceDifference || 0)}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="gap-2 transition-all hover:gap-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        variant="outline"
                        onClick={() => setShowComparison(!showComparison)}
                    >
                        {showComparison ? 'Skjul' : 'Sammenlign'}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {showComparison && (
                <div className="mt-6 pt-6 border-t border-white/5 animate-slide-up">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6 px-4">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Kundens Valg</p>
                            <div className="h-1 w-12 bg-muted mx-auto rounded-full" />
                        </div>
                        <div className="w-8" />
                        <div className="text-center">
                            <p className="text-[10px] text-primary uppercase tracking-widest flex items-center justify-center gap-1.5 font-bold mb-1">
                                <Sparkles className="h-3 w-3" />
                                Anbefalet
                            </p>
                            <div className="h-1 w-12 bg-primary mx-auto rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                        </div>
                    </div>

                    <div className="space-y-3 px-2">
                        {/* Pris */}
                        <ComparisonRow
                            label="Pris"
                            leftValue={<span className="text-lg font-bold">{formatPrice(mainProduct.price)}</span>}
                            rightValue={
                                <div>
                                    <p className="text-lg font-bold text-primary">{formatPrice(topPick.price)}</p>
                                    <p className={`text-[10px] font-semibold ${(topPick.priceDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {(topPick.priceDifference || 0) > 0 ? '+' : ''}{formatPrice(topPick.priceDifference || 0)}
                                    </p>
                                </div>
                            }
                            diffIcon={
                                <ArrowRight className={`h-4 w-4 ${(topPick.priceDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`} />
                            }
                            highlightRight
                        />

                        {/* RAM */}
                        <SpecComparisonRow
                            label="RAM"
                            leftValue={mainProduct.specs?.ram}
                            rightValue={topPick.specs?.ram}
                            leftNumeric={mainProduct.specs?.ramGB}
                            rightNumeric={topPick.specs?.ramGB}
                        />

                        {/* CPU */}
                        <SpecComparisonRow
                            label="CPU"
                            leftValue={mainProduct.specs?.cpu}
                            rightValue={topPick.specs?.cpu}
                            leftNumeric={mainProduct.specs?.cpuTier}
                            rightNumeric={topPick.specs?.cpuTier}
                            truncate
                        />

                        {/* Storage */}
                        <SpecComparisonRow
                            label="Lager"
                            leftValue={mainProduct.specs?.storage}
                            rightValue={topPick.specs?.storage}
                            leftNumeric={mainProduct.specs?.storageGB}
                            rightNumeric={topPick.specs?.storageGB}
                        />

                        {/* GPU */}
                        <SpecComparisonRow
                            label="Grafik"
                            leftValue={mainProduct.specs?.gpu || 'Integreret'}
                            rightValue={topPick.specs?.gpu || 'Integreret'}
                            leftNumeric={mainProduct.specs?.gpuTier}
                            rightNumeric={topPick.specs?.gpuTier}
                            truncate
                            highlightColor="orange"
                        />

                        {/* Screen Type */}
                        {(mainProduct.specs?.screenType || topPick.specs?.screenType) && (
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center group hover:bg-white/[0.02] rounded-lg transition-colors p-1">
                                <div className={`p-3 rounded-xl text-center transition-colors ${topPick.specs?.screenType === 'OLED' ? 'bg-muted/20' : (mainProduct.specs?.screenType === 'OLED' ? 'bg-purple-500/10 border border-purple-500/20 shadow-inner' : 'bg-muted/20')}`}>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Skærm</p>
                                    <p className="text-xs font-medium">{mainProduct.specs?.screenType || '—'}</p>
                                </div>
                                <div className="flex items-center justify-center w-8">
                                    {topPick.specs?.screenType === 'OLED' && mainProduct.specs?.screenType !== 'OLED' ? (
                                        <TrendingUp className="h-4 w-4 text-purple-400 animate-bounce" />
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground opacity-20">=</span>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl text-center transition-colors ${topPick.specs?.screenType === 'OLED' ? 'bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-muted/20'}`}>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Skærm</p>
                                    <p className="text-xs font-medium">{topPick.specs?.screenType || '—'}</p>
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        {(topPick.specs?.features && topPick.specs.features.length > 0) && (
                            <div className="pt-4 border-t border-white/5 mt-4">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 text-center font-medium">Nøgle Features</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {topPick.specs.features.slice(0, 5).map((feature: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-[10px] px-2 py-1 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary-foreground transition-colors">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <SalesPitchPanel mainProduct={mainProduct} topPick={topPick} />

                        {topPick.upgradeReason && (
                            <div className="pt-4 text-center animate-fade-in delay-200">
                                <Badge className="badge-premium text-xs gap-1.5 px-3 py-1 shadow-lg shadow-orange-500/10">
                                    <Sparkles className="h-3 w-3" />
                                    {topPick.upgradeReason}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}

function ComparisonRow({ label, leftValue, rightValue, diffIcon, highlightRight }: any) {
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center group hover:bg-white/[0.02] rounded-lg transition-colors p-1">
            <div className="p-3 rounded-xl bg-muted/20 text-center border border-transparent">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <div className="text-foreground">{leftValue}</div>
            </div>
            <div className="flex items-center justify-center w-8">{diffIcon}</div>
            <div className={`p-3 rounded-xl text-center border ${highlightRight ? 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-muted/20 border-transparent'}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <div>{rightValue}</div>
            </div>
        </div>
    );
}

function SpecComparisonRow({ label, leftValue, rightValue, leftNumeric, rightNumeric, truncate, highlightColor = 'green' }: any) {
    if (!leftValue && !rightValue) return null;

    const isBetter = (rightNumeric || 0) > (leftNumeric || 0);
    const isWorse = (rightNumeric || 0) < (leftNumeric || 0);

    const highlightClass = isBetter
        ? (highlightColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400')
        : 'bg-muted/20 text-muted-foreground'; // Better logic: if main is better, show main as better? Or just muted.

    // Actually, usually we highlight the RIGHT side if it's better. If LEFT is better, we might want to highlight LEFT or show RIGHT as worse.
    // The original implementation highlighted the BETTER one.

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center group hover:bg-white/[0.02] rounded-lg transition-colors p-1">
            <div className={`p-3 rounded-xl text-center border transition-all duration-300 ${!isBetter && !isWorse ? 'bg-muted/20 border-transparent' : (isWorse ? (highlightColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]') : 'bg-muted/20 border-transparent opacity-70')}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-semibold  ${truncate ? 'line-clamp-1' : ''}`}>{leftValue || '—'}</p>
            </div>

            <div className="flex items-center justify-center w-8">
                {isBetter ? (
                    <TrendingUp className={`h-4 w-4 ${highlightColor === 'orange' ? 'text-orange-400' : 'text-green-400'} animate-bounce`} />
                ) : isWorse ? (
                    <TrendingDownIcon className="h-4 w-4 text-red-400" />
                ) : (
                    <span className="text-[10px] text-muted-foreground opacity-20 font-mono">=</span>
                )}
            </div>

            <div className={`p-3 rounded-xl text-center border transition-all duration-300 ${isBetter ? (highlightColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]') : 'bg-muted/20 border-transparent opacity-70'}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${truncate ? 'line-clamp-1' : ''}`}>{rightValue || '—'}</p>
            </div>
        </div>
    );
}
