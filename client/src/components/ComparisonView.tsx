// Product Comparison View
// Side-by-side comparison med AI analyse

import { Cpu, MemoryStick, HardDrive, Monitor, Zap, CheckCircle2, XCircle, Minus, Brain } from "lucide-react";
import { CopilotReadiness } from "./CopilotReadiness";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/specExtractor";
import type { ProductWithMargin } from "@shared/schema";

interface ComparisonViewProps {
  product1: ProductWithMargin;
  product2: ProductWithMargin;
}

function SpecRow({ 
  label, 
  icon: Icon, 
  value1, 
  value2, 
  tier1, 
  tier2 
}: { 
  label: string;
  icon: any;
  value1?: string | number;
  value2?: string | number;
  tier1?: number;
  tier2?: number;
}) {
  const v1 = value1 || "—";
  const v2 = value2 || "—";
  
  let winner1 = false;
  let winner2 = false;
  
  if (tier1 && tier2) {
    winner1 = tier1 > tier2;
    winner2 = tier2 > tier1;
  } else if (typeof value1 === "number" && typeof value2 === "number") {
    winner1 = value1 > value2;
    winner2 = value2 > value1;
  }

  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-white/5 last:border-0">
      <div className={cn(
        "text-xs px-2 py-1 rounded text-right",
        winner1 ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-muted-foreground"
      )}>
        {v1}
      </div>
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn(
        "text-xs px-2 py-1 rounded",
        winner2 ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-muted-foreground"
      )}>
        {v2}
      </div>
    </div>
  );
}

function VerdictBadge({ product1, product2 }: { product1: ProductWithMargin; product2: ProductWithMargin }) {
  const score1 = (product1.upgradeScore || 0);
  const score2 = (product2.upgradeScore || 0);
  
  if (score1 > score2) {
    return (
      <div className="text-center py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-xs font-bold text-emerald-400">🏆 {product1.name.split(" ").slice(0, 3).join(" ")} vinder</span>
      </div>
    );
  }
  if (score2 > score1) {
    return (
      <div className="text-center py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-xs font-bold text-emerald-400">🏆 {product2.name.split(" ").slice(0, 3).join(" ")} vinder</span>
      </div>
    );
  }
  return (
    <div className="text-center py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <span className="text-xs font-bold text-amber-400">⚖️ Lige værdi</span>
    </div>
  );
}

export function ComparisonView({ product1, product2 }: ComparisonViewProps) {
  const specs1 = (product1.specs as any) || {};
  const specs2 = (product2.specs as any) || {};

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(
          "p-4 rounded-xl border",
          product1.isHighMargin 
            ? "bg-amber-500/10 border-amber-500/20" 
            : "bg-white/5 border-white/10"
        )}>
          <div className="text-xs text-muted-foreground mb-1">Produkt 1</div>
          <div className="text-sm font-bold text-white line-clamp-2">{product1.name}</div>
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mt-2">
            {formatPrice(product1.price)}
          </div>
          {product1.isHighMargin && (
            <span className="text-[9px] text-amber-400">🔥 {product1.marginReason}</span>
          )}
        </div>
        
        <div className={cn(
          "p-4 rounded-xl border",
          product2.isHighMargin 
            ? "bg-amber-500/10 border-amber-500/20" 
            : "bg-white/5 border-white/10"
        )}>
          <div className="text-xs text-muted-foreground mb-1">Produkt 2</div>
          <div className="text-sm font-bold text-white line-clamp-2">{product2.name}</div>
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mt-2">
            {formatPrice(product2.price)}
          </div>
          {product2.isHighMargin && (
            <span className="text-[9px] text-amber-400">🔥 {product2.marginReason}</span>
          )}
        </div>
      </div>

      {/* Verdict */}
      <VerdictBadge product1={product1} product2={product2} />

      {/* Spec Comparison */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 p-2 bg-white/5 border-b border-white/10">
          <div className="text-[10px] text-center text-muted-foreground">Produkt 1</div>
          <div className="text-[10px] text-center text-muted-foreground">Spec</div>
          <div className="text-[10px] text-center text-muted-foreground">Produkt 2</div>
        </div>
        
        <div className="p-2">
          <SpecRow label="CPU" icon={Cpu} value1={specs1.cpu?.split(" ").slice(-2).join(" ")} value2={specs2.cpu?.split(" ").slice(-2).join(" ")} tier1={specs1.cpuTier} tier2={specs2.cpuTier} />
          <SpecRow label="RAM" icon={MemoryStick} value1={`${specs1.ramGB || "?"}GB`} value2={`${specs2.ramGB || "?"}GB`} tier1={specs1.ramGB} tier2={specs2.ramGB} />
          <SpecRow label="Lager" icon={HardDrive} value1={`${specs1.storageGB || "?"}GB`} value2={`${specs2.storageGB || "?"}GB`} tier1={specs1.storageGB} tier2={specs2.storageGB} />
          <SpecRow label="GPU" icon={Monitor} value1={specs1.gpu?.split(" ").slice(-2).join(" ") || "Integreret"} value2={specs2.gpu?.split(" ").slice(-2).join(" ") || "Integreret"} tier1={specs1.gpuTier} tier2={specs2.gpuTier} />
          <SpecRow label="Score" icon={Zap} value1={product1.upgradeScore || 0} value2={product2.upgradeScore || 0} tier1={product1.upgradeScore} tier2={product2.upgradeScore} />
        </div>
      </div>

      {/* Price diff */}
      <div className="text-center text-xs text-muted-foreground">
        Prisforskel: {formatPrice(Math.abs(product2.price - product1.price))}
        {product2.price > product1.price ? " (Produkt 2 dyrere)" : " (Produkt 1 dyrere)"}
      </div>

      {/* Copilot Readiness Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <CopilotReadiness specs={specs1} priceDiff={0} />
        <CopilotReadiness specs={specs2} priceDiff={product2.price - product1.price} />
      </div>
    </div>
  );
}
