import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Play, Save, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectionBubble } from "./AiSelectionBubble";
import { 
  validateJunonCode, 
  getSuggestionContext, 
  getAutoIndent,
  TRIGGER_EVENTS,
  COMMANDS,
  ValidationError 
} from "@/hooks/useJunonSyntax";

const defaultCode = `@trigger onPlayerJoin
    @commands
        /chat Welcome to the game!
        /give sword 1
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer 5000
        /chat 5 seconds passed`;

export function CodeEditor() {
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
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const codeDisplayRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileNameInputRef = useRef<HTMLInputElement>(null);

  // Validate code on change
  useEffect(() => {
    const validationErrors = validateJunonCode(code);
    setErrors(validationErrors);
  }, [code]);

  // Update suggestions based on cursor position
  const updateSuggestions = useCallback(() => {
    if (!editorRef.current) return;
    const cursorPos = editorRef.current.selectionStart;
    const context = getSuggestionContext(code, cursorPos);
    setSuggestions(context.suggestions);
    setSuggestionType(context.type);
    setShowSuggestions(context.suggestions.length > 0);
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
    // Handle Enter key for auto-indent
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;
      
      const cursorPos = textarea.selectionStart;
      const indent = getAutoIndent(code, cursorPos);
      const newCode = code.slice(0, cursorPos) + '\n' + indent + code.slice(cursorPos);
      setCode(newCode);
      
      // Set cursor position after indent
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + indent.length;
      }, 0);
      return;
    }

    // Handle suggestion navigation
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
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Tab for manual indent
    if (e.key === 'Tab') {
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

  const handleQuickInsert = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const newCode = code.slice(0, cursorPos) + text + code.slice(cursorPos);
    setCode(newCode);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursorPos + text.length;
      textarea.focus();
    }, 0);
  };

  const getQuickSuggestions = () => {
    switch (suggestionType) {
      case 'trigger':
        return TRIGGER_EVENTS.slice(0, 4).map(e => ({ label: e, value: e }));
      case 'command':
        return COMMANDS.slice(0, 4).map(c => ({ label: c, value: c }));
      default:
        return [
          { label: '@trigger', value: '@trigger ' },
          { label: '@commands', value: '\n    @commands\n        ' },
          { label: '@if', value: '\n    @if ' },
          { label: '@timer', value: '\n    @timer ' },
        ];
    }
  };

  const handleFileNameSubmit = () => {
    setIsEditingFileName(false);
    if (!fileName.trim()) {
      setFileName("main");
    }
  };

  useEffect(() => {
    if (isEditingFileName && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
      fileNameInputRef.current.select();
    }
  }, [isEditingFileName]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 glass-panel">
        <div className="flex items-center gap-2">
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
            <span className="text-xs text-destructive">{errors.length} error(s)</span>
          )}
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
      <div className="flex-1 relative overflow-hidden bg-background">
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
          className="absolute inset-0 pl-14 pr-4 pt-4 pb-20 font-mono text-sm leading-6 whitespace-pre overflow-hidden pointer-events-none"
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
          className="absolute inset-0 pl-14 pr-4 pt-4 pb-20 font-mono text-sm leading-6 bg-transparent text-transparent caret-primary resize-none focus:outline-none overflow-auto z-20"
          spellCheck={false}
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
          {getQuickSuggestions().map(({ label, value }) => (
            <button
              key={label}
              onClick={() => handleQuickInsert(value)}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-primary transition-colors"
            >
              {label}
            </button>
          ))}
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
