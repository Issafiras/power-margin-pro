import { Search, Laptop, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  type: "initial" | "no-results" | "error";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  if (type === "initial") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-scale-in">
        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-3xl glass-card flex items-center justify-center animate-float">
            <Laptop className="h-14 w-14 text-primary animate-glow" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl badge-premium flex items-center justify-center shadow-xl shadow-primary/40">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-primary/20 blur-md" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-2 mt-4"
        >
          <h2 className="text-xl font-bold tracking-tight">
            Find <span className="text-gradient">populære</span> produkter
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Søg efter et produkt for at se bedre alternativer og anbefalinger fra Power Salgsassistent.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <Search className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-[10px] text-muted-foreground font-medium">Søg Produkt</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <Sparkles className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-[10px] text-muted-foreground font-medium">Se Anbefalinger</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-8">
          <Search className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-foreground/90" data-testid="text-no-results-heading">Ingen produkter fundet</h2>
        <p className="text-muted-foreground/70 max-w-md text-base" data-testid="text-no-results-message">
          {message || "Prøv at søge med et andet søgeord eller SKU-nummer."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-scale-in">
      <div className="w-24 h-24 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-8">
        <AlertCircle className="h-12 w-12 text-destructive/70" />
      </div>
      <h2 className="text-2xl font-semibold mb-3 text-foreground/90" data-testid="text-error-heading">Noget gik galt</h2>
      <p className="text-muted-foreground/70 max-w-md text-base" data-testid="text-error-message">
        {message || "Der opstod en fejl under søgningen. Prøv igen senere."}
      </p>
    </div>
  );
}
