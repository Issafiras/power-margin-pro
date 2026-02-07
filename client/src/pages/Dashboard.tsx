import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/dashboard/Header";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ProductCard } from "@/components/ProductCard";
import { AlternativesTable } from "@/components/AlternativesTable";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Sparkles } from "lucide-react";
import type { SearchResponse } from "@shared/schema";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

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
  const { toast } = useToast();

  const syncMutation = useMutation<SyncResult>({
    mutationFn: async () => {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/db/status'] });
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

  // Check if DB has products to determine search mode
  const { data: dbStatus } = useQuery<any>({
    queryKey: ['/api/db/status'],
    staleTime: 60000
  });

  const { data, isLoading, error } = useQuery<SearchResponse>({
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

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null);

  const mainProduct = data?.products?.[0];
  const alternatives = data?.products?.slice(1) || [];

  // Default to top pick if nothing selected
  const topPick = alternatives.find(a => a.isTopPick) || alternatives[0];

  // Current selection logic
  const selectedAlternative = selectedAlternativeId
    ? alternatives.find(a => a.id === selectedAlternativeId)
    : topPick;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans">
      {/* Animated mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-background to-amber-950/15" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Header
        data={data}
        isLoading={isLoading}
        pdfLoading={pdfLoading}
        excelLoading={excelLoading}
        isSyncing={syncMutation.isPending}
        onSearch={handleSearch}
        onSync={handleSync}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />

      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <StatsRow />
        </div>

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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              {mainProduct && selectedAlternative && (
                <RecommendationCard mainProduct={mainProduct} topPick={selectedAlternative} />
              )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (Sticky) */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <div className="sticky top-[280px] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                      <span className="w-6 h-px bg-gradient-to-r from-primary to-transparent" />
                      <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                        Kundens Valg
                      </h2>
                    </div>
                    {mainProduct && <ProductCard product={mainProduct} variant="main" />}
                  </div>

                  {/* New Chart Component */}
                  {mainProduct && alternatives.length > 0 && (
                    <MarginChart mainProduct={mainProduct} alternatives={alternatives} />
                  )}
                </div>
              </motion.div>

              {/* Right Column (Scrollable) */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Tabs defaultValue="alternatives" className="h-full flex flex-col">
                  <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-px bg-gradient-to-r from-primary to-transparent" />
                        <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                          Alternativer
                        </h2>
                      </div>
                      <TabsList className="h-7 bg-white/5 border border-white/10">
                        <TabsTrigger value="alternatives" className="text-[10px] px-3 h-5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                          Liste
                        </TabsTrigger>
                        <TabsTrigger value="specs" className="text-[10px] px-3 h-5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                          Specs
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-1.5 px-2.5 py-0.5 border-white/10 bg-white/5 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      {alternatives.length} fundet
                    </Badge>
                  </div>

                  <TabsContent value="alternatives" className="h-full mt-0">
                    <AlternativesTable
                      alternatives={alternatives}
                      referencePrice={mainProduct?.price || 0}
                      selectedId={selectedAlternative?.id}
                      onSelect={(id) => setSelectedAlternativeId(id)}
                    />
                  </TabsContent>

                  <TabsContent value="specs" className="h-full mt-0">
                    {/* Placeholder for future detailed spec comparison view */}
                    <div className="h-40 glass flex items-center justify-center text-muted-foreground text-sm">
                      Detaljeret specifikationsvisning kommer snart
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/5 mt-auto glass-strong py-6">
        <div className="container mx-auto px-6">
          <p className="text-[10px] text-center text-muted-foreground/40 tracking-widest uppercase font-medium">
            Power Salgsassistent Pro v2.0 — Din hjælp i hverdagen
          </p>
        </div>
      </footer>
    </div>
  );
}
