import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles, Laptop } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`search-glow rounded-2xl p-1.5 transition-all duration-500 ${
        isFocused ? "scale-[1.01]" : ""
      }`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className={`h-5 w-5 transition-colors duration-300 ${
                isFocused ? "text-primary" : "text-primary/60"
              }`} />
            </div>
            <Input
              type="search"
              placeholder="Søg efter SKU eller modelnavn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-12 pr-4 h-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
              disabled={isLoading}
              data-testid="input-search"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            size="lg"
            className="h-12 px-6 font-medium gap-2 badge-premium border-0"
            data-testid="button-search"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Søger...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find Alternativer
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-4 text-xs flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20" data-testid="chip-category">
          <Laptop className="h-3.5 w-3.5 text-primary" />
          <span className="text-primary font-medium" data-testid="text-category-label">Bærbar PC</span>
        </div>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-muted-foreground/60" data-testid="text-optimization-label">Optimeret til avance</span>
        <span className="status-dot" data-testid="indicator-status" />
      </div>
    </form>
  );
}
