import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Trophy, TrendingUp, TrendingDown, Cpu, MemoryStick, HardDrive, Sparkles, Monitor, Layers } from "lucide-react";
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
        className={`relative overflow-hidden transition-all duration-300 group ${product.isTopPick
            ? "glass-strong border-primary/50 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.3)]"
            : product.isHighMargin
              ? "glass border-primary/20 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.1)] hover:border-primary/40"
              : "glass border-white/5 hover:border-white/10"
          }`}
      >
        {/* Dynamic Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 pointer-events-none ${product.isTopPick
            ? "from-primary/10 via-transparent to-transparent opacity-100"
            : "from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100"
          }`} />

        {product.isTopPick && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Badge className="badge-premium gap-1.5 px-4 py-1.5 shadow-xl shadow-orange-500/20 text-[10px] font-black tracking-widest uppercase border border-orange-400/50">
                <Trophy className="h-3 w-3 fill-current" />
                Top Valg
              </Badge>
            </motion.div>
          </div>
        )}

        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 flex-wrap relative z-10 p-5">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {product.isHighMargin ? (
                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 gap-1 text-[10px] uppercase font-bold tracking-wider" variant="outline">
                  <Sparkles className="h-3 w-3" />
                  Høj Margin
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10 text-[10px] uppercase font-bold tracking-wider">
                  Standard
                </Badge>
              )}
              {product.brand && (
                <Badge variant="secondary" className="bg-white/5 text-foreground/80 border-transparent text-[10px] uppercase font-bold tracking-wider">
                  {product.brand}
                </Badge>
              )}
            </div>

            <h3 className="font-sans font-bold text-base leading-tight text-foreground/90 tracking-tight group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          {product.imageUrl && (
            <motion.div
              className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/[0.03] p-2 border border-white/10 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-md mix-blend-normal"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="space-y-5 relative z-10 p-5 pt-0">
          {/* Price Section */}
          <div className="flex items-end justify-between gap-3 pb-4 border-b border-white/5">
            <div>
              <motion.div
                key={product.price}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black text-foreground font-mono tracking-tight"
              >
                {formatPrice(product.price)}
              </motion.div>

              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground/60 line-through decoration-white/20 font-mono">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-bold text-green-400 border-green-500/30 bg-green-500/10 h-4 px-1 rounded-sm">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                </div>
              )}
            </div>

            {variant === "alternative" && referencePrice && priceDiff !== 0 && (
              <div className={`flex flex-col items-end`}>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-bold opacity-70">Difference</span>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md border backdrop-blur-md ${priceDiff > 0
                  ? "text-red-300 bg-red-400/10 border-red-500/20"
                  : "text-green-300 bg-green-400/10 border-green-500/20"
                  }`}>
                  {priceDiff > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{priceDiff > 0 ? "+" : ""}{formatPrice(priceDiff)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Specs Grid */}
          {product.specs && (
            <div className="grid grid-cols-2 gap-2">
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
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                <Monitor className="h-4 w-4 text-primary/70" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase opacity-70 font-bold tracking-wide">Skærm</span>
                  <span className="text-xs font-semibold">
                    {product.specs.screenSize}
                    {product.specs.screenType && <span className="text-primary/90 ml-1">• {product.specs.screenType}</span>}
                  </span>
                </div>
              </div>
            )}

            {product.specs?.features && product.specs.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.specs.features.slice(0, 4).map((f, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-[9px] text-muted-foreground border-transparent transition-colors px-1.5 py-0.5 h-5">
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
              size="sm"
              className="flex-1 gap-2 border-white/10 hover:bg-white/5 hover:border-primary/30 group bg-transparent h-9 text-xs"
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
                    <Check className="h-3.5 w-3.5" />
                    <span className="font-bold">Kopieret</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>Kopier</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="border-white/10 hover:bg-white/5 hover:text-primary hover:border-primary/30 bg-transparent h-9 w-9"
              asChild
            >
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
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
    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-colors group">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground/70 group-hover:text-primary transition-colors" />
        <span className="text-[9px] text-muted-foreground uppercase opacity-70 tracking-wide font-bold">{label}</span>
      </div>
      <div className="font-semibold text-xs truncate relative z-10 text-foreground/90" title={value}>
        {value || "—"}
      </div>
      {subValue && (
        <div className="text-[9px] text-muted-foreground/50">{subValue}</div>
      )}
      {/* Power Bar */}
      {power > 0 && (
        <div className="h-0.5 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/60 to-orange-400/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${power}%` }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
