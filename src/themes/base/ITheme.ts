export interface ThemeColors {
  // Editor
  'editor.background': string;
  'editor.foreground': string;
  'editor.selectionBackground': string;
  'editor.lineHighlightBackground': string;
  'editorCursor.foreground': string;
  
  // Line numbers
  'editorLineNumber.foreground': string;
  'editorLineNumber.activeForeground': string;
  
  // Status bar
  'statusBar.background': string;
  'statusBar.foreground': string;
  
  // Error/Warning
  'editorError.foreground': string;
  'editorWarning.foreground': string;
  'editorInfo.foreground': string;
  
  // Scrollbar
  'scrollbar.shadow': string;
  'scrollbarSlider.background': string;
  'scrollbarSlider.hoverBackground': string;
  
  // More colors can be added as needed
  [key: string]: string;
}

export interface TokenColors {
  [scope: string]: {
    foreground?: string;
    background?: string;
    fontStyle?: 'italic' | 'bold' | 'underline' | 'italic bold' | 'bold italic';
  };
}

export interface ThemeStyles {
  editor?: React.CSSProperties;
  lineNumbers?: React.CSSProperties;
  statusBar?: React.CSSProperties;
  [key: string]: React.CSSProperties | undefined;
}

export interface ITheme {
  name: string;
  type: 'light' | 'dark';
  colors: ThemeColors;
  tokens: TokenColors;
  styles?: ThemeStyles;
}

