import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles, Laptop } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Suggestion {
  id: string;
  name: string;
  brand: string;
  price: number;
  isHighMargin: boolean;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions?.length > 0);
          setSelectedIndex(-1);
        }
      } catch (e) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    onSearch(suggestion.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className={`search-glow rounded-2xl p-1.5 transition-all duration-500 ${
        isFocused ? "scale-[1.01]" : ""
      }`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              {isLoadingSuggestions ? (
                <Loader2 className="h-5 w-5 text-primary/60 animate-spin" />
              ) : (
                <Search className={`h-5 w-5 transition-colors duration-300 ${
                  isFocused ? "text-primary" : "text-primary/60"
                }`} />
              )}
            </div>
            <Input
              ref={inputRef}
              type="search"
              placeholder="Søg efter SKU eller modelnavn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-4 h-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
              disabled={isLoading}
              autoComplete="off"
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

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-2 z-50 glass-strong rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
          data-testid="dropdown-suggestions"
        >
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left transition-all ${
                  selectedIndex === index 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-white/5"
                }`}
                data-testid={`suggestion-item-${index}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{suggestion.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className="text-xs text-muted-foreground">{suggestion.brand}</span>
                    {suggestion.isHighMargin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        Høj Avance
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{suggestion.price.toLocaleString('da-DK')} kr</p>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-white/5 bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              Tryk Enter for at søge · ↑↓ for at navigere
            </p>
          </div>
        </div>
      )}

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
