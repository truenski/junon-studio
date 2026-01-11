import React from 'react';
import { useTextEditor } from './useTextEditor';
import type { UseTextEditorOptions } from './useTextEditor';

export interface TextEditorProps extends UseTextEditorOptions {
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  readOnly?: boolean;
  spellCheck?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const TextEditor = React.forwardRef<HTMLTextAreaElement, TextEditorProps>(({
  className,
  style,
  placeholder,
  readOnly = false,
  spellCheck = false,
  onKeyDown,
  ...options
}, ref) => {
  const {
    value,
    editorRef,
    handleChange,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    handleScroll,
  } = useTextEditor(options);

  // Merge refs
  React.useImperativeHandle(ref, () => editorRef.current as HTMLTextAreaElement);

  return (
    <textarea
      ref={editorRef}
      value={value}
      onChange={handleChange}
      onSelect={handleSelectionChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onScroll={handleScroll}
      onKeyDown={onKeyDown}
      className={className}
      style={style}
      placeholder={placeholder}
      readOnly={readOnly}
      spellCheck={spellCheck}
    />
  );
});

TextEditor.displayName = 'TextEditor';

