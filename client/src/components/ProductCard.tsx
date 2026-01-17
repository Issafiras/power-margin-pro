import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, MemoryStick, Monitor } from "lucide-react";
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
      className={`relative overflow-visible transition-all duration-300 ${
        product.isTopPick 
          ? "top-pick-glow border-primary" 
          : product.isHighMargin 
            ? "high-margin-glow border-primary/50" 
            : ""
      }`}
      data-testid={`card-product-${product.id}`}
    >
      {product.isTopPick && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground gap-1 px-3 py-1">
            <Trophy className="h-3.5 w-3.5" />
            Top Pick
          </Badge>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge 
              variant={product.isHighMargin ? "default" : "secondary"}
              className={product.isHighMargin ? "bg-primary" : ""}
              data-testid={`badge-margin-${product.id}`}
            >
              {product.isHighMargin ? "Høj Avance" : "Lav Avance"}
            </Badge>
            {product.marginReason && product.isHighMargin && (
              <span className="text-xs text-muted-foreground">({product.marginReason})</span>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2" data-testid={`text-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
        </div>
        
        {product.imageUrl && (
          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted/50">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
          
          {variant === "alternative" && referencePrice && priceDiff !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${priceDiff > 0 ? "text-destructive" : "text-green-500"}`}>
              {priceDiff > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}</span>
            </div>
          )}
        </div>
        
        {product.specs && (product.specs.cpu || product.specs.gpu || product.specs.ram) && (
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {product.specs.cpu && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{product.specs.cpu}</span>
              </div>
            )}
            {product.specs.gpu && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{product.specs.gpu}</span>
              </div>
            )}
            {product.specs.ram && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MemoryStick className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{product.specs.ram}</span>
              </div>
            )}
          </div>
        )}
        
        {product.sku && (
          <p className="text-xs text-muted-foreground">
            SKU: {product.sku}
          </p>
        )}
        
        <div className="flex items-center gap-2 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={handleCopyLink}
                data-testid={`button-copy-${product.id}`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Kopieret!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
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
