import type { ITheme, ThemeColors, TokenColors, ThemeStyles } from './ITheme';

export abstract class Theme implements ITheme {
  abstract name: string;
  abstract type: 'light' | 'dark';
  abstract colors: ThemeColors;
  abstract tokens: TokenColors;
  styles?: ThemeStyles;

  getColor(key: string): string | undefined {
    return this.colors[key];
  }

  getTokenColor(scope: string): TokenColors[string] | undefined {
    return this.tokens[scope];
  }

  getStyle(key: string): React.CSSProperties | undefined {
    return this.styles?.[key];
  }
}

