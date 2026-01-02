import React from "react";
import type { MDXCommand, MDXTrigger, MDXFunction, MDXAction } from "@/lib/mdxLoader";

interface CodeTooltipProps {
  data: MDXCommand | MDXTrigger | MDXFunction | MDXAction | null;
  type: "command" | "trigger" | "function" | "action" | null;
  position: { x: number; y: number };
}

export function CodeTooltip({ data, type, position }: CodeTooltipProps) {
  if (!data || !type) return null;

  const isCommand = type === "command" && "args" in data;
  const isTrigger = type === "trigger" && "variables" in data;
  const isFunction = type === "function" && "parameters" in data;
  const isAction = type === "action";

  // Calculate position to avoid going off screen
  const tooltipWidth = 320;
  const tooltipHeight = 400;
  const padding = 10;
  
  let x = position.x + 15;
  let y = position.y - 10;
  
  // Adjust if tooltip would go off right edge
  if (x + tooltipWidth > window.innerWidth - padding) {
    x = position.x - tooltipWidth - 15;
  }
  
  // Adjust if tooltip would go off bottom edge
  if (y + tooltipHeight > window.innerHeight - padding) {
    y = window.innerHeight - tooltipHeight - padding;
  }
  
  // Adjust if tooltip would go off top edge
  if (y < padding) {
    y = padding;
  }
  
  // Adjust if tooltip would go off left edge
  if (x < padding) {
    x = padding;
  }

  return (
    <div
      className="fixed z-50 w-80 max-h-96 overflow-auto rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Title */}
      <div className="mb-3 border-b border-border pb-2">
        <h3 className="font-semibold text-primary font-mono">
          {isCommand && "/"}
          {data.name}
        </h3>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* Arguments/Parameters/Variables */}
      {(isCommand && data.args && data.args.length > 0) ||
      (isFunction && data.parameters && data.parameters.length > 0) ||
      (isTrigger && data.variables && data.variables.length > 0) ? (
        <div className="mb-3">
          <h4 className="text-xs font-semibold mb-2 text-foreground">
            {isCommand ? "Arguments" : isFunction ? "Parameters" : "Variables"}
          </h4>
          <div className="space-y-1.5">
            {isCommand &&
              data.args.map((arg, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-mono text-primary">
                    {arg.name}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({arg.type}
                    {arg.required ? ", required" : ", optional"})
                  </span>
                  {arg.description && (
                    <p className="text-muted-foreground/80 mt-0.5 ml-2">
                      {arg.description}
                    </p>
                  )}
                </div>
              ))}
            {isFunction &&
              data.parameters &&
              data.parameters.map((param, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-mono text-primary">
                    {param.name}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({param.type}
                    {param.required ? ", required" : ", optional"})
                  </span>
                  {param.description && (
                    <p className="text-muted-foreground/80 mt-0.5 ml-2">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            {isTrigger &&
              data.variables &&
              data.variables.map((variable, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-mono text-primary">
                    ${variable.name}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({variable.type})
                  </span>
                  {variable.description && (
                    <p className="text-muted-foreground/80 mt-0.5 ml-2">
                      {variable.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* Return type for functions */}
      {isFunction && data.returns && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold mb-1 text-foreground">Returns</h4>
          <p className="text-xs text-muted-foreground font-mono">
            {data.returns}
          </p>
        </div>
      )}

      {/* Syntax */}
      {((isCommand && data.syntax && data.syntax.length > 0) ||
        (isFunction && data.syntax) ||
        (isAction && data.syntax && data.syntax.length > 0)) && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold mb-2 text-foreground">Syntax</h4>
          <div className="space-y-1">
            {isCommand &&
              data.syntax.map((syn, idx) => (
                <code
                  key={idx}
                  className="block text-xs bg-muted px-2 py-1 rounded font-mono text-primary"
                >
                  {syn}
                </code>
              ))}
            {isFunction && (
              <code className="block text-xs bg-muted px-2 py-1 rounded font-mono text-primary">
                {data.syntax}
              </code>
            )}
            {isAction &&
              data.syntax &&
              data.syntax.map((syn, idx) => (
                <code
                  key={idx}
                  className="block text-xs bg-muted px-2 py-1 rounded font-mono text-primary"
                >
                  {syn}
                </code>
              ))}
          </div>
        </div>
      )}

      {/* Example */}
      {data.examples && data.examples.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 text-foreground">Example</h4>
          <pre className="text-xs bg-muted/50 p-2 rounded border border-border overflow-x-auto">
            <code className="font-mono text-primary">
              {data.examples[0].code}
            </code>
          </pre>
          {data.examples[0].description && (
            <p className="text-xs text-muted-foreground/80 mt-1">
              {data.examples[0].description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

