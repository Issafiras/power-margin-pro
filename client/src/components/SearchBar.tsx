import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-glow rounded-xl p-1 bg-card/50 transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
            <Input
              type="search"
              placeholder="Søg efter SKU eller modelnavn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              disabled={isLoading}
              data-testid="input-search"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="font-medium"
            data-testid="button-search"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Søger...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Find Alternativer
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground/70">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary/80">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-subtle" />
          Bærbar PC
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span>Optimeret til avance</span>
      </div>
    </form>
  );
}
