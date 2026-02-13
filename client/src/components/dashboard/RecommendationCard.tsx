import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Sparkles, TrendingDown as TrendingDownIcon, ChevronDown, ChevronUp } from "lucide-react";
import type { ProductWithMargin } from "@shared/schema";
import { SalesPitchPanel } from "./SalesPitchPanel";
import { formatPrice } from "@/lib/specExtractor";
import { motion, AnimatePresence } from "framer-motion";

interface RecommendationCardProps {
    mainProduct: ProductWithMargin;
    topPick: ProductWithMargin;
}

export function RecommendationCard({ mainProduct, topPick }: RecommendationCardProps) {
    const [showComparison, setShowComparison] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="mb-8 p-0 overflow-hidden border border-primary/20 bg-gradient-to-br from-[#1a1f35]/90 to-[#0f1219]/95 backdrop-blur-2xl shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.2)] transition-shadow duration-500 rounded-3xl group">
                {/* Decorative Top Line */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <Badge className="badge-premium gap-1.5 px-4 py-1.5 text-xs font-bold tracking-wide shadow-lg shadow-orange-500/20 animate-glow w-fit">
                                <TrendingUp className="h-3.5 w-3.5" />
                                POWER ANBEFALING
                            </Badge>

                            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                                Opgrader kunden fra <span className="font-semibold text-foreground border-b border-white/10 pb-0.5">{mainProduct.brand}</span> til{" "}
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500 filter drop-shadow-sm cursor-pointer hover:underline decoration-primary/30 underline-offset-4 decoration-2 transition-all">
                                    {topPick.brand} {topPick.name}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 ml-auto bg-white/[0.03] p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Merpris</p>
                                <motion.p
                                    className={`text-xl font-black tabular-nums ${(topPick.priceDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}
                                    key={topPick.priceDifference}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    {(topPick.priceDifference || 0) > 0 ? '+' : ''}{formatPrice(topPick.priceDifference || 0)}
                                </motion.p>
                            </div>
                            <Button
                                size="lg"
                                className={`gap-2 transition-all duration-300 rounded-xl font-bold ${showComparison ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]'}`}
                                onClick={() => setShowComparison(!showComparison)}
                            >
                                {showComparison ? 'Skjul Sammenligning' : 'Se Sammenligning'}
                                {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showComparison && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="bg-black/20 border-t border-white/5"
                        >
                            <div className="p-6 md:p-8 space-y-8 animate-slide-up">
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center px-4 max-w-5xl mx-auto">
                                    <div className="text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2">Nuværende Valg</p>
                                        <div className="h-0.5 w-16 bg-white/10 mx-auto rounded-full" />
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <span className="text-xs font-mono text-muted-foreground">VS</span>
                                    </div>
                                    <div className="text-center relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/20 rounded text-[9px] font-bold text-primary animate-pulse">BEDST</div>
                                        <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mb-2 flex items-center justify-center gap-2">
                                            <Sparkles className="h-3 w-3" />
                                            Anbefalet
                                        </p>
                                        <div className="h-0.5 w-16 bg-primary mx-auto rounded-full shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
                                    </div>
                                </div>

                                <div className="space-y-3 max-w-5xl mx-auto">
                                    {/* Pris Row */}
                                    <ComparisonRow
                                        label="Pris"
                                        leftValue={<span className="text-lg font-bold text-foreground/80">{formatPrice(mainProduct.price)}</span>}
                                        rightValue={
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-primary filter drop-shadow-[0_0_5px_rgba(249,115,22,0.3)]">{formatPrice(topPick.price)}</span>
                                            </div>
                                        }
                                        diffIcon={<ArrowRight className="h-4 w-4 text-muted-foreground/30" />}
                                        highlightRight
                                    />

                                    {/* Spec Rows */}
                                    <SpecComparisonRow label="RAM" mainSpec={mainProduct.specs} topSpec={topPick.specs} field="ram" numericField="ramGB" icon={Sparkles} />
                                    <SpecComparisonRow label="Processor" mainSpec={mainProduct.specs} topSpec={topPick.specs} field="cpu" numericField="cpuTier" truncate />
                                    <SpecComparisonRow label="Lagerplads" mainSpec={mainProduct.specs} topSpec={topPick.specs} field="storage" numericField="storageGB" />
                                    <SpecComparisonRow label="Grafikkort" mainSpec={mainProduct.specs} topSpec={topPick.specs} field="gpu" numericField="gpuTier" highlightColor="orange" truncate />

                                    {/* Screen Type */}
                                    {(mainProduct.specs?.screenType || topPick.specs?.screenType) && (
                                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center group hover:bg-white/[0.02] rounded-xl transition-colors p-2">
                                            <div className={`p-4 rounded-xl text-center transition-all bg-white/[0.02] border border-transparent`}>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">Skærm</p>
                                                <p className="text-sm font-medium">{mainProduct.specs?.screenType || '—'}</p>
                                            </div>
                                            <div className="flex justify-center opacity-20"><ArrowRight className="h-4 w-4" /></div>
                                            <div className={`p-4 rounded-xl text-center transition-all ${topPick.specs?.screenType === 'OLED' ? 'bg-purple-500/10 border border-purple-500/30 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]' : 'bg-white/[0.02] border-transparent'}`}>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">Skærm</p>
                                                <p className={`text-sm font-bold ${topPick.specs?.screenType === 'OLED' ? 'text-purple-300' : ''}`}>{topPick.specs?.screenType || '—'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-6 border-t border-white/5">
                                    {/* Sales Pitch */}
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Salgsargumenter</p>
                                        <SalesPitchPanel mainProduct={mainProduct} topPick={topPick} />
                                    </div>

                                    {/* Features & Upgrade Reason */}
                                    <div className="space-y-6 flex flex-col justify-center">
                                        {topPick.upgradeReason && (
                                            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500">
                                                <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">Hvorfor opgradere?</p>
                                                <p className="text-sm font-medium italic text-foreground/90">"{topPick.upgradeReason}"</p>
                                            </div>
                                        )}

                                        {(topPick.specs?.features && topPick.specs.features.length > 0) && (
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-3">Nøgle Features</p>
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {topPick.specs.features.slice(0, 6).map((feature: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all">
                                                            {feature}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}

function ComparisonRow({ label, leftValue, rightValue, diffIcon, highlightRight }: any) {
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center group hover:bg-white/[0.02] rounded-xl transition-colors p-2">
            <div className="p-4 rounded-xl bg-white/[0.02] text-center border border-transparent group-hover:border-white/5 transition-colors">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">{label}</p>
                <div className="text-foreground">{leftValue}</div>
            </div>
            <div className="flex items-center justify-center w-8 opacity-50">{diffIcon}</div>
            <div className={`p-4 rounded-xl text-center border transition-all duration-300 ${highlightRight ? 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]' : 'bg-white/[0.02] border-transparent'}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">{label}</p>
                <div>{rightValue}</div>
            </div>
        </div>
    );
}

function SpecComparisonRow({ label, mainSpec, topSpec, field, numericField, truncate, highlightColor = 'green', icon: Icon }: any) {
    const leftValue = mainSpec?.[field];
    const rightValue = topSpec?.[field];
    const leftNumeric = mainSpec?.[numericField];
    const rightNumeric = topSpec?.[numericField];

    if (!leftValue && !rightValue) return null;

    const isBetter = (rightNumeric || 0) > (leftNumeric || 0);
    const isWorse = (rightNumeric || 0) < (leftNumeric || 0);

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center group hover:bg-white/[0.02] rounded-xl transition-colors p-2">
            <div className={`p-4 rounded-xl text-center border transition-all duration-300 ${!isBetter && !isWorse ? 'bg-white/[0.02] border-transparent' : (isWorse ? (highlightColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]' : 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] scale-[1.02]') : 'bg-white/[0.02] border-transparent opacity-70')}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">{label}</p>
                <p className={`text-sm font-semibold  ${truncate ? 'line-clamp-1' : ''}`}>{leftValue || '—'}</p>
            </div>

            <div className="flex items-center justify-center w-8">
                {isBetter ? (
                    <TrendingUp className={`h-5 w-5 ${highlightColor === 'orange' ? 'text-orange-400' : 'text-green-400'} animate-bounce`} />
                ) : isWorse ? (
                    <TrendingDownIcon className="h-5 w-5 text-red-400" />
                ) : (
                    <span className="text-xs text-muted-foreground opacity-20 font-mono">=</span>
                )}
            </div>

            <div className={`p-4 rounded-xl text-center border transition-all duration-300 ${isBetter ? (highlightColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]' : 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] scale-[1.02]') : 'bg-white/[0.02] border-transparent opacity-70'}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 opacity-60">{label}</p>
                <p className={`text-sm font-semibold ${truncate ? 'line-clamp-1' : ''}`}>{rightValue || '—'}</p>
            </div>
        </div>
    );
}
