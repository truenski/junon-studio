import { AutocompleteService } from '../../../editor/services/autocomplete/AutocompleteService';
import type { CompletionItem, CompletionContext } from '../../../editor/services/autocomplete/IAutocompleteService';
import type { Position } from '../../../editor/core/types';
import { getSuggestionContext } from '@/hooks/useJunonSyntax';

export class JunonAutocompleteService extends AutocompleteService {
  override id = 'junon-autocomplete';
  override name = 'Junon Autocomplete Service';
  override version = '1.0.0';

  override async getCompletions(
    code: string,
    position: Position,
    language: string,
    context: CompletionContext
  ): Promise<CompletionItem[]> {
    // Convert position to offset
    const lines = code.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    offset += position.column;

    const suggestionContext = getSuggestionContext(code, offset);
    
    const items: CompletionItem[] = suggestionContext.suggestions.map(suggestion => ({
      label: suggestion,
      kind: this.getCompletionKind(suggestionContext.type),
      insertText: suggestion,
      detail: this.getDetail(suggestion, suggestionContext.type),
    }));

    return items;
  }

  private getCompletionKind(type: string): CompletionItem['kind'] {
    switch (type) {
      case 'trigger':
        return 'event';
      case 'command':
        return 'method';
      case 'function':
        return 'function';
      case 'variable':
        return 'variable';
      case 'keyword':
        return 'keyword';
      default:
        return 'text';
    }
  }

  private getDetail(suggestion: string, type: string): string | undefined {
    // Could be enhanced to fetch from MDX data
    return undefined;
  }
}

