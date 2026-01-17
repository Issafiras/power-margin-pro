import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { AlternativesTable } from "@/components/AlternativesTable";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Zap, FileText, FileSpreadsheet, Loader2, RefreshCw, 
  Database, CheckCircle2, TrendingUp, Package, Sparkles,
  ArrowRight, Clock
} from "lucide-react";
import type { SearchResponse } from "@shared/schema";

interface DbStatus {
  productCount: number;
  hasProducts: boolean;
  highMarginCount?: number;
  lastSync?: string;
}

interface SyncResult {
  success: boolean;
  totalSynced: number;
  totalInDatabase: number;
  message: string;
  error?: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { toast } = useToast();

  const { data: dbStatus, refetch: refetchDbStatus } = useQuery<DbStatus>({
    queryKey: ['/api/db/status'],
    queryFn: async () => {
      const res = await fetch('/api/db/status');
      if (!res.ok) throw new Error('Failed to get DB status');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const syncMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: (result) => {
      refetchDbStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/search'] });
      toast({
        title: "Synkronisering fuldført",
        description: `${result.totalSynced} produkter opdateret`,
      });
    },
    onError: (error) => {
      toast({
        title: "Synkronisering fejlede",
        description: error instanceof Error ? error.message : "Kunne ikke synkronisere",
        variant: "destructive",
      });
    },
  });

  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ['/api/search', searchQuery, dbStatus?.hasProducts],
    queryFn: async () => {
      const useDb = dbStatus?.hasProducts ? 'true' : 'false';
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&db=${useDb}`);
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
    setShowComparison(false);
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleExportPdf = async () => {
    if (!data?.products) return;
    setPdfLoading(true);
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: data.products, searchQuery }),
      });
      if (!response.ok) throw new Error("Fejl ved PDF-eksport");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `power-produkter-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "PDF eksporteret", description: `${data.products.length} produkter` });
    } catch (error) {
      toast({ title: "Eksport fejlede", variant: "destructive" });
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
        body: JSON.stringify({ products: data.products, searchQuery }),
      });
      if (!response.ok) throw new Error("Fejl ved Excel-eksport");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `power-produkter-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Excel eksporteret", description: `${data.products.length} produkter` });
    } catch (error) {
      toast({ title: "Eksport fejlede", variant: "destructive" });
    } finally {
      setExcelLoading(false);
    }
  };

  const mainProduct = data?.products?.[0];
  const alternatives = data?.products?.slice(1) || [];
  const topPick = alternatives.find(a => a.isTopPick);

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient fixed inset-0 pointer-events-none" />
      
      <header className="sticky top-0 z-[9999] glass-strong border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/25 animate-float">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-gradient">Power</span> Margin Pro
                </h1>
                <p className="text-[11px] text-muted-foreground/70 tracking-wide">Optimizer til høj-avance produkter</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data && data.products.length > 0 && (
                <div className="flex items-center gap-1.5 mr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportPdf}
                    disabled={pdfLoading}
                    data-testid="button-export-pdf"
                    className="h-8 w-8"
                  >
                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportExcel}
                    disabled={excelLoading}
                    data-testid="button-export-excel"
                    className="h-8 w-8"
                  >
                    {excelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                data-testid="button-sync"
                className="gap-2 h-8"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline text-xs">
                  {syncMutation.isPending ? "Synkroniserer..." : "Synkroniser"}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="stat-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Produkter</p>
                <p className="text-lg font-bold text-foreground">{dbStatus?.productCount || 0}</p>
              </div>
            </div>
            <div className="stat-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Høj Avance</p>
                <p className="text-lg font-bold text-primary">{dbStatus?.highMarginCount || "—"}</p>
              </div>
            </div>
            <div className="stat-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-green-500">
                  {dbStatus?.hasProducts ? "Klar" : "Synkroniser"}
                </p>
              </div>
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
            message={error instanceof Error ? error.message : "Der opstod en fejl."} 
          />
        )}
        
        {hasSearched && !isLoading && !error && data && data.products.length === 0 && (
          <EmptyState 
            type="no-results" 
            message={`Ingen produkter fundet for "${searchQuery}".`} 
          />
        )}
        
        {hasSearched && !isLoading && !error && data && data.products.length > 0 && (
          <>
            {mainProduct && topPick && (
              <Card className="mb-6 p-4 glass-card border-primary/20 animate-scale-in">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <Badge className="badge-premium gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      Hurtig Anbefaling
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Skift fra <span className="text-foreground font-medium">{mainProduct.brand}</span> til{" "}
                      <span className="text-primary font-semibold">{topPick.brand} {topPick.name.slice(0, 30)}...</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Merpris</p>
                      <p className={`text-sm font-bold ${(topPick.priceDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {(topPick.priceDifference || 0) > 0 ? '+' : ''}{topPick.priceDifference?.toLocaleString('da-DK')} kr
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setShowComparison(!showComparison)}
                    >
                      {showComparison ? 'Skjul' : 'Sammenlign'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                {showComparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 animate-slide-up">
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Kundens Valg</p>
                      <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
                        <p className="text-sm font-medium line-clamp-1">{mainProduct.name}</p>
                        <p className="text-xl font-bold mt-1">{mainProduct.price.toLocaleString('da-DK')} kr</p>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          {mainProduct.specs?.cpu && <span>{mainProduct.specs.cpu}</span>}
                          {mainProduct.specs?.ram && <span>• {mainProduct.specs.ram}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        Anbefalet Alternativ
                      </p>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm font-medium line-clamp-1">{topPick.name}</p>
                        <p className="text-xl font-bold mt-1 text-primary">{topPick.price.toLocaleString('da-DK')} kr</p>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          {topPick.specs?.cpu && <span>{topPick.specs.cpu}</span>}
                          {topPick.specs?.ram && <span>• {topPick.specs.ram}</span>}
                        </div>
                        {topPick.upgradeReason && (
                          <Badge variant="outline" className="mt-2 text-[10px]">{topPick.upgradeReason}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="sticky top-[280px]">
                  <div className="mb-3">
                    <h2 className="text-[10px] font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-px bg-gradient-to-r from-primary to-transparent" />
                      Kundens Valg
                    </h2>
                  </div>
                  {mainProduct && <ProductCard product={mainProduct} variant="main" />}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-[10px] font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-px bg-gradient-to-r from-primary to-transparent" />
                    Høj-Avance Alternativer
                  </h2>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    {alternatives.length} fundet
                  </Badge>
                </div>
                <AlternativesTable 
                  alternatives={alternatives} 
                  referencePrice={mainProduct?.price || 0} 
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-white/5 mt-auto glass">
        <div className="container mx-auto px-4 py-4">
          <p className="text-[10px] text-center text-muted-foreground/40 tracking-wide">
            Power Margin Optimizer Pro v2.0 — Designet til at maksimere avance
          </p>
        </div>
      </footer>
    </div>
  );
}
