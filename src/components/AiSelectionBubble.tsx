import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiSelectionBubbleProps {
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
}

export function AiSelectionBubble({ position, selectedText, onClose }: AiSelectionBubbleProps) {
  const [showInput, setShowInput] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAi = () => {
    setShowInput(true);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    // Mock AI response delay
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: Math.max(20, Math.min(position.x - 100, window.innerWidth - 220)),
        top: Math.max(20, position.y - (showInput ? 120 : 50))
      }}
    >
      {!showInput ? (
        <button
          onClick={handleAskAi}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel neon-border hover:bg-primary/10 transition-all group"
        >
          <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
          <span className="text-sm font-ui text-foreground">Ask AI</span>
          <span className="text-xs text-muted-foreground">(coming soon)</span>
        </button>
      ) : (
        <div className="w-72 glass-panel neon-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-ui text-foreground">AI Assistant</span>
              <span className="text-xs text-muted-foreground">(coming soon)</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-16 overflow-hidden">
            <span className="text-primary">Selected:</span> {selectedText.substring(0, 80)}...
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want to do with this code?"
              className="w-full bg-input border border-border rounded px-3 py-2 pr-10 text-sm font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSubmit}
              disabled={isLoading}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/20"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-1">
            <button 
              onClick={() => setPrompt("Explain this code")}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              Explain
            </button>
            <button 
              onClick={() => setPrompt("Optimize this code")}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              Optimize
            </button>
            <button 
              onClick={() => setPrompt("Fix any bugs")}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              Debug
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
