import { Search, Laptop, TrendingUp } from "lucide-react";

interface EmptyStateProps {
  type: "initial" | "no-results" | "error";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  if (type === "initial") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Laptop className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Klar til at finde avancestærke produkter</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Søg efter et produkt ved SKU eller modelnavn for at se sammenligning med andre bærbare computere med høj avance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg">
          <div className="flex items-start gap-3 p-4 rounded-md bg-card border">
            <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm">Søg efter produkt</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Indtast SKU eller modelnavn på det produkt kunden kigger på
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-md bg-card border">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm">Find alternativer</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Se avancestærke alternativer med lignende specifikationer
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Ingen produkter fundet</h2>
        <p className="text-muted-foreground max-w-md">
          {message || "Prøv at søge med et andet søgeord eller SKU-nummer."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Noget gik galt</h2>
      <p className="text-muted-foreground max-w-md">
        {message || "Der opstod en fejl under søgningen. Prøv igen senere."}
      </p>
    </div>
  );
}
