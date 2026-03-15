import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Bot, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotFilterProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  productCounts?: {
    "ai-pro": number;
    "copilot+": number;
    "ready": number;
    "basic": number;
  };
}

const filters = [
  { key: "ai-pro", label: "AI Pro", icon: Brain, color: "from-emerald-500 to-green-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "copilot+", label: "Copilot+", icon: Bot, color: "from-purple-500 to-violet-400", bg: "bg-purple-500/10 border-purple-500/30" },
  { key: "ready", label: "AI-klar", icon: Zap, color: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10 border-blue-500/30" },
];

export function CopilotFilter({ activeFilter, onFilterChange, productCounts }: CopilotFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
        <Brain className="h-3.5 w-3.5" />
        Copilot:
      </div>
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = activeFilter === f.key;
        const count = productCounts?.[f.key as keyof typeof productCounts];
        
        return (
          <Button
            key={f.key}
            variant="outline"
            size="sm"
            onClick={() => onFilterChange(isActive ? null : f.key)}
            className={cn(
              "h-7 px-2.5 text-xs gap-1.5 transition-all border",
              isActive 
                ? `${f.bg} text-white border-white/20` 
                : "bg-transparent border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
            )}
          >
            <Icon className="h-3 w-3" />
            {f.label}
            {count !== undefined && count > 0 && (
              <span className="ml-0.5 opacity-60">({count})</span>
            )}
          </Button>
        );
      })}
      {activeFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(null)}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
        >
          Ryd filter
        </Button>
      )}
    </div>
  );
}
