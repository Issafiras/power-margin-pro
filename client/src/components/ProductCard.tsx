import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, MemoryStick, HardDrive, Sparkles, Monitor, Layers, Zap, Gauge } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from "@/lib/specExtractor";

interface ProductCardProps {
  product: ProductWithMargin;
  variant?: "main" | "alternative";
  referencePrice?: number;
}

export function ProductCard({ product, variant = "main", referencePrice }: ProductCardProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // Spec power calculation for visual bars (simplified logic)
  const getSpecPower = (val: number | undefined, max: number) => Math.min(100, Math.max(10, ((val || 0) / max) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`relative overflow-visible transition-colors duration-500 border-opacity-50 ${product.isTopPick
          ? "glass-strong border-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
          : product.isHighMargin
            ? "glass border-primary/30 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]"
            : "glass border-white/5"
          }`}
      >
        {/* Dynamic Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 pointer-events-none ${product.isTopPick ? "from-primary/10 via-transparent to-transparent opacity-100" : "from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100"
          }`} />

        {product.isTopPick && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Badge className="badge-premium gap-1.5 px-4 py-1.5 shadow-xl shadow-orange-500/20 text-sm font-bold tracking-wide uppercase">
                <Trophy className="h-3.5 w-3.5 fill-current" />
                Top Valg
              </Badge>
            </motion.div>
          </div>
        )}

        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 flex-wrap relative z-10">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {product.isHighMargin ? (
                <Badge className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30 gap-1" variant="outline">
                  <Sparkles className="h-3 w-3" />
                  Anbefalet
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10">
                  Standard
                </Badge>
              )}
              {product.brand && (
                <Badge variant="secondary" className="bg-white/5 text-foreground/80 border-transparent">
                  {product.brand}
                </Badge>
              )}
            </div>

            <h3 className="font-display font-bold text-lg leading-snug text-foreground tracking-tight">
              {product.name}
            </h3>
          </div>

          {product.imageUrl && (
            <motion.div
              className="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-white/[0.03] p-2 border border-white/10 shadow-inner"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-xl"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Price Section */}
          <div className="flex items-end justify-between gap-3 pb-4 border-b border-white/5">
            <div>
              <motion.div
                key={product.price}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-foreground font-display tracking-tighter"
              >
                {formatPrice(product.price)}
              </motion.div>

              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground/60 line-through decoration-white/20">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold text-green-400 border-green-500/30 bg-green-500/10 h-5 px-1.5">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                </div>
              )}
            </div>

            {variant === "alternative" && referencePrice && priceDiff !== 0 && (
              <div className={`flex flex-col items-end`}>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Merpris</span>
                <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md ${priceDiff > 0
                  ? "text-red-400 bg-red-400/10 border-red-500/20"
                  : "text-green-400 bg-green-400/10 border-green-500/20"
                  }`}>
                  {priceDiff > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Specs Grid */}
          {product.specs && (
            <div className="grid grid-cols-2 gap-3">
              <SpecItem
                icon={Cpu}
                label="Processor"
                value={product.specs.cpu}
                subValue={product.specs.cpuTier ? `Tier ${product.specs.cpuTier}` : undefined}
                power={getSpecPower(product.specs.cpuTier, 10)}
              />
              <SpecItem
                icon={MemoryStick}
                label="RAM"
                value={product.specs.ram}
                power={getSpecPower(product.specs.ramGB, 64)}
              />
              <SpecItem
                icon={HardDrive}
                label="Lager"
                value={product.specs.storage}
                power={getSpecPower(product.specs.storageGB, 2048)}
              />
              <SpecItem
                icon={Layers}
                label="Grafik"
                value={product.specs.gpu || "Integreret"}
                subValue={product.specs.gpuVram ? `${product.specs.gpuVram} GB` : undefined}
                power={getSpecPower(product.specs.gpuTier, 10)}
              />
            </div>
          )}

          {/* Screen & Features */}
          <div className="space-y-3 pt-2">
            {product.specs?.screenSize && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Monitor className="h-5 w-5 text-primary/70" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase opacity-70">Skærm</span>
                  <span className="text-sm font-medium">
                    {product.specs.screenSize}
                    {product.specs.screenType && <span className="text-primary/80 ml-1">• {product.specs.screenType}</span>}
                  </span>
                </div>
              </div>
            )}

            {product.specs?.features && product.specs.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.specs.features.slice(0, 5).map((f, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[10px] text-muted-foreground border-transparent transition-colors">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 border-white/10 hover:bg-white/5 hover:border-primary/30 group"
              onClick={handleCopyLink}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="copied"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2 text-green-400"
                  >
                    <Check className="h-4 w-4" />
                    <span className="font-bold">Kopieret!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>Kopier Link</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="border-white/10 hover:bg-white/5 hover:text-primary hover:border-primary/30"
              asChild
            >
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SpecItem({ icon: Icon, label, value, subValue, power = 0 }: any) {
  return (
    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-[10px] text-muted-foreground uppercase opacity-70 tracking-wide">{label}</span>
      </div>
      <div className="font-medium text-sm truncate relative z-10" title={value}>
        {value || "—"}
      </div>
      {subValue && (
        <div className="text-[10px] text-muted-foreground/60">{subValue}</div>
      )}
      {/* Power Bar */}
      {power > 0 && (
        <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${power}%` }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
