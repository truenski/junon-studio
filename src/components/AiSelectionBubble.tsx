import { useState } from "react";
import { Sparkles, X, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCode } from "@/lib/aiService";
import { hasApiKey } from "@/lib/aiConfig";
import { useToast } from "@/hooks/use-toast";

interface AiSelectionBubbleProps {
  position: { x: number; y: number };
  selectedText: string;
  existingCode: string;
  onClose: () => void;
  onCodeGenerated: (code: string) => void;
  onOpenApiKeyDialog: () => void;
}

export function AiSelectionBubble({ 
  position, 
  selectedText, 
  existingCode,
  onClose, 
  onCodeGenerated,
  onOpenApiKeyDialog 
}: AiSelectionBubbleProps) {
  const [showInput, setShowInput] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAskAi = async () => {
    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Gemini API key to use AI features.",
        variant: "destructive",
      });
      onOpenApiKeyDialog();
      return;
    }
    setShowInput(true);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Gemini API key to use AI features.",
        variant: "destructive",
      });
      onOpenApiKeyDialog();
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await generateCode({
        prompt: prompt.trim(),
        existingCode,
        selectedText: selectedText || undefined,
      });

      if (result.success && result.code) {
        onCodeGenerated(result.code);
        toast({
          title: "Code Generated",
          description: "New code has been added to the top of your editor.",
        });
        onClose();
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        </button>
      ) : (
        <div className="w-72 glass-panel neon-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-ui text-foreground">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenApiKeyDialog}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Configure API Key"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
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
