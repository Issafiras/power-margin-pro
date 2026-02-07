import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown,
  Cpu, HardDrive, MemoryStick, Sparkles, Zap, Flame, Star, ArrowUpDown, Target
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

// Estimated margin calculation (kept for sorting logic only, not display)
function getEstimatedMargin(product: ProductWithMargin): { percent: number; label: string; isHot: boolean } {
  const priceStr = Math.floor(product.price).toString();
  const isCepter = product.brand?.toLowerCase() === 'cepter';
  const is98 = priceStr.endsWith('98');
  const is92 = priceStr.endsWith('92');

  if (isCepter) return { percent: 15, label: '15%', isHot: true };
  if (is98 || is92) return { percent: 8, label: '8%', isHot: true };
  return { percent: 3, label: '3%', isHot: false };
}

// Update AlternativesTable props and component
interface AlternativesTableProps {
  alternatives: ProductWithMargin[];
  referencePrice: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

type SortOption = "margin" | "price_asc" | "price_desc" | "score";

export function AlternativesTable({ alternatives, referencePrice, selectedId, onSelect }: AlternativesTableProps) {
  // Default sort is still by "margin" logic (which is really just "Best Products" internally), but we won't call it that in UI
  const [sortOption, setSortOption] = useState<SortOption>("margin");

  const sortedAlternatives = useMemo(() => {
    return [...alternatives].sort((a, b) => {
      switch (sortOption) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "score":
          return (b.upgradeScore || 0) - (a.upgradeScore || 0);
        case "margin":
        default:
          // Logic persists: High value/margin items first, but presented as "Recommended"
          if (a.isHighMargin && !b.isHighMargin) return -1;
          if (!a.isHighMargin && b.isHighMargin) return 1;
          if (a.isTopPick) return -1;
          if (b.isTopPick) return 1;
          return (b.upgradeScore || 0) - (a.upgradeScore || 0);
      }
    });
  }, [alternatives, sortOption]);

  if (alternatives.length === 0) {
    return (
      <Card className="glass-card h-full border-white/5">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6"
          >
            <Sparkles className="h-10 w-10 text-muted-foreground/30" />
          </motion.div>
          <p className="text-muted-foreground font-medium">Ingen alternativer fundet.</p>
          <p className="text-sm text-muted-foreground/60 mt-2 max-w-xs">Prøv at justere din søgning for at finde flere resultater.</p>
        </CardContent>
      </Card>
    );
  }

  const highMarginCount = alternatives.filter(a => a.isHighMargin).length;

  return (
    <Card className="glass h-full flex flex-col border border-white/5 overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Alternativer</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-muted-foreground">
                  {alternatives.length} stk
                </Badge>
                {/* Visual "Guldkorn" badge removed as per request to hide margin indicators */}
              </div>
            </div>
          </div>

          <div className="flex bg-white/5 rounded-lg p-1 gap-1">
            {/* Renamed "Avance" to "Anbefalet" (Recommended) to be neutral */}
            <SortButton
              active={sortOption === "margin"}
              onClick={() => setSortOption("margin")}
              label="Anbefalet"
              icon={Sparkles}
            />
            <SortButton
              active={sortOption === "score"}
              onClick={() => setSortOption("score")}
              label="Score"
              icon={Star}
            />
            <SortButton
              active={sortOption === "price_asc"}
              onClick={() => setSortOption(sortOption === "price_asc" ? "price_desc" : "price_asc")}
              label="Pris"
              icon={ArrowUpDown}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-[600px] sm:h-[calc(100vh-340px)]">
          <div className="p-4 space-y-3 pb-20">
            <AnimatePresence mode="popLayout">
              {sortedAlternatives.map((product, index) => (
                <AlternativeItem
                  key={product.id}
                  product={product}
                  referencePrice={referencePrice}
                  index={index}
                  isSelected={product.id === selectedId}
                  onSelect={() => onSelect?.(product.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </CardContent>
    </Card>
  );
}

// ... SortButton ...

function SortButton({ active, onClick, label, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${active
        ? "bg-white/10 text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

const AlternativeItem = React.forwardRef<HTMLDivElement, { product: ProductWithMargin, referencePrice: number, index: number, isSelected: boolean, onSelect: () => void }>(
  ({ product, referencePrice, index, isSelected, onSelect }, ref) => {
    const priceDiff = product.price - referencePrice;
    // Margin calculation unused for display now

    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
      await navigator.clipboard.writeText(product.productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`group relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg cursor-pointer ${isSelected
          ? "bg-primary/20 border-primary shadow-[0_0_15px_-5px_hsl(var(--primary)/0.5)] ring-1 ring-primary/50"
          : product.isTopPick
            ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/40 shadow-[0_0_20px_-10px_hsl(var(--primary)/0.3)]"
            : product.isHighMargin
              ? "bg-white/[0.02] hover:bg-white/[0.04] border-white/10" // Removed orange border
              : "bg-transparent hover:bg-white/[0.02] border-white/5"
          }`}
        onClick={onSelect}
      >
        {isSelected && (
          <div className="absolute -top-2 -left-2 z-10">
            <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg animate-in zoom-in spin-in-180 duration-300">
              <Target className="h-4 w-4" />
            </div>
          </div>
        )}

        {product.isTopPick && !isSelected && (
          <div className="absolute top-0 right-0 p-3">
            <Badge className="badge-premium gap-1 text-[10px] px-2 py-0.5 shadow-lg">
              <Trophy className="h-2.5 w-2.5" />
              Top Valg
            </Badge>
          </div>
        )}

        <div className="flex gap-4">
          {/* Image */}
          <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-white/5 p-2 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="h-6 w-6 text-muted-foreground/30">💻</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {/* Remvoed 'Høj Avance' badge entirely */}
                  <span className="text-[10px] text-muted-foreground font-medium">{product.brand}</span>
                </div>
                <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold tabular-nums tracking-tight">{formatPrice(product.price)}</span>
                  {priceDiff !== 0 && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${priceDiff > 0 ? "text-red-400 bg-red-400/10" : "text-green-400 bg-green-400/10"
                      }`}>
                      {priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}
                    </span>
                  )}
                </div>
              </div>

              {/* Spec Score Badge */}
              {product.upgradeScore && (
                <div className="flex flex-col items-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${product.upgradeScore > 80 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                        }`}>
                        <Star className="h-2.5 w-2.5 fill-current" />
                        {Math.round(product.upgradeScore)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">Upgrade Score</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Quick Actions overlay on hover */}
            <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-primary/20 text-primary" onClick={(e) => { e.stopPropagation(); onSelect(); }} title="Vælg til sammenligning">
                <Target className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" asChild onClick={(e) => e.stopPropagation()}>
                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Mini Specs - Only show differentiating features */}
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground/80">
          {product.specs?.ram && (
            <div className="flex items-center gap-1.5">
              <MemoryStick className="h-3 w-3 opacity-50" />
              <span className="truncate">{product.specs.ram}</span>
            </div>
          )}
          {product.specs?.storage && (
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3 w-3 opacity-50" />
              <span className="truncate">{product.specs.storage}</span>
            </div>
          )}
          {product.specs?.cpu && (
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 opacity-50" />
              <span className="truncate">{product.specs.cpu.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);
AlternativeItem.displayName = "AlternativeItem";
