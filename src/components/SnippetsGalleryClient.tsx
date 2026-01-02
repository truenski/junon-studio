import { useState } from "react";
import { Copy, Check, Search, Tag, Code2, ChevronDown, ChevronUp, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { snippets } from "@/lib/snippets";
import { convertJunonToJSON } from "@/hooks/useJunonSyntax";
import { useToast } from "@/hooks/use-toast";

export function SnippetsGalleryClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedJsonId, setCopiedJsonId] = useState<number | null>(null);
  const [expandedSnippets, setExpandedSnippets] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const allTags = [...new Set(snippets.flatMap(s => s.tags))];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          snippet.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || snippet.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJSON = async (id: number, code: string) => {
    try {
      const jsonData = convertJunonToJSON(code);
      const jsonString = JSON.stringify(jsonData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedJsonId(id);
      toast({
        title: "Copied as JSON",
        description: "Snippet converted to JSON and copied to clipboard",
      });
      setTimeout(() => setCopiedJsonId(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to convert",
        description: "Could not convert snippet to JSON",
        variant: "destructive",
      });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedSnippets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display text-primary neon-glow">Code Snippets</h2>
          <p className="text-sm text-muted-foreground mt-1">Ready-to-use code blocks for your Junon games</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTag(null)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-ui transition-all ${
            !selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-3 h-3" />
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            className={`px-3 py-1 rounded-full text-sm font-ui transition-all ${
              selectedTag === tag 
                ? "bg-secondary text-secondary-foreground" 
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSnippets.map(snippet => (
          <div
            key={snippet.id}
            className={`glass-panel rounded-lg neon-border hover:border-primary/50 transition-all group ${
              expandedSnippets.has(snippet.id) ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-border/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-foreground group-hover:text-primary transition-colors">
                    {snippet.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{snippet.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(snippet.id, snippet.code)}
                    className="text-muted-foreground hover:text-primary text-xs"
                    title="Copy code as text"
                  >
                    {copiedId === snippet.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1.5 text-accent" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyJSON(snippet.id, snippet.code)}
                    className="text-muted-foreground hover:text-primary text-xs"
                    title="Copy code as JSON"
                  >
                    {copiedJsonId === snippet.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1.5 text-accent" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <FileJson className="w-3 h-3 mr-1.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                {snippet.tags.map(tag => (
                  <span 
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">
                  by {snippet.author}
                </span>
              </div>
            </div>

            {/* Code Preview */}
            <div className="relative">
              <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-muted-foreground z-10">
                <Code2 className="w-3 h-3" />
                <span>Preview</span>
              </div>
              <div className="relative">
                <pre 
                  className={`p-4 pt-8 text-xs font-mono text-foreground/80 bg-muted/30 transition-all ${
                    expandedSnippets.has(snippet.id) 
                      ? 'max-h-none overflow-visible' 
                      : 'max-h-48 overflow-x-auto overflow-y-auto'
                  }`}
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {snippet.code}
                </pre>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(snippet.id);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 rounded bg-background/80 hover:bg-background border border-border/50 text-muted-foreground hover:text-foreground transition-colors z-10 shadow-sm"
                  title={expandedSnippets.has(snippet.id) ? "Collapse" : "Expand"}
                >
                  {expandedSnippets.has(snippet.id) ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

