import { useState, useEffect } from "react";
import { Copy, Check, Search, Tag, Code2, ChevronDown, ChevronUp, FileJson, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCombinedSnippets, deleteSnippet, type SnippetWithSource, isDefaultSnippet } from "@/lib/snippetService";
import { convertJunonToJSON } from "@/hooks/useJunonSyntax";
import { useToast } from "@/hooks/use-toast";
import { AddSnippetDialog } from "@/components/AddSnippetDialog";
import { EditSnippetDialog } from "@/components/EditSnippetDialog";

export function SnippetsGalleryClient() {
  const [snippets, setSnippets] = useState<SnippetWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [copiedJsonId, setCopiedJsonId] = useState<string | number | null>(null);
  const [expandedSnippets, setExpandedSnippets] = useState<Set<string | number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<SnippetWithSource | null>(null);
  const { toast } = useToast();

  // Load snippets on mount and when refresh is needed
  const loadSnippets = async () => {
    setLoading(true);
    setError(null);
    try {
      const allSnippets = await getCombinedSnippets();
      setSnippets(allSnippets);
    } catch (err) {
      console.error("Error loading snippets:", err);
      setError("Failed to load snippets. Showing default snippets only.");
      // Fallback to empty array, getCombinedSnippets already handles fallback
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  const allTags = [...new Set(snippets.flatMap(s => s.tags || []))];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (snippet.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (snippet.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleCopy = (id: string | number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJSON = async (id: string | number, code: string) => {
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

  const toggleExpand = (id: string | number) => {
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

  const handleDeleteClick = (snippet: SnippetWithSource) => {
    if (isDefaultSnippet(snippet)) {
      toast({
        title: "Cannot Delete",
        description: "Default snippets cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    setSnippetToDelete(snippet);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!snippetToDelete || typeof snippetToDelete.id !== "string") {
      return;
    }

    try {
      await deleteSnippet(snippetToDelete.id);
      toast({
        title: "Snippet Deleted",
        description: "The snippet has been deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSnippetToDelete(null);
      await loadSnippets(); // Reload snippets
    } catch (error) {
      console.error("Error deleting snippet:", error);
      toast({
        title: "Error",
        description: "Failed to delete snippet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSnippetAdded = () => {
    loadSnippets();
  };

  const handleSnippetUpdated = () => {
    loadSnippets();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading snippets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display text-primary neon-glow">Code Snippets</h2>
          <p className="text-sm text-muted-foreground mt-1">Ready-to-use code blocks for your Junon games</p>
        </div>
        
        <div className="flex items-center gap-2">
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
          <AddSnippetDialog onSnippetAdded={handleSnippetAdded} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

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
      {filteredSnippets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No snippets found</p>
          {searchQuery || selectedTag ? (
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSnippets.map(snippet => {
            const isDefault = isDefaultSnippet(snippet);
            return (
              <div
                key={snippet.id}
                className={`glass-panel rounded-lg neon-border hover:border-primary/50 transition-all group ${
                  expandedSnippets.has(snippet.id) ? 'overflow-visible' : 'overflow-hidden'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-foreground group-hover:text-primary transition-colors">
                          {snippet.title}
                        </h3>
                        {isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                            Default
                          </span>
                        )}
                      </div>
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
                      {!isDefault && (
                        <>
                          <EditSnippetDialog snippet={snippet} onSnippetUpdated={handleSnippetUpdated} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(snippet)}
                            className="text-muted-foreground hover:text-destructive text-xs"
                            title="Delete snippet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    {(snippet.tags || []).map(tag => (
                      <span 
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    <div className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
                      {snippet.suggested_by && (
                        <span className="text-primary">
                          suggested by {snippet.suggested_by}
                        </span>
                      )}
                      <span>
                        by {snippet.author}
                      </span>
                    </div>
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
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{snippetToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
