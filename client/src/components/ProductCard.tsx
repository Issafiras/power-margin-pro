import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, MemoryStick, HardDrive, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

interface ProductCardProps {
  product: ProductWithMargin;
  variant?: "main" | "alternative";
  referencePrice?: number;
}

export function ProductCard({ product, variant = "main", referencePrice }: ProductCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(product.productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const priceDiff = referencePrice ? product.price - referencePrice : 0;

  return (
    <Card 
      className={`relative overflow-visible transition-all duration-500 card-modern animate-scale-in ${
        product.isTopPick 
          ? "top-pick-glow border-primary/60 gradient-border" 
          : product.isHighMargin 
            ? "high-margin-glow border-primary/30" 
            : ""
      }`}
      data-testid={`card-product-${product.id}`}
    >
      {product.isTopPick && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="badge-premium gap-1.5 px-4 py-1.5 animate-glow">
            <Trophy className="h-3.5 w-3.5" />
            Top Pick
          </Badge>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {product.isHighMargin ? (
              <Badge className="badge-premium gap-1" data-testid={`badge-margin-${product.id}`}>
                <Sparkles className="h-3 w-3" />
                Høj Avance
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted/60 text-muted-foreground" data-testid={`badge-margin-${product.id}`}>
                Standard
              </Badge>
            )}
            {product.marginReason && product.isHighMargin && (
              <span className="text-[10px] text-primary/80 uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {product.marginReason}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base leading-snug line-clamp-2 text-foreground" data-testid={`text-name-${product.id}`}>
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground/80 mt-1.5 font-medium">{product.brand}</p>
          </div>
        </div>
        
        {product.imageUrl && (
          <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] p-3 border border-white/5">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-contain drop-shadow-lg"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="section-divider" />
        
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-foreground price-tag tracking-tight" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground/60 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
                <span className="text-xs font-medium text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </div>
            )}
          </div>
          
          {variant === "alternative" && referencePrice && priceDiff !== 0 && (
            <div className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-lg ${
              priceDiff > 0 
                ? "text-red-400 bg-red-400/10" 
                : "text-green-400 bg-green-400/10"
            }`}>
              {priceDiff > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}</span>
            </div>
          )}
        </div>
        
        {product.specs && (product.specs.cpu || product.specs.ram || product.specs.storage) && (
          <div className="grid grid-cols-1 gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            {product.specs.cpu && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-lg icon-container flex items-center justify-center">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-foreground/80 truncate">{product.specs.cpu}</span>
              </div>
            )}
            {product.specs.ram && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-lg icon-container flex items-center justify-center">
                  <MemoryStick className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-foreground/80 truncate">{product.specs.ram}</span>
              </div>
            )}
            {product.specs.storage && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-lg icon-container flex items-center justify-center">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-foreground/80 truncate">{product.specs.storage}</span>
              </div>
            )}
          </div>
        )}
        
        {product.sku && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            SKU: {product.sku}
          </p>
        )}
        
        <div className="flex items-center gap-2 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={handleCopyLink}
                data-testid={`button-copy-${product.id}`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Kopieret!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Kopier Link
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kopier produkt-URL til udklipsholder</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost"
                asChild
                className="hover:bg-primary/10 hover:text-primary"
                data-testid={`button-external-${product.id}`}
              >
                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Åbn på Power.dk</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
