import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Cpu, HardDrive, MemoryStick, Monitor, TrendingUp, TrendingDown,
    Minus, Star, Sparkles, ArrowRight, Flame, Eye, EyeOff
} from "lucide-react";
import { formatPrice } from "@/lib/specExtractor";
import type { ProductWithMargin } from "@shared/schema";
import { useState } from "react";

interface ComparisonViewProps {
    reference: ProductWithMargin;
    alternative: ProductWithMargin;
    onClose: () => void;
}

interface SpecComparison {
    label: string;
    icon: React.ReactNode;
    referenceValue: string | number | undefined;
    alternativeValue: string | number | undefined;
    referenceNumeric?: number;
    alternativeNumeric?: number;
    higherIsBetter: boolean;
}

function getComparisonStatus(
    refValue: number | undefined,
    altValue: number | undefined,
    higherIsBetter: boolean
): 'better' | 'worse' | 'same' | 'unknown' {
    if (refValue === undefined || altValue === undefined) return 'unknown';
    if (refValue === altValue) return 'same';
    if (higherIsBetter) {
        return altValue > refValue ? 'better' : 'worse';
    }
    return altValue < refValue ? 'better' : 'worse';
}

export function ComparisonView({ reference, alternative, onClose }: ComparisonViewProps) {
    const [showSellerView, setShowSellerView] = useState(true);

    const priceDiff = alternative.price - reference.price;
    const priceDiffPercent = ((priceDiff / reference.price) * 100).toFixed(1);

    // Calculate estimated margin boost (Cepter = 15%, 98/92 endings = 8%, normal = 3%)
    const getEstimatedMargin = (product: ProductWithMargin) => {
        if (product.brand?.toLowerCase() === 'cepter') return 15;
        const priceStr = Math.floor(product.price).toString();
        if (priceStr.endsWith('98') || priceStr.endsWith('92')) return 8;
        return 3;
    };

    const refMargin = getEstimatedMargin(reference);
    const altMargin = getEstimatedMargin(alternative);
    const marginBoost = altMargin - refMargin;

    // Estimated provision (simplified calculation)
    const estimatedProvision = (alternative.price * (altMargin / 100) * 0.1).toFixed(0);

    const specs: SpecComparison[] = [
        {
            label: "RAM",
            icon: <MemoryStick className="h-4 w-4" />,
            referenceValue: reference.specs?.ram || "Ukendt",
            alternativeValue: alternative.specs?.ram || "Ukendt",
            referenceNumeric: reference.specs?.ramGB,
            alternativeNumeric: alternative.specs?.ramGB,
            higherIsBetter: true,
        },
        {
            label: "Lager",
            icon: <HardDrive className="h-4 w-4" />,
            referenceValue: reference.specs?.storage || "Ukendt",
            alternativeValue: alternative.specs?.storage || "Ukendt",
            referenceNumeric: reference.specs?.storageGB,
            alternativeNumeric: alternative.specs?.storageGB,
            higherIsBetter: true,
        },
        {
            label: "Processor",
            icon: <Cpu className="h-4 w-4" />,
            referenceValue: reference.specs?.cpu || "Ukendt",
            alternativeValue: alternative.specs?.cpu || "Ukendt",
            referenceNumeric: reference.specs?.cpuTier,
            alternativeNumeric: alternative.specs?.cpuTier,
            higherIsBetter: true,
        },
        {
            label: "Grafik",
            icon: <Monitor className="h-4 w-4" />,
            referenceValue: reference.specs?.gpu || "Integreret",
            alternativeValue: alternative.specs?.gpu || "Integreret",
            referenceNumeric: reference.specs?.gpuTier,
            alternativeNumeric: alternative.specs?.gpuTier,
            higherIsBetter: true,
        },
    ];

    // Generate sales pitch focusing on POSITIVE differences only
    const generateSalesPitch = () => {
        const improvements: string[] = [];

        if ((alternative.specs?.ramGB || 0) > (reference.specs?.ramGB || 0)) {
            const diff = (alternative.specs?.ramGB || 0) - (reference.specs?.ramGB || 0);
            improvements.push(`${diff} GB mere RAM til multitasking`);
        }
        if ((alternative.specs?.storageGB || 0) > (reference.specs?.storageGB || 0)) {
            improvements.push(`større lagerplads til alle dine filer`);
        }
        if ((alternative.specs?.cpuTier || 0) > (reference.specs?.cpuTier || 0)) {
            improvements.push(`hurtigere processor`);
        }
        if ((alternative.specs?.gpuTier || 0) > (reference.specs?.gpuTier || 0)) {
            improvements.push(`bedre grafik til gaming og video`);
        }

        if (improvements.length === 0) {
            return "Et godt alternativ til samme prisklasse!";
        }

        if (priceDiff > 0) {
            return `Til kun ${formatPrice(priceDiff)} mere får du ${improvements.join(", ")}.`;
        } else if (priceDiff < 0) {
            return `Spar ${formatPrice(Math.abs(priceDiff))} og få stadig ${improvements.join(", ")}!`;
        }
        return `Med denne får du ${improvements.join(", ")}.`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with seller toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">Sammenligning</h2>
                    {alternative.isHighMargin && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Anbefales
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSellerView(!showSellerView)}
                        className="text-slate-400 hover:text-white"
                    >
                        {showSellerView ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showSellerView ? "Skjul Sælger Info" : "Vis Sælger Info"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Luk
                    </Button>
                </div>
            </div>

            {/* Quality info bar */}
            {showSellerView && (
                <Card className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border-blue-500/30 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-400" />
                                <span className="text-sm text-slate-300">Kvalitetsscore:</span>
                                <span className="font-bold text-blue-400">{Math.round(alternative.upgradeScore || 75)}/100</span>
                            </div>
                            {alternative.isHighMargin && (
                                <div className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-amber-400" />
                                    <span className="text-sm font-medium text-amber-400">Populært valg</span>
                                </div>
                            )}
                        </div>
                        {alternative.upgradeScore && alternative.upgradeScore > 50 && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                <Star className="h-3 w-3 mr-1" />
                                Top Anbefaling
                            </Badge>
                        )}
                    </div>
                </Card>
            )}

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-6">
                {/* Reference Product */}
                <Card className="glass-card p-5 border-slate-700/50">
                    <div className="text-center mb-4">
                        <Badge variant="outline" className="mb-3 text-slate-400 border-slate-600">
                            Kundens Valg
                        </Badge>
                        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                            {reference.name}
                        </h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {formatPrice(reference.price)}
                        </p>
                    </div>

                    <div className="space-y-3 mt-4">
                        {specs.map((spec) => (
                            <div key={spec.label} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    {spec.icon}
                                    <span>{spec.label}</span>
                                </div>
                                <span className="text-slate-300 font-medium">
                                    {spec.referenceValue}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Alternative Product */}
                <Card className="glass-card p-5 border-orange-500/30 relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />

                    <div className="relative text-center mb-4">
                        <Badge className="mb-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Vores Anbefaling
                        </Badge>
                        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                            {alternative.name}
                        </h3>
                        <p className="text-2xl font-bold text-orange-400 mt-2">
                            {formatPrice(alternative.price)}
                        </p>
                        {priceDiff !== 0 && (
                            <span className={`text-sm ${priceDiff > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)} ({priceDiffPercent}%)
                            </span>
                        )}
                    </div>

                    <div className="relative space-y-3 mt-4">
                        {specs.map((spec) => {
                            const status = getComparisonStatus(
                                spec.referenceNumeric,
                                spec.alternativeNumeric,
                                spec.higherIsBetter
                            );

                            return (
                                <div key={spec.label} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        {spec.icon}
                                        <span>{spec.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${status === 'better' ? 'text-green-400' :
                                            status === 'worse' ? 'text-slate-500' :
                                                'text-slate-300'
                                            }`}>
                                            {spec.alternativeValue}
                                        </span>
                                        {status === 'better' && <TrendingUp className="h-3 w-3 text-green-400" />}
                                        {status === 'worse' && <TrendingDown className="h-3 w-3 text-slate-500" />}
                                        {status === 'same' && <Minus className="h-3 w-3 text-slate-500" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Sales Pitch */}
            <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <ArrowRight className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">Salgstale</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            "{generateSalesPitch()}"
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
