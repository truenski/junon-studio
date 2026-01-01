import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  side: "left" | "right";
  children: ReactNode;
}

export function CollapsiblePanel({ title, isOpen, onToggle, side, children }: CollapsiblePanelProps) {
  const ChevronIcon = side === "left" 
    ? (isOpen ? ChevronLeft : ChevronRight)
    : (isOpen ? ChevronRight : ChevronLeft);

  return (
    <div 
      className={`relative h-full transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-10"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute top-4 z-10 w-6 h-12 glass-panel neon-border flex items-center justify-center hover:bg-primary/10 transition-colors ${
          side === "left" ? "-right-3" : "-left-3"
        }`}
      >
        <ChevronIcon className="w-4 h-4 text-primary" />
      </button>

      {/* Panel Content */}
      <div 
        className={`h-full glass-panel overflow-hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        } ${side === "left" ? "border-r border-border/50" : "border-l border-border/50"}`}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-border/30">
              <h3 className="text-xs font-display text-primary uppercase tracking-wider">{title}</h3>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed Label */}
      {!isOpen && (
        <div 
          className={`absolute top-20 w-10 flex items-center justify-center ${
            side === "left" ? "left-0" : "right-0"
          }`}
        >
          <span 
            className="text-xs font-display text-muted-foreground uppercase tracking-wider"
            style={{ 
              writingMode: "vertical-rl", 
              textOrientation: "mixed",
              transform: side === "left" ? "rotate(180deg)" : "none"
            }}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
