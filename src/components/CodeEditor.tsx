import { useState, useRef, useEffect, useCallback } from "react";
import { Save, Copy, ChevronUp, ChevronDown, AlertCircle, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectionBubble } from "./AiSelectionBubble";
import { Logger } from "./Logger";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { 
  validateJunonCode, 
  getSuggestionContext, 
  getAutoIndent,
  convertJunonToJSON,
  initializeMDXData,
  TRIGGER_EVENTS,
  COMMANDS,
} from "@/hooks/useJunonSyntax";
import type { ValidationError } from "@/hooks/useJunonSyntax";
import { saveFile, type TemporaryFile } from "@/lib/fileStorage";

interface CodeEditorProps {
  currentFile: TemporaryFile | null;
  onFileChange?: (file: TemporaryFile) => void;
}

const defaultCode = `@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer 5000
        /chat 5 seconds passed`;

export function CodeEditor({ currentFile, onFileChange }: CodeEditorProps = {}) {
  const [code, setCode] = useState(defaultCode);
  const [fileName, setFileName] = useState("main");
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAiBubble, setShowAiBubble] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<string>('none');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomPanelMode, setBottomPanelMode] = useState<"quick" | "logger">("quick");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const codeDisplayRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileNameInputRef = useRef<HTMLInputElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Initialize MDX data on mount
  useEffect(() => {
    initializeMDXData().catch(console.error);
  }, []);

  // Update code when current file changes
  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content);
      setFileName(currentFile.name);
    }
  }, [currentFile?.id]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!currentFile) return;
    
    const timeoutId = setTimeout(() => {
      const updatedFile = { ...currentFile, content: code };
      saveFile(updatedFile);
      onFileChange?.(updatedFile);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [code, currentFile?.id, onFileChange]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile && errors.length === 0) {
          const updatedFile = { ...currentFile, content: code };
          saveFile(updatedFile);
          onFileChange?.(updatedFile);
          toast({
            title: "Saved",
            description: `File "${currentFile.name}" saved successfully`,
          });
        } else if (errors.length > 0) {
          toast({
            title: "Cannot save",
            description: "Fix errors before saving",
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, currentFile, errors.length, onFileChange, toast]);

  // Validate code on change
  useEffect(() => {
    const validationErrors = validateJunonCode(code);
    setErrors(validationErrors);
  }, [code]);

  // Update suggestions based on cursor position (only auto for @trigger)
  const updateSuggestions = useCallback((forceShow = false) => {
    if (!editorRef.current) return;
    const cursorPos = editorRef.current.selectionStart;
    const context = getSuggestionContext(code, cursorPos);
    setSuggestions(context.suggestions);
    setSuggestionType(context.type);
    // Only auto-show for trigger suggestions; others require manual trigger
    const shouldAutoShow = context.type === 'trigger' && context.suggestions.length > 0;
    setShowSuggestions(forceShow ? context.suggestions.length > 0 : shouldAutoShow);
    setSelectedSuggestionIndex(0);
  }, [code]);

  // Sync scroll between textarea and display
  const handleScroll = useCallback(() => {
    if (!editorRef.current) return;
    const scrollTop = editorRef.current.scrollTop;
    const scrollLeft = editorRef.current.scrollLeft;
    
    if (codeDisplayRef.current) {
      codeDisplayRef.current.scrollTop = scrollTop;
      codeDisplayRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestion navigation first (only when suggestions are visible)
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Handle Enter key for auto-indent - apenas quando necessário
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      const textarea = editorRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const indent = getAutoIndent(code, cursorPos);
        
        // Apenas prevenir se realmente houver indentação a aplicar
        if (indent.length > 0) {
          e.preventDefault();
          const newCode = code.slice(0, cursorPos) + '\n' + indent + code.slice(cursorPos);
          setCode(newCode);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + indent.length;
          }, 0);
          return;
        }
      }
      // Se não precisar de auto-indent, deixar o Enter funcionar normalmente
    }

    // Tab for manual indent (only when not in suggestions)
    if (e.key === 'Tab' && !showSuggestions) {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;
      
      const cursorPos = textarea.selectionStart;
      const newCode = code.slice(0, cursorPos) + '    ' + code.slice(cursorPos);
      setCode(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 4;
      }, 0);
    }

    // Manual autocomplete trigger (Ctrl+Space or Alt+Space)
    if (e.key === ' ' && (e.ctrlKey || e.altKey)) {
      e.preventDefault();
      updateSuggestions(true);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const beforeCursor = code.slice(0, cursorPos);
    const afterCursor = code.slice(cursorPos);
    
    // Find the partial text to replace
    let replaceStart = cursorPos;
    if (suggestionType === 'trigger') {
      const match = beforeCursor.match(/@trigger\s+(\w*)$/);
      if (match) {
        replaceStart = cursorPos - match[1].length;
      }
    } else if (suggestionType === 'command') {
      const match = beforeCursor.match(/(\/\w*)$/);
      if (match) {
        replaceStart = cursorPos - match[1].length;
      }
    } else if (suggestionType === 'condition') {
      const match = beforeCursor.match(/@if\s+(\w*)$/);
      if (match) {
        replaceStart = cursorPos - match[1].length;
      }
    }
    
    const newCode = code.slice(0, replaceStart) + suggestion + afterCursor;
    setCode(newCode);
    setShowSuggestions(false);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = replaceStart + suggestion.length;
      textarea.focus();
    }, 0);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    updateSuggestions();
  };

  const handleClick = () => {
    updateSuggestions();
  };

  const handleQuickInsert = useCallback((text: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const beforeCursor = code.slice(0, cursorPos);
    const afterCursor = code.slice(cursorPos);
    
    // Check if there's a partial @ keyword that should be replaced
    // Look for @ followed by optional word chars and optional trailing whitespace
    const lineMatch = beforeCursor.match(/(@\w*\s*)$/);
    let replaceStart = cursorPos;
    let insertText = text;
    
    if (lineMatch) {
      // Found a partial @ keyword, replace it (including any trailing spaces)
      const partialMatch = lineMatch[1];
      replaceStart = cursorPos - partialMatch.length;
      
      // Remove leading newline from text if we're replacing on the same line
      if (text.startsWith('\n') && !beforeCursor.endsWith('\n')) {
        insertText = text.slice(1);
      }
    } else {
      // No partial match, but check if we should remove leading newline
      // if we're at the start of a line or after whitespace
      if (text.startsWith('\n') && (beforeCursor.trimEnd().endsWith('\n') || beforeCursor.trim() === '')) {
        insertText = text.slice(1);
      }
    }
    
    const newCode = code.slice(0, replaceStart) + insertText + afterCursor;
    setCode(newCode);
    
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = replaceStart + insertText.length;
        textarea.focus();
      }
    }, 0);
  }, [code]);

  const getQuickSuggestions = () => {
    switch (suggestionType) {
      case 'trigger':
        return TRIGGER_EVENTS.slice(0, 4).map(e => ({ label: e, value: e }));
      default:
        return [
          { label: '@trigger', value: '\n@trigger ' },
          { label: '@commands', value: '\n    @commands\n        ' },
          { 
            label: '@if', 
            value: '\n    @if player.health == 100\n        then /chat Player is at full health\n        elseif player.health != 100\n        then /heal player' 
          },
          { 
            label: '@timer', 
            value: '\n    @timer 5000\n        /chat 5 seconds passed' 
          },
        ];
    }
  };

  const handleFileNameSubmit = () => {
    setIsEditingFileName(false);
    if (!fileName.trim()) {
      setFileName("main");
    }
    
    // Update file name in storage
    if (currentFile) {
      const updatedFile = { ...currentFile, name: fileName.trim() || "main" };
      saveFile(updatedFile);
      onFileChange?.(updatedFile);
    }
  };

  useEffect(() => {
    if (isEditingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
      fileNameInputRef.current.select();
    }
  }, [isEditingFileName]);

  // Auto-open logger panel when errors appear
  useEffect(() => {
    if (errors.length > 0 && !bottomPanelOpen) {
      setBottomPanelMode("logger");
      setBottomPanelOpen(true);
    }
  }, [errors.length, bottomPanelOpen]);

  const handleErrorClick = (line: number) => {
    if (!editorRef.current) return;
    const lines = code.split('\n');
    let position = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    editorRef.current.selectionStart = editorRef.current.selectionEnd = position;
    editorRef.current.focus();
    editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = () => {
    if (errors.length > 0) return;
    
    try {
      const jsonData = convertJunonToJSON(code);
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Saved successfully",
        description: `Code saved as ${fileName}.json`,
      });
    } catch (error) {
      toast({
        title: "Error saving file",
        description: "Failed to convert code to JSON",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Code copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 glass-panel">
        <div className="flex items-center gap-2 ml-4">
          {isEditingFileName ? (
            <div className="flex items-center">
              <input
                ref={fileNameInputRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                onBlur={handleFileNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFileNameSubmit();
                  if (e.key === 'Escape') {
                    setIsEditingFileName(false);
                  }
                }}
                className="text-xs text-muted-foreground font-mono bg-transparent border-b border-primary focus:outline-none w-20"
                maxLength={20}
              />
              <span className="text-xs text-muted-foreground font-mono">.junon</span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingFileName(true)}
              className="text-xs text-muted-foreground font-mono hover:text-primary transition-colors"
            >
              {fileName}.junon
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {errors.length > 0 && (
            <button
              onClick={() => {
                setBottomPanelMode("logger");
                setBottomPanelOpen(true);
              }}
              className="text-xs text-destructive hover:underline cursor-pointer"
            >
              {errors.length} error(s)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mr-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary"
            onClick={handleCopy}
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={errors.length > 0}
            title={errors.length > 0 ? "Fix errors before saving" : "Save code as JSON"}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Area with Resizable Bottom Panel */}
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={100} minSize={30} maxSize={100}>
          <div className="h-full relative overflow-auto bg-background">
        {/* Line numbers - fixed position */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r border-border/30 overflow-hidden select-none z-10"
        >
          <div className="pt-4 pr-2 text-right">
            {code.split('\n').map((_, i) => (
              <div 
                key={i} 
                className={`leading-6 text-sm font-mono ${
                  errors.some(e => e.line === i) 
                    ? 'text-destructive' 
                    : 'text-muted-foreground/50'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Code display layer */}
        <pre 
          ref={codeDisplayRef}
          className="absolute inset-0 pl-14 pr-4 pt-4 pb-4 font-mono text-sm leading-6 whitespace-pre overflow-auto pointer-events-none"
          aria-hidden="true"
        >
          {code.split('\n').map((line, lineIndex) => (
            <div key={lineIndex} className="min-h-[24px] relative">
              {highlightLine(line, lineIndex, errors)}
            </div>
          ))}
        </pre>

        {/* Editable textarea */}
        <textarea
          ref={editorRef}
          value={code}
          onChange={handleCodeChange}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 pl-14 pr-4 pt-4 pb-4 font-mono text-sm leading-6 bg-transparent text-transparent caret-primary resize-none focus:outline-none overflow-auto z-20 whitespace-pre"
          spellCheck={false}
          autoFocus
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-14 top-10 z-30 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                onClick={() => insertSuggestion(suggestion)}
                className={`w-full text-left px-3 py-2 text-sm font-mono hover:bg-muted transition-colors ${
                  i === selectedSuggestionIndex ? 'bg-muted text-primary' : 'text-foreground'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
          </div>
        </ResizablePanel>

        {bottomPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={10} maxSize={60}>
              <div className="h-full flex flex-col glass-panel border-t border-border/50">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBottomPanelMode("quick")}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-ui transition-colors ${
                        bottomPanelMode === "quick"
                          ? "bg-primary/10 text-primary neon-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      Quick
                    </button>
                    <button
                      onClick={() => setBottomPanelMode("logger")}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-ui transition-colors ${
                        bottomPanelMode === "logger"
                          ? "bg-destructive/10 text-destructive neon-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      Logger
                      {errors.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px]">
                          {errors.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setBottomPanelOpen(false)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  {bottomPanelMode === "quick" ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getQuickSuggestions().map(({ label, value }) => (
                          <button
                            key={label}
                            onClick={() => handleQuickInsert(value)}
                            className="text-xs px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-primary transition-colors font-mono"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Logger errors={errors} onErrorClick={handleErrorClick} />
                  )}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Panel Toggle Button (when closed) */}
      {!bottomPanelOpen && (
        <div className="border-t border-border/50 glass-panel">
          <button
            onClick={() => {
              setBottomPanelOpen(true);
              if (errors.length > 0) {
                setBottomPanelMode("logger");
              } else {
                setBottomPanelMode("quick");
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="font-ui">
              {errors.length > 0 ? (
                <>
                  <AlertCircle className="w-3 h-3 inline mr-1 text-destructive" />
                  {errors.length} error(s) - Click to view Logger
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 inline mr-1" />
                  Quick - Click to open
                </>
              )}
            </span>
          </button>
        </div>
      )}

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

function highlightLine(line: string, lineIndex: number, errors: ValidationError[]): React.ReactNode {
  const lineErrors = errors.filter(e => e.line === lineIndex);
  
  // Check for @ keywords
  const atKeywords = ['@trigger', '@commands', '@if', '@timer', '@event'];
  const controlWords = ['then', 'elseif'];
  
  let result: React.ReactNode[] = [];
  let remaining = line;
  let position = 0;
  
  // Process the line character by character for proper highlighting
  const parts: { text: string; type: string; hasError: boolean }[] = [];
  
  // Simple tokenizer
  const tokens = remaining.split(/(\s+|@\w+|\/\w+|==|!=)/g).filter(Boolean);
  
  tokens.forEach(token => {
    const tokenStart = line.indexOf(token, position);
    const hasError = lineErrors.some(e => 
      tokenStart >= e.column && tokenStart < e.column + e.length
    );
    
    let type = 'normal';
    
    if (atKeywords.includes(token)) {
      type = token === '@event' ? 'deprecated' : 'keyword';
    } else if (controlWords.includes(token)) {
      type = 'control';
    } else if (token.startsWith('/')) {
      type = 'command';
    } else if (token === '==' || token === '!=') {
      type = 'operator';
    } else if (/^\d+$/.test(token)) {
      type = 'number';
    } else if (token.startsWith('player.') || token.startsWith('entity.') || token.startsWith('game.')) {
      type = 'condition';
    }
    
    parts.push({ text: token, type, hasError });
    position = tokenStart + token.length;
  });
  
  return (
    <span>
      {parts.map((part, i) => {
        let className = '';
        
        switch (part.type) {
          case 'keyword':
            className = 'text-secondary font-semibold';
            break;
          case 'deprecated':
            className = 'text-destructive line-through';
            break;
          case 'control':
            className = 'text-accent font-semibold';
            break;
          case 'command':
            className = 'text-primary';
            break;
          case 'operator':
            className = 'text-neon-purple';
            break;
          case 'number':
            className = 'text-neon-orange';
            break;
          case 'condition':
            className = 'text-neon-cyan';
            break;
          default:
            className = 'text-foreground';
        }
        
        if (part.hasError) {
          return (
            <span 
              key={i} 
              className={`${className} underline decoration-wavy decoration-destructive`}
              title={lineErrors.find(e => line.indexOf(part.text) >= e.column)?.message}
            >
              {part.text}
            </span>
          );
        }
        
        return <span key={i} className={className}>{part.text}</span>;
      })}
    </span>
  );
}
