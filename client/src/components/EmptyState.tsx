import { Search, Laptop, TrendingUp, Sparkles, AlertCircle } from "lucide-react";

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
        <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">
          Find <span className="text-gradient">avancestærke</span> produkter
        </h2>
        <p className="text-muted-foreground/80 max-w-md mb-10 text-lg">
          Søg efter et produkt for at se alternativer med bedre avance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-lg w-full">
          <div className="flex items-start gap-4 p-6 rounded-2xl glass-card hover:border-primary/20 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl icon-container flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1.5">Søg produkt</h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                Indtast SKU eller modelnavn
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-2xl glass-card hover:border-primary/20 transition-all duration-300 group" style={{ animationDelay: "100ms" }}>
            <div className="w-12 h-12 rounded-xl icon-container flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1.5">Se alternativer</h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center mb-8">
          <Search className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-foreground/90">Ingen produkter fundet</h2>
        <p className="text-muted-foreground/70 max-w-md text-base">
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
      <h2 className="text-2xl font-semibold mb-3 text-foreground/90">Noget gik galt</h2>
      <p className="text-muted-foreground/70 max-w-md text-base">
        {message || "Der opstod en fejl under søgningen. Prøv igen senere."}
      </p>
    </div>
  );
}
