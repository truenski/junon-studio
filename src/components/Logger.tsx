import { AlertCircle } from "lucide-react";
import type { ValidationError } from "@/hooks/useJunonSyntax";

interface LoggerProps {
  errors: ValidationError[];
  onErrorClick?: (line: number) => void;
}

export function Logger({ errors, onErrorClick }: LoggerProps) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No validation errors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-2 p-2">
        {errors.map((error, index) => (
          <button
            key={index}
            onClick={() => onErrorClick?.(error.line)}
            className="w-full text-left p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors group"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-destructive font-semibold">
                    Line {error.line + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Column {error.column + 1}
                  </span>
                </div>
                <p className="text-sm text-foreground group-hover:text-destructive transition-colors">
                  {error.message}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

