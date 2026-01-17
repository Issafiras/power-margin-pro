import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { AlternativesTable } from "@/components/AlternativesTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import type { SearchResponse } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const { toast } = useToast();

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

  const handleExportPdf = async () => {
    if (!data?.products) return;
    
    setPdfLoading(true);
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: data.products,
          searchQuery: searchQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fejl ved PDF-eksport");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `power-produkter-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF eksporteret",
        description: `${data.products.length} produkter eksporteret til PDF`,
      });
    } catch (error) {
      toast({
        title: "Eksport fejlede",
        description: error instanceof Error ? error.message : "Kunne ikke eksportere til PDF",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!data?.products) return;
    
    setExcelLoading(true);
    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: data.products,
          searchQuery: searchQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fejl ved Excel-eksport");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `power-produkter-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Excel eksporteret",
        description: `${data.products.length} produkter eksporteret til Excel`,
      });
    } catch (error) {
      toast({
        title: "Eksport fejlede",
        description: error instanceof Error ? error.message : "Kunne ikke eksportere til Excel",
        variant: "destructive",
      });
    } finally {
      setExcelLoading(false);
    }
  };

  const mainProduct = data?.products?.[0];
  const alternatives = data?.products?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero gradient overlay */}
      <div className="hero-gradient fixed inset-0 pointer-events-none" />
      
      <header className="sticky top-0 z-[9999] glass-strong border-b border-white/5">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 animate-float">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="text-gradient">Power</span> Margin Optimizer
                </h1>
                <p className="text-sm text-muted-foreground/80">Find avancestærke produkter til Power.dk</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data && data.products.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportPdf}
                    disabled={pdfLoading}
                    data-testid="button-export-pdf"
                  >
                    {pdfLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportExcel}
                    disabled={excelLoading}
                    data-testid="button-export-excel"
                  >
                    {excelLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-[220px]">
                <div className="mb-4">
                  <h2 className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
                    Kundens Valg
                  </h2>
                </div>
                {mainProduct && (
                  <ProductCard product={mainProduct} variant="main" />
                )}
                
                <div className="mt-6 p-4 rounded-xl stat-card">
                  <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Avance-logik</h3>
                  <ul className="text-xs text-muted-foreground space-y-2.5">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/30" />
                      <span>Cepter brand = Høj avance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/30" />
                      <span>Pris ender på "98" = Høj avance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      <span className="text-muted-foreground/70">Andre = Lav avance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
                  Alternativer
                </h2>
                <span className="text-xs text-muted-foreground/60 px-2.5 py-1 rounded-full bg-muted/30">
                  {alternatives.length} fundet
                </span>
              </div>
              <AlternativesTable 
                alternatives={alternatives} 
                referencePrice={mainProduct?.price || 0} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 mt-auto glass">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-center text-muted-foreground/50">
            Power Margin Optimizer Pro — Internt værktøj til Power.dk
          </p>
        </div>
      </footer>
    </div>
  );
}
