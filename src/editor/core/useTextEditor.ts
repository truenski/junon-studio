import { useState, useRef, useCallback, useEffect } from 'react';
import { EditorState } from './EditorState';
import { EventEmitter } from './EventEmitter';
import { EditorEvents } from './EditorEvents';
import type { Position, Selection } from './types';

export interface UseTextEditorOptions {
  initialValue?: string;
  events?: EventEmitter;
  onValueChange?: (value: string) => void;
  onPositionChange?: (position: Position) => void;
  onSelectionChange?: (selection: Selection) => void;
}

export function useTextEditor(options: UseTextEditorOptions = {}) {
  const {
    initialValue = '',
    events,
    onValueChange,
    onPositionChange,
    onSelectionChange,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [position, setPosition] = useState<Position>({ line: 0, column: 0 });
  const [selection, setSelection] = useState<Selection>({
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
    isEmpty: true,
  });
  const [focused, setFocused] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const stateRef = useRef(new EditorState());

  // Update state when value changes
  useEffect(() => {
    stateRef.current.setValue(value);
    if (events) {
      events.emit(EditorEvents.TEXT_CHANGED, { value, previousValue: stateRef.current.getValue() });
    }
    onValueChange?.(value);
  }, [value, events, onValueChange]);

  // Update position when it changes
  useEffect(() => {
    stateRef.current.setPosition(position);
    if (events) {
      events.emit(EditorEvents.CURSOR_MOVED, { position });
    }
    onPositionChange?.(position);
  }, [position, events, onPositionChange]);

  // Update selection when it changes
  useEffect(() => {
    stateRef.current.setSelection(selection);
    if (events) {
      events.emit(EditorEvents.SELECTION_CHANGED, { selection });
    }
    onSelectionChange?.(selection);
  }, [selection, events, onSelectionChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Update cursor position
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const lines = newValue.substring(0, cursorPos).split('\n');
    const newPosition: Position = {
      line: lines.length - 1,
      column: lines[lines.length - 1]?.length || 0,
    };
    setPosition(newPosition);
  }, []);

  const handleSelectionChange = useCallback(() => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const startLines = text.substring(0, start).split('\n');
    const endLines = text.substring(0, end).split('\n');

    const newSelection: Selection = {
      start: {
        line: startLines.length - 1,
        column: startLines[startLines.length - 1]?.length || 0,
      },
      end: {
        line: endLines.length - 1,
        column: endLines[endLines.length - 1]?.length || 0,
      },
      isEmpty: start === end,
    };

    setSelection(newSelection);

    // Update position to selection start
    setPosition(newSelection.start);
  }, []);

  const handleFocus = useCallback(() => {
    setFocused(true);
    if (events) {
      events.emit(EditorEvents.FOCUS);
    }
  }, [events]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (events) {
      events.emit(EditorEvents.BLUR);
    }
  }, [events]);

  const handleScroll = useCallback(() => {
    if (events) {
      const textarea = editorRef.current;
      if (textarea) {
        events.emit(EditorEvents.SCROLL, {
          scrollTop: textarea.scrollTop,
          scrollLeft: textarea.scrollLeft,
        });
      }
    }
  }, [events]);

  const getValue = useCallback(() => value, [value]);
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    stateRef.current.setValue(newValue);
  }, []);

  const getPosition = useCallback(() => position, [position]);
  const updatePosition = useCallback((newPosition: Position) => {
    setPosition(newPosition);
    stateRef.current.setPosition(newPosition);
    
    // Update textarea cursor position
    const textarea = editorRef.current;
    if (textarea) {
      const offset = stateRef.current.getOffset(newPosition);
      textarea.selectionStart = textarea.selectionEnd = offset;
    }
  }, []);

  const getSelection = useCallback(() => selection, [selection]);
  const updateSelection = useCallback((newSelection: Selection) => {
    setSelection(newSelection);
    stateRef.current.setSelection(newSelection);
    
    // Update textarea selection
    const textarea = editorRef.current;
    if (textarea) {
      const startOffset = stateRef.current.getOffset(newSelection.start);
      const endOffset = stateRef.current.getOffset(newSelection.end);
      textarea.selectionStart = startOffset;
      textarea.selectionEnd = endOffset;
    }
  }, []);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    editorRef.current?.blur();
  }, []);

  return {
    value,
    position,
    selection,
    focused,
    editorRef,
    state: stateRef.current,
    handleChange,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    handleScroll,
    getValue,
    setValue: updateValue,
    getPosition,
    setPosition: updatePosition,
    getSelection,
    setSelection: updateSelection,
    focus,
    blur,
  };
}

