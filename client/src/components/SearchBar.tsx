import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles, Laptop, Command, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Keyboard shortcut to focus search
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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

  // Click outside to close
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

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
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
      inputRef.current?.blur();
    }
  };

  return (
    <div className="w-full relative max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative z-50">
        <motion.div
          className={`relative rounded-2xl overflow-hidden transition-shadow duration-300 ${isFocused
              ? "shadow-[0_0_40px_-5px_rgba(249,115,22,0.3)] ring-1 ring-primary/50"
              : "shadow-2xl shadow-black/20 border border-white/5"
            }`}
          initial={false}
          animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
        >
          {/* Glass background for input */}
          <div className="absolute inset-0 bg-[#0f1219]/90 backdrop-blur-xl" />

          <div className="relative flex items-center h-14 sm:h-16 px-4 sm:px-6">
            <div className="flex-shrink-0 mr-4 text-muted-foreground">
              {isLoadingSuggestions ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Search className={`h-5 w-5 transition-colors ${isFocused ? "text-primary" : ""}`} />
              )}
            </div>

            <Input
              ref={inputRef}
              type="text"
              placeholder="Søg efter SKU, model (f.eks. 'Zenbook') eller brand..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-full bg-transparent border-none text-lg text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 p-0"
              disabled={isLoading}
              autoComplete="off"
            />

            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="h-8 w-8 text-muted-foreground hover:text-foreground mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              {!query && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  <span className="text-xs">⌘</span>
                  <span>K</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Find
              </Button>
            </div>
          </div>
        </motion.div>
      </form>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full mt-2 z-40 bg-[#0f1219]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="py-2">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold">
                Forslag
              </div>
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  type="button"
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${selectedIndex === index ? "bg-white/5" : ""
                    }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground truncate pr-4">
                        {suggestion.name}
                        {suggestion.isHighMargin && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 uppercase tracking-wide">
                            <Sparkles className="h-2 w-2" />
                            Anbefalet
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                        {suggestion.price.toLocaleString('da-DK')} kr
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {suggestion.brand}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] text-muted-foreground">
              <div className="flex gap-4">
                <span>Tryk <kbd className="font-sans bg-white/10 px-1 rounded mx-0.5">↵</kbd> for at vælge</span>
                <span><kbd className="font-sans bg-white/10 px-1 rounded mx-0.5">↑↓</kbd> for at navigere</span>
              </div>
              <span>PowerPilot v2.0 AI-Search</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
