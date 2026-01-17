import { Search, Laptop, TrendingUp, Sparkles } from "lucide-react";

interface EmptyStateProps {
  type: "initial" | "no-results" | "error";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  if (type === "initial") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-float">
            <Laptop className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          Find <span className="text-gradient">avancestærke</span> produkter
        </h2>
        <p className="text-muted-foreground/80 max-w-md mb-8">
          Søg efter et produkt for at se alternativer med bedre avance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg">
          <div className="flex items-start gap-4 p-5 rounded-xl stat-card">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Søg produkt</h3>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Indtast SKU eller modelnavn
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-xl stat-card">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Se alternativer</h3>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Sammenlign med høj-avance produkter
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold mb-3 text-foreground/80">Ingen produkter fundet</h2>
        <p className="text-muted-foreground/70 max-w-md">
          {message || "Prøv at søge med et andet søgeord eller SKU-nummer."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-destructive/70" />
      </div>
      <h2 className="text-xl font-semibold mb-3 text-foreground/80">Noget gik galt</h2>
      <p className="text-muted-foreground/70 max-w-md">
        {message || "Der opstod en fejl under søgningen. Prøv igen senere."}
      </p>
    </div>
  );
}
