import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Search, Tag, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: number;
}

const categoryIcons: Record<string, string> = {
  cpu_info: "⚡",
  gpu_info: "🎮",
  upgrade_tip: "🔄",
  sales_tip: "💰",
  use_case: "👤",
};

const categoryLabels: Record<string, string> = {
  cpu_info: "CPU Viden",
  gpu_info: "GPU Viden",
  upgrade_tip: "Opgradering",
  sales_tip: "Salgstip",
  use_case: "Brugsscenarie",
};

export function KnowledgeExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: searchData, isLoading } = useQuery<{ results: KnowledgeEntry[]; count: number }>({
    queryKey: ["/api/knowledge/search", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ q: searchQuery || "laptop" });
      if (selectedCategory) params.append("category", selectedCategory);
      const res = await fetch(`/api/knowledge/search?${params}`);
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: brandsData } = useQuery<{ brands: any[] }>({
    queryKey: ["/api/knowledge/brands"],
    staleTime: 300000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">AI Vidensbase</h2>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
          {searchData?.count || 0} entries
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Søg i vidensbasen (RAM, CPU, gaming, Cepter...)"
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all",
            !selectedCategory
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
          )}
        >
          Alle
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              selectedCategory === key
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
            )}
          >
            {categoryIcons[key]} {label}
          </button>
        ))}
      </div>

      {/* Knowledge entries */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : searchData?.results && searchData.results.length > 0 ? (
          searchData.results.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{categoryIcons[entry.category] || "📚"}</span>
                  <span className="text-sm font-bold text-white">{entry.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                  {categoryLabels[entry.category] || entry.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                {entry.content}
              </p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ingen resultater fundet</p>
          </div>
        )}
      </div>

      {/* Brand margins summary */}
      {brandsData?.brands && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Margin Oversigt</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {brandsData.brands.slice(0, 6).map((brand: any) => (
              <div key={brand.id} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{brand.brandName}</span>
                <span className={cn(
                  "font-medium",
                  brand.marginTier === "highest" ? "text-emerald-400" :
                  brand.marginTier === "high" ? "text-amber-400" :
                  brand.marginTier === "medium" ? "text-blue-400" :
                  "text-red-400"
                )}>
                  {brand.marginPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
