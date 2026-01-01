import { X, Key, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SettingsModalClientProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModalClient({ isOpen, onClose }: SettingsModalClientProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Mock save
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel neon-border rounded-lg p-6 m-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-display text-foreground">AI Settings</h2>
              <p className="text-xs text-muted-foreground">Configure your AI integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-ui text-foreground mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Google Gemini API Key
              </div>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="w-3 h-3" />
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Get your API key from Google AI Studio
            </a>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-ui text-foreground mb-3">AI Model</h3>
            <div className="space-y-2">
              {["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"].map((model) => (
                <label 
                  key={model}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <input
                    type="radio"
                    name="model"
                    defaultChecked={model === "gemini-1.5-flash"}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground">
                    {model}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
          >
            {isSaved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

