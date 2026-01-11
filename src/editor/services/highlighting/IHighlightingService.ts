import type { IService } from '../base/IService';
import type { Position } from '../../core/types';

export interface HighlightedLine {
  line: number;
  tokens: HighlightedToken[];
}

export interface HighlightedToken {
  text: string;
  type: string;
  className?: string;
  style?: React.CSSProperties;
  metadata?: Record<string, any>;
}

export interface Token {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface Highlighter {
  highlight(code: string, language: string): HighlightedLine[];
  getTokenAt(code: string, position: Position, language: string): Token | null;
}

export interface IHighlightingService extends IService {
  highlight(
    code: string,
    language: string,
    theme?: any
  ): HighlightedLine[];

  getTokenAt(
    code: string,
    position: Position,
    language: string
  ): Token | null;

  registerLanguage(language: string, highlighter: Highlighter): void;
}

