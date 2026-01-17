import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, HardDrive, MemoryStick, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

interface AlternativesTableProps {
  alternatives: ProductWithMargin[];
  referencePrice: number;
}

function CopyButton({ url, productId }: { url: string; productId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleCopy}
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          data-testid={`button-copy-alt-${productId}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Kopieret!" : "Kopier link"}</TooltipContent>
    </Tooltip>
  );
}

export function AlternativesTable({ alternatives, referencePrice }: AlternativesTableProps) {
  if (alternatives.length === 0) {
    return (
      <Card className="glass-card h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Avancestærke Alternativer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Ingen alternativer fundet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Prøv en anden søgning.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highMarginCount = alternatives.filter(a => a.isHighMargin).length;

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary animate-glow" />
            Avancestærke Alternativer
          </CardTitle>
          <div className="flex items-center gap-2">
            {highMarginCount > 0 && (
              <Badge className="badge-premium text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                {highMarginCount} høj avance
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {alternatives.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-340px)] custom-scrollbar">
          <div className="p-4 space-y-3">
            {alternatives.map((product, index) => {
              const priceDiff = product.price - referencePrice;
              
              return (
                <div 
                  key={product.id}
                  className={`relative rounded-xl p-4 transition-all duration-300 animate-slide-up ${
                    product.isTopPick 
                      ? "top-pick-glow gradient-border" 
                      : product.isHighMargin 
                        ? "card-alternative high-margin border-primary/20" 
                        : "card-alternative"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`row-alternative-${index}`}
                >
                  {product.isTopPick && (
                    <div className="absolute -top-2.5 right-4 z-10">
                      <Badge className="badge-premium gap-1 text-xs px-2.5 py-1">
                        <Trophy className="h-3 w-3" />
                        Anbefalet
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {product.imageUrl && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent overflow-hidden p-1.5">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {product.isHighMargin ? (
                              <Badge className="badge-premium text-[10px] gap-0.5 px-1.5 py-0.5">
                                <Sparkles className="h-2.5 w-2.5" />
                                Høj
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-muted/40 px-1.5 py-0.5">
                                Standard
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground/70">{product.brand}</span>
                          </div>
                          <h4 className="text-sm font-medium leading-snug line-clamp-2 text-foreground/90">
                            {product.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <CopyButton url={product.productUrl} productId={product.id} />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                asChild
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                data-testid={`button-external-alt-${product.id}`}
                              >
                                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Åbn på Power.dk</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold price-tag">{formatPrice(product.price)}</span>
                          {priceDiff !== 0 && (
                            <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                              priceDiff > 0 
                                ? "text-red-400 bg-red-400/10" 
                                : "text-green-400 bg-green-400/10"
                            }`}>
                              {priceDiff > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {product.upgradeReason && (
                        <div className="mt-2.5">
                          <Badge variant="outline" className="badge-outline-glow text-xs">
                            {product.upgradeReason}
                          </Badge>
                        </div>
                      )}
                      
                      {product.specs && (product.specs.cpu || product.specs.ram || product.specs.storage) && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70 flex-wrap">
                          {product.specs.cpu && (
                            <div className="flex items-center gap-1.5">
                              <Cpu className="h-3 w-3 text-primary/60" />
                              <span className="truncate max-w-[100px]">{product.specs.cpu}</span>
                            </div>
                          )}
                          {product.specs.ram && (
                            <div className="flex items-center gap-1.5">
                              <MemoryStick className="h-3 w-3 text-primary/60" />
                              <span>{product.specs.ram}</span>
                            </div>
                          )}
                          {product.specs.storage && (
                            <div className="flex items-center gap-1.5">
                              <HardDrive className="h-3 w-3 text-primary/60" />
                              <span>{product.specs.storage}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
