import { useState, useRef, useEffect } from "react";
import { Sparkles, Play, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectionBubble } from "./AiSelectionBubble";

const mockCode = `// Junon.io Game Script
// Welcome to your code builder!

@trigger onPlayerJoin(player) {
  // Greet the player
  sendMessage(player, "Welcome to the game!")
  
  // Give starter items
  giveItem(player, "sword", 1)
  giveItem(player, "health_potion", 3)
  
  // Set spawn point
  teleport(player, spawn_location)
}

@trigger onPlayerDeath(player, killer) {
  // Handle player death
  if (killer != null) {
    addScore(killer, 10)
    sendMessage(killer, "You eliminated " + player.name)
  }
  
  // Respawn after delay
  delay(3000) {
    respawn(player)
  }
}

@command /heal {
  // Custom heal command
  if (player.health < 100) {
    setHealth(player, 100)
    playSound(player, "heal_sound")
    sendMessage(player, "You have been healed!")
  }
}`;

export function CodeEditor() {
  const [code, setCode] = useState(mockCode);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAiBubble, setShowAiBubble] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString();
      setSelectedText(text);
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowAiBubble(true);
    } else {
      setShowAiBubble(false);
      setSelectedText("");
    }
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, []);

  const handleAiClose = () => {
    setShowAiBubble(false);
    setSelectedText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 glass-panel">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">main.junon</span>
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          {/* Line numbers */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r border-border/30 flex flex-col items-end pr-2 pt-4 text-muted-foreground/50 font-mono text-sm select-none">
            {code.split('\n').map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          
          {/* Syntax highlighted display */}
          <pre className="pl-16 pr-4 pt-4 pb-20 font-mono text-sm leading-6 whitespace-pre-wrap">
            {code.split('\n').map((line, i) => (
              <div key={i} className="min-h-[24px]">
                {highlightLine(line)}
              </div>
            ))}
          </pre>

          {/* Hidden textarea for editing */}
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="absolute inset-0 pl-16 pr-4 pt-4 pb-20 font-mono text-sm leading-6 bg-transparent text-transparent caret-primary resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Bottom Input Bar */}
      <div className="p-4 border-t border-border/50 glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a command or describe what you want to build..."
              className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-12 font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">Quick:</span>
          <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-primary transition-colors">
            @trigger
          </button>
          <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-secondary transition-colors">
            @command
          </button>
          <button className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-accent transition-colors">
            @event
          </button>
        </div>
      </div>

      {/* AI Selection Bubble */}
      {showAiBubble && selectionPosition && (
        <AiSelectionBubble
          position={selectionPosition}
          selectedText={selectedText}
          onClose={handleAiClose}
        />
      )}
    </div>
  );
}

function highlightLine(line: string): React.ReactNode {
  // Simple syntax highlighting
  if (line.trim().startsWith('//')) {
    return <span className="text-muted-foreground/60 italic">{line}</span>;
  }
  
  if (line.includes('@trigger') || line.includes('@command') || line.includes('@event')) {
    return (
      <span>
        {line.split(/(@\w+)/).map((part, i) => {
          if (part.startsWith('@')) {
            return <span key={i} className="text-secondary font-semibold neon-glow-magenta">{part}</span>;
          }
          return <span key={i}>{highlightKeywords(part)}</span>;
        })}
      </span>
    );
  }
  
  return highlightKeywords(line);
}

function highlightKeywords(text: string): React.ReactNode {
  const keywords = ['if', 'else', 'delay', 'return', 'true', 'false', 'null', 'var', 'const'];
  const functions = ['sendMessage', 'giveItem', 'teleport', 'addScore', 'respawn', 'setHealth', 'playSound'];
  
  const parts = text.split(/(\s+|[(){},"'])/);
  
  return parts.map((part, i) => {
    if (keywords.includes(part)) {
      return <span key={i} className="text-neon-purple">{part}</span>;
    }
    if (functions.includes(part)) {
      return <span key={i} className="text-primary">{part}</span>;
    }
    if (part.startsWith('"') || part.startsWith("'")) {
      return <span key={i} className="text-accent">{part}</span>;
    }
    if (/^\d+$/.test(part)) {
      return <span key={i} className="text-neon-orange">{part}</span>;
    }
    return part;
  });
}
