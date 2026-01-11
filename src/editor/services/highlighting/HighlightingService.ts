import { BaseService } from '../base/BaseService';
import type { IHighlightingService, Highlighter, HighlightedLine, Token } from './IHighlightingService';
import type { Position } from '../../core/types';
import { EditorEvents } from '../../core/EditorEvents';

export class HighlightingService extends BaseService implements IHighlightingService {
  id = 'highlighting';
  name = 'Highlighting Service';
  version = '1.0.0';

  private highlighters: Map<string, Highlighter> = new Map();

  registerLanguage(language: string, highlighter: Highlighter): void {
    this.highlighters.set(language, highlighter);
  }

  highlight(code: string, language: string, theme?: any): HighlightedLine[] {
    const highlighter = this.highlighters.get(language);
    if (!highlighter) {
      // Return default highlighting (no highlighting)
      return code.split('\n').map((line, index) => ({
        line: index,
        tokens: [{ text: line, type: 'text' }],
      }));
    }

    const result = highlighter.highlight(code, language);
    
    const context = this.getContext();
    context.events.emit(EditorEvents.HIGHLIGHTING_COMPLETE, { lines: result });
    
    return result;
  }

  getTokenAt(code: string, position: Position, language: string): Token | null {
    const highlighter = this.highlighters.get(language);
    if (!highlighter) {
      return null;
    }

    return highlighter.getTokenAt(code, position, language);
  }
}

