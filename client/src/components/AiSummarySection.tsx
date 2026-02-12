import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";

interface AiSummarySectionProps {
    ids: string[];
}

export function AiSummarySection({ ids }: AiSummarySectionProps) {
    const { data, isLoading } = useQuery<{ summary: string }>({
        queryKey: ["ai-compare", ids.join(",")],
        queryFn: async () => {
            const res = await fetch("/api/ai-compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error("Could not fetch AI summary");
            return res.json();
        },
        enabled: ids.length > 1,
        staleTime: Infinity, // Cache forever for this session
    });

    if (isLoading) {
        return (
            <div className="bg-card/30 border border-border/50 rounded-lg p-6 mb-8 glass-card">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                    <h3 className="text-lg font-semibold text-white">Henter Power.dk's sammenligning...</h3>
                </div>
                <div className="h-20 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!data?.summary) return null;

    // The summary comes as an HTML string from Power.dk API
    // We'll trust it since we're proxying it, but we should add some styling classes
    // to make it match our theme.
    // Power.dk HTML usually uses <p>, <h3>, <ul>, <li>

    return (
        <div className="bg-card/30 border border-indigo-500/30 rounded-lg p-6 mb-8 glass-card animate-fade-in relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Power.dk's Vurdering</h3>
            </div>

            <div
                className="prose prose-invert prose-sm max-w-none text-slate-300 [&>h3]:text-indigo-300 [&>h3]:text-base [&>h3]:mt-4 [&>h3]:mb-2 [&>ul]:pl-5 [&>ul]:list-disc [&>ul>li]:mb-1 [&>p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.summary }}
            />
        </div>
    );
}
