import { useState, useEffect } from "react";
import { Copy, Check, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCombinedSnippets, type SnippetWithSource } from "@/lib/snippetService";

export function QuickSnippetsClient() {
  const [snippets, setSnippets] = useState<SnippetWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Load snippets on mount
  useEffect(() => {
    const loadSnippets = async () => {
      try {
        const allSnippets = await getCombinedSnippets();
        setSnippets(allSnippets);
      } catch (error) {
        console.error("Error loading snippets:", error);
        setSnippets([]);
      } finally {
        setLoading(false);
      }
    };

    loadSnippets();
  }, []);

  useEffect(() => {
    const handleSnippetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger if clicking on copy button
      if (target.closest('button[data-copy-button]')) return;
      
      const snippetItem = target.closest('[data-snippet-item]') as HTMLElement;
      if (!snippetItem) return;

      const snippetId = snippetItem.getAttribute('data-snippet-id');
      if (!snippetId) return;

      // Find snippet by ID (can be string or number)
      const snippet = snippets.find(s => {
        if (typeof s.id === 'string' && typeof snippetId === 'string') {
          return s.id === snippetId;
        }
        if (typeof s.id === 'number') {
          return s.id.toString() === snippetId;
        }
        return false;
      });
      
      if (!snippet) return;

      // Dispatch custom event to CodeEditor
      const event = new CustomEvent('insertSnippet', {
        detail: { code: snippet.code }
      });
      window.dispatchEvent(event);
    };

    document.addEventListener('click', handleSnippetClick);
    return () => document.removeEventListener('click', handleSnippetClick);
  }, [snippets]);

  const handleCopy = (e: React.MouseEvent, id: string | number, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter snippets based on search query
  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (snippet.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Show filtered snippets (limit to 10 for quick panel)
  const displaySnippets = filteredSnippets.slice(0, 10);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-2 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="w-full text-xs px-7 py-1.5 bg-input border border-border rounded focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {displaySnippets.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No snippets found
          </div>
        ) : (
          displaySnippets.map((snippet) => {
            const lineCount = snippet.code.split('\n').length;
            return (
              <div
                key={snippet.id}
                data-snippet-item
                data-snippet-id={snippet.id}
                className="group relative p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-ui text-foreground group-hover:text-secondary block truncate">
                      {snippet.title}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lineCount} lines</p>
                  </div>
                  <Button
                    data-copy-button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleCopy(e, snippet.id, snippet.code)}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity shrink-0"
                    title="Copy code"
                  >
                    {copiedId === snippet.id ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="p-2 border-t border-border/30">
        <a
          href="/snippets"
          className="block w-full text-xs text-center py-2 text-muted-foreground hover:text-secondary transition-colors"
        >
          Browse gallery →
        </a>
      </div>
    </div>
  );
}
