import { Package, Sparkles, CheckCircle2, AlertTriangle, Database, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DbStatus {
    productCount: number;
    hasProducts: boolean;
    highMarginCount?: number;
    lastSync?: string;
    isError?: boolean;
}

export function StatsRow() {
    const { data: dbStatus, isLoading, isError } = useQuery<DbStatus>({
        queryKey: ['/api/db/status'],
        queryFn: async () => {
            const res = await fetch('/api/db/status');
            if (!res.ok) throw new Error('Failed to get DB status');
            return res.json();
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/5" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 backdrop-blur-md flex items-center gap-3 text-destructive animate-fade-in">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Kunne ikke forbinde til databasen</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-stagger">
            {/* DATABASE STATUS CARD */}
            <div className="relative overflow-hidden rounded-2xl p-5 glass-card group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Database className="h-24 w-24 -mr-8 -mt-8 text-orange-500 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:scale-110 transition-transform duration-300">
                            <Package className="h-5 w-5 text-orange-400" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Produkter</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-foreground tracking-tight counter-value">
                            {dbStatus?.productCount || 0}
                        </span>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">Totalt indekseret</p>
                    </div>
                </div>
            </div>

            {/* HIGH MARGIN OPPORTUNITIES */}
            <div className="relative overflow-hidden rounded-2xl p-5 glass-card group hover:-translate-y-1 transition-transform duration-300 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]">
                <div className="absolute top-0 right-0 -z-10 h-[150px] w-[150px] bg-purple-500/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:scale-110 transition-transform duration-300 animate-pulse-subtle">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                        </div>
                        <span className="text-xs font-bold text-purple-300/80 uppercase tracking-widest">High Margin</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                            {dbStatus?.highMarginCount || 0}
                        </span>
                        <p className="text-[10px] text-purple-400/60 mt-1 font-medium">Muligheder fundet</p>
                    </div>
                </div>
            </div>

            {/* SYSTEM HEALTH */}
            <div className="relative overflow-hidden rounded-2xl p-5 glass-card group hover:-translate-y-1 transition-transform duration-300">
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-300">
                            <Activity className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">System Status</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${dbStatus?.hasProducts ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-sm font-bold ${dbStatus?.hasProducts ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {dbStatus?.hasProducts ? "Online" : "Offline"}
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                                {dbStatus?.lastSync ? `Sidst opdateret: ${new Date(dbStatus.lastSync).toLocaleTimeString()}` : "Afventer synkronisering"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
