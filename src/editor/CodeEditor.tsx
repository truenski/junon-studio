import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EditorProvider, useEditorContext } from './providers/EditorProvider';
import { useTextEditor } from './core/useTextEditor';
import { useService } from './hooks/useService';
import { useEvent } from './hooks/useEvent';
import { EditorEvents } from './core/EditorEvents';
import type { ILanguagePlugin } from '../languages/base/ILanguagePlugin';
import type { ITheme } from '../themes/base/ITheme';
import type { IHighlightingService } from './services/highlighting/IHighlightingService';
import type { IValidationService } from './services/validation/IValidationService';
import type { IAutocompleteService } from './services/autocomplete/IAutocompleteService';
import type { Diagnostic } from './services/validation/IValidationService';

export interface CodeEditorProps {
  language?: ILanguagePlugin;
  theme?: ITheme;
  initialValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

function CodeEditorInner({
  initialValue = '',
  onChange,
  className,
  style,
}: Omit<CodeEditorProps, 'language' | 'theme'>) {
  const { services, language, theme, initialized, events } = useEditorContext();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const codeDisplayRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const highlightingService = useService<IHighlightingService>('highlighting');
  const validationService = useService<IValidationService>('validation');
  const autocompleteService = useService<IAutocompleteService>('autocomplete');

  const {
    value,
    editorRef,
    handleChange,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    handleScroll,
    getPosition,
  } = useTextEditor({
    initialValue,
    events,
    onValueChange: (newValue) => {
      onChange?.(newValue);
    },
  });

  // Listen to validation events
  useEvent<{ diagnostics: Diagnostic[] }>(
    EditorEvents.VALIDATION_COMPLETE,
    (data) => {
      setDiagnostics(data.diagnostics);
    }
  );

  // Validate on value change
  useEffect(() => {
    if (!initialized || !validationService || !language) return;
    
    const result = validationService.validate(value, language.id);
    setDiagnostics(result.diagnostics);
  }, [value, initialized, validationService, language]);

  // Handle autocomplete
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '$' || e.key === '@' || e.key === '/') {
      // Trigger autocomplete
      if (autocompleteService && language) {
        const position = getPosition();
        const context = {
          type: 'none' as const,
          partial: '',
          line: position.line,
          column: position.column,
          lineText: value.split('\n')[position.line] || '',
          beforeCursor: value.substring(0, editorRef.current?.selectionStart || 0),
          afterCursor: value.substring(editorRef.current?.selectionEnd || 0),
        };
        
        const items = await autocompleteService.getCompletions(value, position, language.id, context);
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      }
    }
  }, [autocompleteService, language, value, getPosition]);

  // Render highlighted code
  const renderHighlightedCode = () => {
    if (!highlightingService || !language) {
      return value.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ));
    }

    const highlighted = highlightingService.highlight(value, language.id, theme);
    return highlighted.map((line, i) => (
      <div key={i} className="min-h-[24px]">
        {line.tokens.map((token, j) => (
          <span key={j} className={token.className} style={token.style}>
            {token.text}
          </span>
        ))}
      </div>
    ));
  };

  return (
    <div className={`relative flex h-full ${className || ''}`} style={style}>
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-muted/30 border-r border-border/30 overflow-y-auto overflow-x-hidden select-none z-50"
      >
        <div className="pt-4 pr-2 text-right">
          {value.split('\n').map((_, i) => (
            <div
              key={i}
              className={`leading-6 text-sm font-mono ${
                diagnostics.some(d => d.range.start.line === i)
                  ? 'text-destructive'
                  : 'text-muted-foreground/50'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 relative overflow-auto">
        {/* Code display layer */}
        <pre
          ref={codeDisplayRef}
          className="absolute inset-0 pl-4 pr-4 pt-4 pb-4 font-mono text-sm leading-6 whitespace-pre overflow-auto pointer-events-none z-0"
          aria-hidden="true"
        >
          {renderHighlightedCode()}
        </pre>

        {/* Editable textarea */}
        <textarea
          ref={editorRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelectionChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 pl-4 pr-4 pt-4 pb-4 font-mono text-sm leading-6 bg-transparent text-transparent caret-primary resize-none focus:outline-none overflow-auto z-10 whitespace-pre"
          spellCheck={false}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-14 top-10 z-30 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-muted transition-colors"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeEditor({
  language,
  theme,
  ...props
}: CodeEditorProps) {
  return (
    <EditorProvider language={language} theme={theme}>
      <CodeEditorInner {...props} />
    </EditorProvider>
  );
}

