import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { AlternativesTable } from "@/components/AlternativesTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Laptop, Zap } from "lucide-react";
import type { SearchResponse } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
    enabled: hasSearched && searchQuery.length > 0,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
  };

  const mainProduct = data?.products?.[0];
  const alternatives = data?.products?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Power Margin Optimizer</h1>
                <p className="text-xs text-muted-foreground">Find avancestærke produkter til Power.dk</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Laptop className="h-3 w-3 mr-1" />
                Bærbar PC
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Kategori 1341
              </Badge>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!hasSearched && <EmptyState type="initial" />}
        
        {hasSearched && isLoading && <LoadingState />}
        
        {hasSearched && error && (
          <EmptyState 
            type="error" 
            message={error instanceof Error ? error.message : "Der opstod en fejl under søgningen."} 
          />
        )}
        
        {hasSearched && !isLoading && !error && data && data.products.length === 0 && (
          <EmptyState 
            type="no-results" 
            message={`Ingen produkter fundet for "${searchQuery}". Prøv et andet søgeord.`} 
          />
        )}
        
        {hasSearched && !isLoading && !error && data && data.products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="sticky top-[200px]">
                <div className="mb-3">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Kundens Valgte Produkt
                  </h2>
                </div>
                {mainProduct && (
                  <ProductCard product={mainProduct} variant="main" />
                )}
                
                <div className="mt-4 p-4 rounded-md bg-card border">
                  <h3 className="text-sm font-medium mb-2">Avance-regler</h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Brand = "Cepter" = Høj avance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Pris ender på "98" = Høj avance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span>Andre produkter = Lav avance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Avancestærke Alternativer ({alternatives.length})
                </h2>
              </div>
              <AlternativesTable 
                alternatives={alternatives} 
                referencePrice={mainProduct?.price || 0} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Power Margin Optimizer Pro - Internt værktøj til Power.dk salgspersonale
          </p>
        </div>
      </footer>
    </div>
  );
}
