import { BaseService } from '../base/BaseService';
import type { IAutocompleteService, CompletionProvider, CompletionItem, CompletionContext } from './IAutocompleteService';
import type { Position } from '../../core/types';
import { EditorEvents } from '../../core/EditorEvents';

export class AutocompleteService extends BaseService implements IAutocompleteService {
  id = 'autocomplete';
  name = 'Autocomplete Service';
  version = '1.0.0';

  private providers: Map<string, CompletionProvider> = new Map();

  registerProvider(language: string, provider: CompletionProvider): void {
    this.providers.set(language, provider);
  }

  async getCompletions(
    code: string,
    position: Position,
    language: string,
    context: CompletionContext
  ): Promise<CompletionItem[]> {
    const provider = this.providers.get(language);
    if (!provider) {
      return [];
    }

    const items = await provider.getCompletions(code, position, language, context);
    
    const ctx = this.getContext();
    ctx.events.emit(EditorEvents.COMPLETION_READY, { items });
    
    return items;
  }

  async resolveCompletion(item: CompletionItem): Promise<CompletionItem> {
    // Try to resolve from any provider
    for (const provider of this.providers.values()) {
      if (provider.resolveCompletion) {
        try {
          return await provider.resolveCompletion(item);
        } catch (error) {
          // Continue to next provider
        }
      }
    }
    return item;
  }
}

