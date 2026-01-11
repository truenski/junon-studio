import { Theme } from '../base/Theme';
import type { ThemeColors, TokenColors } from '../base/ITheme';

export class DefaultTheme extends Theme {
  name = 'default';
  type: 'light' | 'dark' = 'dark';

  colors: ThemeColors = {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.selectionBackground': '#264f78',
    'editor.lineHighlightBackground': '#2a2d2e',
    'editorCursor.foreground': '#aeafad',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'statusBar.background': '#007acc',
    'statusBar.foreground': '#ffffff',
    'editorError.foreground': '#f48771',
    'editorWarning.foreground': '#cca700',
    'editorInfo.foreground': '#75beff',
    'scrollbar.shadow': '#000000',
    'scrollbarSlider.background': '#424242',
    'scrollbarSlider.hoverBackground': '#4e4e4e',
  };

  tokens: TokenColors = {
    'keyword': {
      foreground: '#569cd6',
      fontStyle: 'bold',
    },
    'string': {
      foreground: '#ce9178',
    },
    'comment': {
      foreground: '#6a9955',
      fontStyle: 'italic',
    },
    'number': {
      foreground: '#b5cea8',
    },
    'function': {
      foreground: '#dcdcaa',
    },
    'variable': {
      foreground: '#9cdcfe',
    },
    'operator': {
      foreground: '#d4d4d4',
    },
  };
}

