import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Laptop } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Søg efter SKU eller modelnavn (f.eks. HP EliteBook, Lenovo ThinkPad)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-11 text-base"
            disabled={isLoading}
            data-testid="input-search"
          />
        </div>
        <Button 
          type="submit" 
          size="lg"
          disabled={isLoading || !query.trim()}
          className="h-11 px-8"
          data-testid="button-search"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Søger...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Søg
            </>
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <Laptop className="h-3.5 w-3.5" />
        <span>Søgninger er låst til kategorien Bærbar PC (ID: 1341)</span>
      </div>
    </form>
  );
}
