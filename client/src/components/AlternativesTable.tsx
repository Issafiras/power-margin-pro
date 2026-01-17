import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, Monitor, MemoryStick } from "lucide-react";
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
          data-testid={`button-copy-alt-${productId}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avancestærke Alternativer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p>Ingen alternativer fundet.</p>
            <p className="text-sm mt-1">Prøv en anden søgning.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">Avancestærke Alternativer</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {alternatives.filter(a => a.isHighMargin).length} høj avance af {alternatives.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="px-4 pb-4 space-y-3">
            {alternatives.map((product, index) => {
              const priceDiff = product.price - referencePrice;
              
              return (
                <div 
                  key={product.id}
                  className={`relative rounded-md border p-3 transition-all ${
                    product.isTopPick 
                      ? "border-primary bg-primary/5 top-pick-glow" 
                      : product.isHighMargin 
                        ? "border-primary/40 bg-primary/5" 
                        : "border-border bg-card"
                  }`}
                  data-testid={`row-alternative-${index}`}
                >
                  {product.isTopPick && (
                    <div className="absolute -top-2 right-3 z-10">
                      <Badge className="bg-primary text-primary-foreground gap-1 text-xs px-2 py-0.5">
                        <Trophy className="h-3 w-3" />
                        Anbefalet
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    {product.imageUrl && (
                      <div className="w-14 h-14 flex-shrink-0 rounded bg-muted/50 overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <Badge 
                              variant={product.isHighMargin ? "default" : "secondary"}
                              className={`text-xs ${product.isHighMargin ? "bg-primary" : ""}`}
                            >
                              {product.isHighMargin ? "Høj" : "Lav"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{product.brand}</span>
                          </div>
                          <h4 className="text-sm font-medium leading-tight line-clamp-2">
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
                                data-testid={`button-external-alt-${product.id}`}
                              >
                                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Åbn på Power.dk</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                          {priceDiff !== 0 && (
                            <span className={`flex items-center gap-0.5 text-xs ${
                              priceDiff > 0 ? "text-destructive" : "text-green-500"
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
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
                            {product.upgradeReason}
                          </Badge>
                        </div>
                      )}
                      
                      {product.specs && (product.specs.cpu || product.specs.gpu || product.specs.ram || product.specs.storage) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {product.specs.cpu && (
                            <div className="flex items-center gap-1">
                              <Cpu className="h-3 w-3 text-primary" />
                              <span className="truncate max-w-[120px]">{product.specs.cpu}</span>
                            </div>
                          )}
                          {product.specs.gpu && (
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3 text-primary" />
                              <span className="truncate max-w-[100px]">{product.specs.gpu}</span>
                            </div>
                          )}
                          {product.specs.ram && (
                            <div className="flex items-center gap-1">
                              <MemoryStick className="h-3 w-3 text-primary" />
                              <span>{product.specs.ram}</span>
                            </div>
                          )}
                          {product.specs.storage && (
                            <div className="flex items-center gap-1">
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
