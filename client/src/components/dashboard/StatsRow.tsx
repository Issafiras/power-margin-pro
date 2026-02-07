import { Package, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
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
            <div className="flex gap-4 animate-pulse">
                <div className="h-10 w-32 bg-white/5 rounded-xl" />
                <div className="h-10 w-32 bg-white/5 rounded-xl" />
                <div className="h-10 w-32 bg-white/5 rounded-xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 text-destructive text-sm px-4 py-2 border border-destructive/20 bg-destructive/5 rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                Kunne ikke hente database status
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 flex-wrap animate-fade-in delay-100">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <Package className="h-4 w-4 text-orange-400" />
                </div>
                <div className="pr-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Database</p>
                    <p className="text-lg font-bold text-foreground tabular-nums leading-none mt-0.5">
                        {dbStatus?.productCount || 0}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div className="pr-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Populære</p>
                    <p className="text-lg font-bold text-purple-400 tabular-nums leading-none mt-0.5">
                        {dbStatus?.highMarginCount || "—"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="pr-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Status</p>
                    <p className="text-sm font-semibold text-emerald-400 leading-none mt-1">
                        {dbStatus?.hasProducts ? "Dato Synkroniseret" : "Mangler Synk"}
                    </p>
                </div>
            </div>
        </div>
    );
}
