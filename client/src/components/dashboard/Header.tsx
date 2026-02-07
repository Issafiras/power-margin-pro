import { Button } from "@/components/ui/button";
import { Loader2, FileText, FileSpreadsheet, RefreshCw, Zap } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import type { SearchResponse } from "@shared/schema";

interface HeaderProps {
    data: SearchResponse | undefined;
    isLoading: boolean;
    pdfLoading: boolean;
    excelLoading: boolean;
    isSyncing: boolean;
    onSearch: (query: string) => void;
    onSync: () => void;
    onExportPdf: () => void;
    onExportExcel: () => void;
}

export function Header({
    data,
    isLoading,
    pdfLoading,
    excelLoading,
    isSyncing,
    onSearch,
    onSync,
    onExportPdf,
    onExportExcel
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-[9999] backdrop-blur-xl bg-background/80 border-b border-white/5 animate-fade-in text-foreground">
            <div className="container mx-auto px-6 py-5">
                <div className="flex items-center justify-between gap-6 flex-wrap md:flex-nowrap">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-default">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                <Zap className="h-6 w-6 text-white drop-shadow-md" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
                                <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                                    Power
                                </span>
                                <span className="text-white">Pilot</span>
                            </h1>
                            <p className="text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase font-medium">
                                Smart Produktrådgivning
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 ml-auto md:ml-0">
                        {data && data.products.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/[0.07]">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onExportPdf}
                                    disabled={pdfLoading}
                                    className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Eksporter til PDF"
                                >
                                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                </Button>
                                <div className="w-px h-4 bg-white/10" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onExportExcel}
                                    disabled={excelLoading}
                                    className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Eksporter til Excel"
                                >
                                    {excelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSync}
                            disabled={isSyncing}
                            className="gap-2 h-9 px-4 border-white/10 hover:bg-white/5 hover:border-orange-500/30 hover:text-orange-400 transition-all duration-300 bg-transparent"
                        >
                            {isSyncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                                {isSyncing ? "Synkroniserer..." : "Synkroniser"}
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="mt-6">
                    <SearchBar onSearch={onSearch} isLoading={isLoading} />
                </div>
            </div>
        </header>
    );
}
