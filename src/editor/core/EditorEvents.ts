// Sistema de eventos do editor

export enum EditorEvents {
  // Texto
  TEXT_CHANGED = 'text.changed',
  CURSOR_MOVED = 'cursor.moved',
  SELECTION_CHANGED = 'selection.changed',
  
  // Serviços
  VALIDATION_COMPLETE = 'validation.complete',
  HIGHLIGHTING_COMPLETE = 'highlighting.complete',
  COMPLETION_READY = 'completion.ready',
  FORMATTING_COMPLETE = 'formatting.complete',
  FOLDING_COMPLETE = 'folding.complete',
  SEARCH_COMPLETE = 'search.complete',
  
  // UI
  FOCUS = 'editor.focus',
  BLUR = 'editor.blur',
  SCROLL = 'editor.scroll',
  
  // Extensões
  EXTENSION_ACTIVATED = 'extension.activated',
  EXTENSION_DEACTIVATED = 'extension.deactivated',
  
  // Comandos
  COMMAND_EXECUTED = 'command.executed',
}

export interface TextChangedEvent {
  value: string;
  previousValue: string;
}

export interface CursorMovedEvent {
  position: { line: number; column: number };
}

export interface SelectionChangedEvent {
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
    isEmpty: boolean;
  };
}

export interface ValidationCompleteEvent {
  diagnostics: any[];
}

export interface HighlightingCompleteEvent {
  lines: any[];
}

export interface CompletionReadyEvent {
  items: any[];
}

